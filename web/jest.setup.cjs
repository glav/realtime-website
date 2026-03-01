require('@testing-library/jest-dom');

// Set up Vite environment variables for Jest tests via globalThis.__VITE_ENV__
globalThis.__VITE_ENV__ = {
  VITE_AZURE_CLIENT_ID: 'test-client-id',
  VITE_AZURE_TENANT_ID: 'test-tenant-id',
};

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createMediaStreamSource: jest.fn(),
  createBufferSource: jest.fn(),
  createBuffer: jest.fn(),
  decodeAudioData: jest.fn(),
  close: jest.fn(),
  resume: jest.fn(),
  state: 'running',
  sampleRate: 16000
}));

global.MediaRecorder = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: jest.fn(),
  onerror: jest.fn(),
  state: 'inactive'
}));

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{
        stop: jest.fn(),
        getSettings: () => ({ sampleRate: 16000, channelCount: 1 })
      }]
    })
  }
});
