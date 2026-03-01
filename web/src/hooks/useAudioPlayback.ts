/**
 * Audio Playback Hook
 * 
 * Handles audio playback for AI voice responses.
 * Processes PCM16 audio chunks from Azure OpenAI Realtime API.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAudioPlaybackOptions {
  sampleRate?: number;
}

export function useAudioPlayback(options: UseAudioPlaybackOptions = {}) {
  const { sampleRate = 24000 } = options;
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate });
    }
    return audioContextRef.current;
  }, [sampleRate]);

  // Convert base64 PCM16 to Float32Array
  const pcm16Base64ToFloat = useCallback((base64: string): Float32Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
    }
    
    return float32;
  }, []);

  // Play the next buffer in queue
  const playNext = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    const audioContext = initAudioContext();
    const buffer = audioQueueRef.current.shift()!;
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
      currentSourceRef.current = null;
      playNext();
    };
    
    currentSourceRef.current = source;
    source.start();
  }, [initAudioContext]);

  // Queue audio chunk for playback
  const queueAudio = useCallback((base64Audio: string) => {
    const audioContext = initAudioContext();
    const float32Data = pcm16Base64ToFloat(base64Audio);
    
    // Create audio buffer
    const audioBuffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Data);
    
    audioQueueRef.current.push(audioBuffer);
    
    // Start playing if not already
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      setIsPlaying(true);
      playNext();
    }
  }, [initAudioContext, pcm16Base64ToFloat, playNext, sampleRate]);

  // Stop playback
  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      currentSourceRef.current.stop();
      currentSourceRef.current = null;
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, []);

  // Clear the queue
  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return {
    isPlaying,
    queueAudio,
    stop,
    clearQueue,
  };
}
