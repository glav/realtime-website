import { describe, it, expect } from '@jest/globals';

describe('Jest Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have Web Audio API mocked', () => {
    expect(typeof AudioContext).toBe('function');
    expect(typeof MediaRecorder).toBe('function');
    expect(navigator.mediaDevices.getUserMedia).toBeDefined();
  });
});
