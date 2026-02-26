# Web Audio API Research for Real-Time Voice Interaction

## Executive Summary
Comprehensive guide for implementing browser-based voice capture and playback using Web Audio API, MediaDevices API, and MediaRecorder API for Azure OpenAI Realtime chatbot.

## 1. Browser Compatibility Matrix

### Core APIs Support

| API / Feature | Chrome | Edge | Firefox | Safari | Notes |
|---------------|--------|------|---------|--------|-------|
| **getUserMedia()** | 53+ ✅ | 79+ ✅ | 36+ ✅ | 14.1+ ✅ | Requires HTTPS (except localhost) |
| **MediaRecorder** | 49+ ✅ | 79+ ✅ | 25+ ✅ | 14.1+ ✅ | Codec support varies |
| **AudioContext** | 14+ ✅ | 12+ ✅ | 25+ ✅ | 6+ ✅ | Safari requires `-webkit-` prefix (legacy) |
| **MediaStreamAudioSourceNode** | 14+ ✅ | 79+ ✅ | 25+ ✅ | 14.1+ ✅ | For real-time audio processing |
| **AnalyserNode** | 14+ ✅ | 79+ ✅ | 25+ ✅ | 6+ ✅ | For waveform visualization |
| **ScriptProcessorNode** | ⚠️ Deprecated | ⚠️ Deprecated | ⚠️ Deprecated | ⚠️ Deprecated | Use AudioWorklet instead |
| **AudioWorklet** | 66+ ✅ | 79+ ✅ | 76+ ✅ | 14.1+ ✅ | For low-latency processing |

### Audio Codec Support

| Codec | Chrome | Edge | Firefox | Safari | Azure OpenAI |
|-------|--------|------|---------|--------|--------------|
| **Opus (WebM)** | ✅ | ✅ | ✅ | ❌ | ✅ Preferred |
| **PCM (WAV)** | ✅ | ✅ | ✅ | ✅ | ✅ Supported |
| **AAC (MP4)** | ✅ | ✅ | ✅ | ✅ | ⚠️ Check docs |
| **MP3** | ✅ | ✅ | ✅ | ✅ | ⚠️ Lossy (not ideal) |

**Key Issue**: Safari doesn't support WebM/Opus. **Solution**: Use PCM16 (WAV) or AAC as fallback.

### Browser Check Utility
```typescript
export const checkWebAudioSupport = () => {
  const support = {
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    MediaRecorder: !!window.MediaRecorder,
    AudioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
    AudioWorklet: !!(window.AudioContext && AudioContext.prototype.audioWorklet)
  };
  
  const isSupported = Object.values(support).every(Boolean);
  
  return { ...support, isSupported };
};
```

## 2. Best Practices for Microphone Access

### Permission Request Flow
```typescript
export const requestMicrophonePermission = async (): Promise<MediaStream> => {
  try {
    // Check if permission already granted (optional)
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    console.log('Microphone permission:', permissionStatus.state);
    
    // Request microphone with constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,        // Acoustic echo cancellation
        noiseSuppression: true,        // Background noise reduction
        autoGainControl: true,         // Automatic volume normalization
        sampleRate: 16000,             // 16kHz for Azure OpenAI
        channelCount: 1                // Mono audio
      },
      video: false
    });
    
    return stream;
    
  } catch (error: any) {
    throw handleMicrophoneError(error);
  }
};

const handleMicrophoneError = (error: DOMException): Error => {
  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return new Error('Microphone permission denied. Please allow access in browser settings.');
      
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return new Error('No microphone detected. Please connect a microphone.');
      
    case 'NotReadableError':
    case 'TrackStartError':
      return new Error('Microphone is already in use by another application.');
      
    case 'OverconstrainedError':
      return new Error('Microphone does not support requested constraints (16kHz mono).');
      
    case 'NotSupportedError':
      return new Error('HTTPS is required for microphone access.');
      
    case 'AbortError':
      return new Error('Microphone access was aborted.');
      
    default:
      return new Error(`Microphone error: ${error.message}`);
  }
};
```

### Permission State UI
```typescript
const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

useEffect(() => {
  navigator.permissions.query({ name: 'microphone' as PermissionName })
    .then(result => {
      setMicPermission(result.state);
      
      // Listen for permission changes
      result.onchange = () => {
        setMicPermission(result.state);
      };
    });
}, []);

// UI based on permission state
{micPermission === 'denied' && (
  <div className="error">
    Microphone access denied. 
    <a href="/help/microphone-setup">How to enable</a>
  </div>
)}
```

### Best Practices
✅ **Do**:
- Request microphone **after user gesture** (button click), not on page load
- Show clear UI explaining why microphone is needed before requesting
- Provide fallback to text-only mode if permission denied
- Test on iOS Safari (requires user gesture for AudioContext resume)
- Use HTTPS (getUserMedia blocked on HTTP except localhost)

❌ **Don't**:
- Request microphone on page load without context
- Store permission state in localStorage (use Permissions API)
- Ignore error cases (device in use, permission denied)
- Assume user has microphone (check `navigator.mediaDevices` first)

## 3. Audio Encoding for Real-Time Streaming

### PCM16 Encoding (Recommended for Azure OpenAI)
```typescript
/**
 * Convert Float32Array audio samples to PCM16 (signed 16-bit integers)
 * Input: AudioBuffer from Web Audio API (Float32, range [-1, 1])
 * Output: Int16Array for Azure OpenAI (PCM16, range [-32768, 32767])
 */
export const float32ToPCM16 = (float32Array: Float32Array): Int16Array => {
  const pcm16 = new Int16Array(float32Array.length);
  
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp to [-1, 1] range
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    
    // Convert to 16-bit signed integer
    // Negative: scale by 0x8000 (32768)
    // Positive: scale by 0x7FFF (32767)
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  
  return pcm16;
};
```

### Audio Resampling (if needed)
```typescript
/**
 * Resample audio from source sample rate to 16kHz
 * Uses OfflineAudioContext for high-quality resampling
 */
export const resampleTo16kHz = async (
  audioBuffer: AudioBuffer
): Promise<AudioBuffer> => {
  const targetSampleRate = 16000;
  
  if (audioBuffer.sampleRate === targetSampleRate) {
    return audioBuffer; // No resampling needed
  }
  
  const offlineContext = new OfflineAudioContext(
    1, // Mono
    audioBuffer.duration * targetSampleRate,
    targetSampleRate
  );
  
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start(0);
  
  return await offlineContext.startRendering();
};
```

### Chunking Audio for Streaming
```typescript
/**
 * Chunk audio into 20ms segments for low-latency streaming
 * 20ms at 16kHz = 320 samples = 640 bytes (PCM16)
 */
export class AudioChunker {
  private buffer: Int16Array = new Int16Array(0);
  private readonly chunkSize: number;
  
  constructor(sampleRate: number = 16000, chunkDurationMs: number = 20) {
    // Calculate samples per chunk
    this.chunkSize = Math.floor((sampleRate * chunkDurationMs) / 1000);
  }
  
  addSamples(samples: Int16Array): Int16Array[] {
    const chunks: Int16Array[] = [];
    
    // Append new samples to buffer
    const newBuffer = new Int16Array(this.buffer.length + samples.length);
    newBuffer.set(this.buffer);
    newBuffer.set(samples, this.buffer.length);
    this.buffer = newBuffer;
    
    // Extract complete chunks
    while (this.buffer.length >= this.chunkSize) {
      const chunk = this.buffer.slice(0, this.chunkSize);
      chunks.push(chunk);
      this.buffer = this.buffer.slice(this.chunkSize);
    }
    
    return chunks;
  }
  
  flush(): Int16Array | null {
    if (this.buffer.length === 0) return null;
    const chunk = this.buffer;
    this.buffer = new Int16Array(0);
    return chunk;
  }
}
```

## 4. Latency Optimization Techniques

### Performance Optimization Matrix

| Technique | Impact | Complexity | Implementation |
|-----------|--------|------------|----------------|
| **Reduce buffer size** | ⚡⚡⚡ Critical | Low | Use 20ms chunks (320 samples at 16kHz) |
| **Hardware echo cancellation** | ⚡⚡⚡ Critical | Low | `echoCancellation: true` in getUserMedia |
| **Use AudioWorklet** | ⚡⚡ High | High | Replace ScriptProcessorNode |
| **Disable visualizers** | ⚡⚡ High | Low | Don't process AnalyserNode in real-time |
| **Web Workers for encoding** | ⚡⚡ High | Medium | Offload PCM16 conversion to worker |
| **Memory pooling** | ⚡ Medium | Medium | Reuse ArrayBuffer objects |
| **Adaptive bitrate** | ⚡ Medium | High | Reduce quality on high latency |
| **Prefetch audio context** | ⚡ Low | Low | Resume AudioContext early |

### Target Latency Budgets
- **Input capture to encoding**: <50ms
- **Encoding to WebSocket send**: <50ms
- **Network round-trip**: ~100-300ms (varies)
- **Audio decoding to playback**: <50ms
- **Total target**: <500ms (user perception: <1s)

### AudioWorklet Implementation (Low Latency)
```typescript
// audio-processor.worklet.ts
class AudioStreamProcessor extends AudioWorkletProcessor {
  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: any) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0]; // Mono channel
      
      // Convert to PCM16 and post to main thread
      const pcm16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      this.port.postMessage(pcm16);
    }
    
    return true; // Keep processor alive
  }
}

registerProcessor('audio-stream-processor', AudioStreamProcessor);

// Main thread usage
const audioContext = new AudioContext({ sampleRate: 16000 });
await audioContext.audioWorklet.addModule('/audio-processor.worklet.js');

const workletNode = new AudioWorkletNode(audioContext, 'audio-stream-processor');
workletNode.port.onmessage = (event) => {
  const pcm16Chunk = event.data;
  // Send to WebSocket
  webSocket.send(pcm16Chunk.buffer);
};

const source = audioContext.createMediaStreamSource(microphoneStream);
source.connect(workletNode);
```

### Web Worker for Encoding (Offload Main Thread)
```typescript
// audio-encoder.worker.ts
self.onmessage = (event) => {
  const float32 = event.data;
  const pcm16 = new Int16Array(float32.length);
  
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  self.postMessage(pcm16, [pcm16.buffer]); // Transfer ownership
};

// Main thread
const encoderWorker = new Worker('/audio-encoder.worker.js');
encoderWorker.onmessage = (event) => {
  const pcm16Chunk = event.data;
  sendToWebSocket(pcm16Chunk);
};

// Send audio samples to worker
encoderWorker.postMessage(float32Samples, [float32Samples.buffer]);
```

## 5. Cross-Browser Compatibility Issues

### AudioContext State Management (Safari)
```typescript
/**
 * Safari starts AudioContext in 'suspended' state
 * Must resume after user gesture
 */
const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

if (audioContext.state === 'suspended') {
  // Resume on user gesture (click, tap)
  document.addEventListener('click', async () => {
    await audioContext.resume();
    console.log('AudioContext resumed');
  }, { once: true });
}
```

### MediaRecorder Codec Detection
```typescript
/**
 * Check supported MIME types before creating MediaRecorder
 */
export const getSupportedAudioMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',  // Chrome, Firefox, Edge
    'audio/webm',              // Fallback WebM
    'audio/ogg;codecs=opus',   // Firefox
    'audio/mp4',               // Safari
    'audio/wav'                // Universal fallback
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log('Using MIME type:', type);
      return type;
    }
  }
  
  throw new Error('No supported audio codec found');
};

// Usage
const mimeType = getSupportedAudioMimeType();
const mediaRecorder = new MediaRecorder(stream, { mimeType });
```

### Vendor Prefix Handling
```typescript
/**
 * Handle legacy webkit prefixes (older Safari)
 */
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
const audioContext = new AudioContext();

// No other Web Audio APIs require prefixes in modern browsers
```

### getUserMedia Constraints Fallback
```typescript
/**
 * Graceful degradation for unsupported constraints
 */
const requestMicrophoneWithFallback = async () => {
  const idealConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 16000,
      channelCount: 1
    }
  };
  
  try {
    return await navigator.mediaDevices.getUserMedia(idealConstraints);
  } catch (error: any) {
    if (error.name === 'OverconstrainedError') {
      // Fallback: remove advanced constraints
      console.warn('Advanced constraints not supported, using basic audio');
      return await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    throw error;
  }
};
```

## 6. Error Handling Patterns

### Comprehensive Error Types
```typescript
export enum AudioErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NO_DEVICE = 'NO_DEVICE',
  DEVICE_IN_USE = 'DEVICE_IN_USE',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  HTTPS_REQUIRED = 'HTTPS_REQUIRED',
  INVALID_CONSTRAINTS = 'INVALID_CONSTRAINTS',
  PLAYBACK_FAILED = 'PLAYBACK_FAILED',
  ENCODING_ERROR = 'ENCODING_ERROR'
}

export class AudioError extends Error {
  constructor(
    public type: AudioErrorType,
    public message: string,
    public userMessage: string
  ) {
    super(message);
    this.name = 'AudioError';
  }
}
```

### User-Friendly Error Handler
```typescript
export const handleWebAudioError = (error: any): AudioError => {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return new AudioError(
          AudioErrorType.PERMISSION_DENIED,
          error.message,
          'Microphone access denied. Please allow microphone access in your browser settings.'
        );
        
      case 'NotFoundError':
        return new AudioError(
          AudioErrorType.NO_DEVICE,
          error.message,
          'No microphone found. Please connect a microphone and try again.'
        );
        
      case 'NotReadableError':
        return new AudioError(
          AudioErrorType.DEVICE_IN_USE,
          error.message,
          'Microphone is already in use. Close other applications using the microphone.'
        );
        
      case 'OverconstrainedError':
        return new AudioError(
          AudioErrorType.INVALID_CONSTRAINTS,
          error.message,
          'Your microphone does not support the required settings.'
        );
        
      case 'NotSupportedError':
        return new AudioError(
          AudioErrorType.NOT_SUPPORTED,
          error.message,
          'Microphone access requires a secure connection (HTTPS).'
        );
    }
  }
  
  return new AudioError(
    AudioErrorType.NOT_SUPPORTED,
    error.message || 'Unknown audio error',
    'An unexpected error occurred with audio. Please try again.'
  );
};

// Usage in React component
const [audioError, setAudioError] = useState<AudioError | null>(null);

const startRecording = async () => {
  try {
    const stream = await requestMicrophonePermission();
    // ...
  } catch (error) {
    const audioError = handleWebAudioError(error);
    setAudioError(audioError);
    console.error(audioError.message);
    alert(audioError.userMessage); // Or display in UI
  }
};
```

## 7. React Hooks for Web Audio

### Custom Hook: useVoiceRecorder
```typescript
import { useState, useRef, useCallback } from 'react';

export const useVoiceRecorder = (onAudioChunk: (chunk: Int16Array) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  
  const startRecording = useCallback(async () => {
    try {
      // Request microphone
      const stream = await requestMicrophonePermission();
      streamRef.current = stream;
      
      // Create AudioContext
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      // Load AudioWorklet
      await audioContext.audioWorklet.addModule('/audio-processor.worklet.js');
      const workletNode = new AudioWorkletNode(audioContext, 'audio-stream-processor');
      workletNodeRef.current = workletNode;
      
      // Handle audio chunks from worklet
      workletNode.port.onmessage = (event) => {
        onAudioChunk(event.data); // Int16Array
      };
      
      // Connect microphone to worklet
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(workletNode);
      
      setIsRecording(true);
      setError(null);
      
    } catch (err: any) {
      const audioError = handleWebAudioError(err);
      setError(audioError.userMessage);
    }
  }, [onAudioChunk]);
  
  const stopRecording = useCallback(() => {
    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    workletNodeRef.current = null;
    setIsRecording(false);
  }, []);
  
  return { isRecording, error, startRecording, stopRecording };
};
```

### Custom Hook: useAudioPlayback
```typescript
export const useAudioPlayback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playAudio = useCallback(async (pcm16Data: Int16Array) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
    }
    
    const audioContext = audioContextRef.current;
    
    // Convert PCM16 to AudioBuffer
    const audioBuffer = audioContext.createBuffer(1, pcm16Data.length, 16000);
    const channelData = audioBuffer.getChannelData(0);
    
    for (let i = 0; i < pcm16Data.length; i++) {
      // Convert from int16 [-32768, 32767] to float [-1, 1]
      channelData[i] = pcm16Data[i] / (pcm16Data[i] < 0 ? 0x8000 : 0x7FFF);
    }
    
    // Play audio
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
    
    setIsPlaying(true);
    source.onended = () => setIsPlaying(false);
    
  }, []);
  
  return { isPlaying, playAudio };
};
```

### Recommended Third-Party Libraries
1. **`react-media-recorder`** - Simplified MediaRecorder wrapper
   - Pros: Easy to use, handles cross-browser issues
   - Cons: Less control over audio processing
   
2. **`recorder.js`** - Legacy library for Web Audio recording
   - Pros: Mature, stable
   - Cons: Uses deprecated ScriptProcessorNode
   
3. **Custom hooks (Recommended)** - Full control over audio pipeline
   - Pros: Tailored to Azure OpenAI requirements, low latency
   - Cons: More code to maintain

## 8. Real-Time Voice Interaction Architecture

### End-to-End Flow Diagram
```
┌─────────────┐
│   User      │ Speaks into microphone
│   Speaks    │
└──────┬──────┘
       │
       v
┌─────────────────────────────┐
│ navigator.mediaDevices      │ Request microphone access
│   .getUserMedia()            │ with audio constraints
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ MediaStream                 │ Raw audio stream (48kHz typically)
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ AudioContext                │ Process audio at 16kHz
│ createMediaStreamSource()   │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ AudioWorkletNode            │ Real-time PCM16 encoding
│ (audio-processor.worklet)   │ in audio thread (low latency)
└──────┬──────────────────────┘
       │
       v (postMessage)
┌─────────────────────────────┐
│ Main Thread                 │ Receive PCM16 chunks (20ms)
│ AudioChunker                │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ WebSocket                   │ Stream to Azure OpenAI
│ ws.send(pcm16Chunk)         │ Realtime API
└──────┬──────────────────────┘
       │
       v
       ☁️  Azure OpenAI Realtime API
       │
       v
┌─────────────────────────────┐
│ WebSocket                   │ Receive audio response
│ ws.onmessage                │ (PCM16 or Opus)
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ AudioContext                │ Decode audio data
│ .decodeAudioData()          │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│ AudioBufferSourceNode       │ Play audio response
│ .start()                    │ through speakers
└──────┬──────────────────────┘
       │
       v
┌─────────────┐
│   User      │ Hears AI response
│   Hears     │
└─────────────┘
```

### Implementation Checklist
- [ ] Check browser support for Web Audio API
- [ ] Request microphone permission with proper error handling
- [ ] Configure getUserMedia with 16kHz, mono, echo cancellation
- [ ] Set up AudioContext with 16kHz sample rate
- [ ] Implement AudioWorklet or Web Worker for PCM16 encoding
- [ ] Chunk audio into 20ms segments for streaming
- [ ] Send chunks via WebSocket to Azure OpenAI
- [ ] Receive and decode audio response
- [ ] Play audio through AudioContext
- [ ] Handle cross-browser codec differences (Opus vs PCM)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Measure and optimize latency (<500ms target)

## References
- **MDN Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **MediaDevices.getUserMedia()**: https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
- **AudioWorklet**: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet
- **MediaRecorder API**: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- **Browser Compatibility**: https://caniuse.com/?search=getUserMedia
- **Azure OpenAI Audio Specs**: `/workspaces/realtime-website/docs/azure-openai-realtime-chatbot.md` (Lines 234-246)
