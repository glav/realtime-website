/**
 * Realtime Service
 * 
 * Handles WebSocket connection to the backend proxy for Azure OpenAI Realtime API.
 * The backend proxy authenticates using DefaultAzureCredential (az login for dev).
 */

export interface RealtimeMessage {
  type: string;
  [key: string]: unknown;
}

export interface RealtimeEventHandlers {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (error: Event) => void;
  onMessage?: (message: RealtimeMessage) => void;
}

export class RealtimeService {
  private ws: WebSocket | null = null;
  private handlers: RealtimeEventHandlers = {};
  private backendUrl: string;

  constructor(backendUrl: string = '') {
    // Use the provided URL or construct from current location
    // With Vite proxy, we can use the same host with ws/wss protocol
    if (!backendUrl) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.backendUrl = `${protocol}//${window.location.host}`;
    } else {
      this.backendUrl = backendUrl;
    }
  }

  /**
   * Connect to the Azure OpenAI Realtime API via the backend proxy.
   */
  async connect(handlers: RealtimeEventHandlers = {}): Promise<void> {
    this.handlers = handlers;
    
    return new Promise((resolve, reject) => {
      const url = `${this.backendUrl}/api/realtime`;
      console.log(`Connecting to Realtime API via: ${url}`);
      
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('Connected to Realtime API');
        this.handlers.onOpen?.();
        resolve();
      };
      
      this.ws.onclose = (event) => {
        console.log(`Disconnected from Realtime API: code=${event.code}, reason=${event.reason}`);
        this.handlers.onClose?.(event);
        this.ws = null;
      };
      
      this.ws.onerror = (error) => {
        console.error('Realtime API error:', error);
        this.handlers.onError?.(error);
        reject(error);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as RealtimeMessage;
          this.handlers.onMessage?.(message);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };
    });
  }

  /**
   * Send a message to the Realtime API.
   */
  send(message: RealtimeMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send binary audio data to the Realtime API.
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.ws.send(audioData);
  }

  /**
   * Disconnect from the Realtime API.
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected to the Realtime API.
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Check backend health.
   */
  async checkHealth(): Promise<{ status: string; credential_valid: boolean }> {
    const httpUrl = this.backendUrl.replace('ws://', 'http://').replace('wss://', 'https://');
    const response = await fetch(`${httpUrl}/api/health`);
    return response.json();
  }
}

// Singleton instance
let realtimeServiceInstance: RealtimeService | null = null;

export function getRealtimeService(): RealtimeService {
  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new RealtimeService();
  }
  return realtimeServiceInstance;
}
