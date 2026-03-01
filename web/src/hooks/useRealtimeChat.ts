/**
 * Realtime Chat Hook
 * 
 * Manages WebSocket connection and chat state for Azure OpenAI Realtime API.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getRealtimeService } from '../services/realtimeService';
import type { RealtimeMessage } from '../services/realtimeService';
import type {
  ChatMessage,
  ConnectionState,
  ServerEvent,
} from '../types/realtime';
import { toRealtimeMessage } from '../types/realtime';
import type { SessionUpdateEvent, ConversationItemCreateEvent, ResponseCreateEvent } from '../types/realtime';

interface UseRealtimeChatOptions {
  onError?: (error: string) => void;
  onAudioDelta?: (base64Audio: string) => void;
  onTranscriptDelta?: (text: string) => void;
}

export function useRealtimeChat(options: UseRealtimeChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isProcessing, setIsProcessing] = useState(false);
  const currentResponseRef = useRef<{ id: string; text: string } | null>(null);
  const serviceRef = useRef(getRealtimeService());

  // Handle incoming server events
  const handleServerEvent = useCallback((event: ServerEvent) => {
    switch (event.type) {
      case 'session.created':
        console.log('Session created:', event.session.id);
        break;

      case 'response.text.delta':
        // Streaming text response
        if (!currentResponseRef.current || currentResponseRef.current.id !== event.item_id) {
          currentResponseRef.current = { id: event.item_id, text: '' };
          // Add new assistant message
          setMessages(prev => [...prev, {
            id: event.item_id,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          }]);
        }
        currentResponseRef.current.text += event.delta;
        // Update the streaming message
        setMessages(prev => prev.map(msg =>
          msg.id === event.item_id
            ? { ...msg, content: currentResponseRef.current!.text }
            : msg
        ));
        break;

      case 'response.text.done':
        // Finalize the message
        setMessages(prev => prev.map(msg =>
          msg.id === event.item_id
            ? { ...msg, content: event.text, isStreaming: false }
            : msg
        ));
        currentResponseRef.current = null;
        break;

      case 'response.done':
        setIsProcessing(false);
        if (event.response.status === 'failed') {
          options.onError?.('Response generation failed');
        } else if (event.response.status === 'cancelled') {
          const reason = event.response.status_details?.reason;
          console.log('Response cancelled:', reason);
          if (reason === 'turn_detected') {
            options.onError?.('Response interrupted - speak again to continue');
          }
        }
        break;

      case 'response.audio.delta':
        options.onAudioDelta?.(event.delta);
        break;

      case 'response.audio_transcript.delta':
        // Streaming audio transcript
        if (!currentResponseRef.current || currentResponseRef.current.id !== event.item_id) {
          currentResponseRef.current = { id: event.item_id, text: '' };
          // Add new assistant message for audio transcript
          setMessages(prev => [...prev, {
            id: event.item_id,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          }]);
        }
        currentResponseRef.current.text += event.delta;
        options.onTranscriptDelta?.(event.delta);
        // Update the streaming message
        setMessages(prev => prev.map(msg =>
          msg.id === event.item_id
            ? { ...msg, content: currentResponseRef.current!.text }
            : msg
        ));
        break;

      case 'response.audio_transcript.done':
        // Finalize the audio transcript message
        setMessages(prev => prev.map(msg =>
          msg.id === event.item_id
            ? { ...msg, content: event.transcript, isStreaming: false }
            : msg
        ));
        currentResponseRef.current = null;
        break;

      case 'error':
        console.error('Realtime API error:', event.error);
        options.onError?.(event.error.message);
        setIsProcessing(false);
        break;
    }
  }, [options]);

  // Connect to the Realtime API
  const connect = useCallback(async () => {
    if (connectionState === 'connected' || connectionState === 'connecting') {
      return;
    }

    setConnectionState('connecting');
    try {
      await serviceRef.current.connect({
        onOpen: () => {
          setConnectionState('connected');
          // Configure the session
          const sessionConfig: SessionUpdateEvent = {
            type: 'session.update',
            session: {
              modalities: ['text', 'audio'],
              voice: 'alloy',
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              turn_detection: {
                type: 'server_vad',
                threshold: 0.7,
                silence_duration_ms: 400,
                prefix_padding_ms: 300,
              },
            },
          };
          serviceRef.current.send(toRealtimeMessage(sessionConfig));
        },
        onClose: () => {
          setConnectionState('disconnected');
          setIsProcessing(false);
        },
        onError: () => {
          setConnectionState('error');
          setIsProcessing(false);
        },
        onMessage: (message: RealtimeMessage) => {
          handleServerEvent(message as unknown as ServerEvent);
        },
      });
    } catch {
      setConnectionState('error');
    }
  }, [connectionState, handleServerEvent]);

  // Disconnect from the Realtime API
  const disconnect = useCallback(() => {
    serviceRef.current.disconnect();
    setConnectionState('disconnected');
    setIsProcessing(false);
  }, []);

  // Send a text message
  const sendMessage = useCallback((text: string) => {
    if (!serviceRef.current.isConnected() || !text.trim()) {
      return;
    }

    const messageId = `user-${Date.now()}`;
    
    // Add user message to UI
    setMessages(prev => [...prev, {
      id: messageId,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }]);

    setIsProcessing(true);

    // Send to API
    const createEvent: ConversationItemCreateEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    };
    serviceRef.current.send(toRealtimeMessage(createEvent));

    // Request response
    const responseEvent: ResponseCreateEvent = {
      type: 'response.create',
      response: {
        modalities: ['text'],
      },
    };
    serviceRef.current.send(toRealtimeMessage(responseEvent));
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      serviceRef.current.disconnect();
    };
  }, []);

  return {
    messages,
    connectionState,
    isProcessing,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    isConnected: connectionState === 'connected',
  };
}
