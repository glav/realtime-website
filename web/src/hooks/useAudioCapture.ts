/**
 * Audio Capture Hook
 * 
 * Handles microphone access and audio streaming for voice input.
 * Converts audio to PCM16 format required by Azure OpenAI Realtime API.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getRealtimeService } from '../services/realtimeService';
import { toRealtimeMessage } from '../types/realtime';
import type { InputAudioBufferAppendEvent, InputAudioBufferCommitEvent } from '../types/realtime';

interface UseAudioCaptureOptions {
  onError?: (error: string) => void;
  sampleRate?: number;
}

export function useAudioCapture(options: UseAudioCaptureOptions = {}) {
  const { onError, sampleRate = 24000 } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const serviceRef = useRef(getRealtimeService());

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      // Got permission, but close the stream for now
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setHasPermission(false);
      onError?.('Microphone access denied');
      return false;
    }
  }, [onError, sampleRate]);

  // Convert Float32Array to PCM16 base64
  const floatToPcm16Base64 = useCallback((float32Array: Float32Array): string => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to base64
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new AudioContext({ sampleRate });
      audioContextRef.current = audioContext;

      // Create source from stream
      const source = audioContext.createMediaStreamSource(stream);

      // Use ScriptProcessor for audio capture (simpler than AudioWorklet)
      const bufferSize = 4096;
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      scriptProcessor.onaudioprocess = (event) => {
        if (!serviceRef.current.isConnected()) return;
        
        const inputData = event.inputBuffer.getChannelData(0);
        const base64Audio = floatToPcm16Base64(inputData);
        
        // Send audio to API
        const audioEvent: InputAudioBufferAppendEvent = {
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        };
        serviceRef.current.send(toRealtimeMessage(audioEvent));
      };

      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      setIsRecording(true);
      setHasPermission(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      onError?.('Failed to access microphone');
      setHasPermission(false);
    }
  }, [isRecording, onError, sampleRate, floatToPcm16Base64]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    // Stop all tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Commit the audio buffer
    if (serviceRef.current.isConnected()) {
      const commitEvent: InputAudioBufferCommitEvent = {
        type: 'input_audio_buffer.commit',
      };
      serviceRef.current.send(toRealtimeMessage(commitEvent));
    }

    setIsRecording(false);
  }, [isRecording]);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isRecording,
    hasPermission,
    requestPermission,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
