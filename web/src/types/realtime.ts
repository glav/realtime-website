/**
 * Azure OpenAI Realtime API Types
 * 
 * Type definitions for the Realtime API protocol.
 * Reference: https://learn.microsoft.com/en-us/azure/ai-services/openai/realtime-audio-quickstart
 */

// Message roles
export type MessageRole = 'user' | 'assistant' | 'system';

// Content types
export interface TextContent {
  type: 'input_text';
  text: string;
}

export interface AudioContent {
  type: 'audio';
  audio: string; // Base64-encoded audio
}

export type ContentPart = TextContent | AudioContent;

// Conversation item
export interface ConversationItem {
  id: string;
  type: 'message';
  role: MessageRole;
  content: ContentPart[];
}

// Client events (sent to server)
export interface SessionUpdateEvent {
  type: 'session.update';
  session: {
    modalities?: ('text' | 'audio')[];
    instructions?: string;
    voice?: 'alloy' | 'echo' | 'shimmer';
    input_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    output_audio_format?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    turn_detection?: {
      type: 'server_vad';
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    } | null;
  };
}

export interface ConversationItemCreateEvent {
  type: 'conversation.item.create';
  item: {
    type: 'message';
    role: 'user';
    content: ContentPart[];
  };
}

export interface InputAudioBufferAppendEvent {
  type: 'input_audio_buffer.append';
  audio: string; // Base64-encoded PCM16 audio
}

export interface InputAudioBufferCommitEvent {
  type: 'input_audio_buffer.commit';
}

export interface ResponseCreateEvent {
  type: 'response.create';
  response?: {
    modalities?: ('text' | 'audio')[];
  };
}

export type ClientEvent =
  | SessionUpdateEvent
  | ConversationItemCreateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | ResponseCreateEvent;

// Helper to convert ClientEvent to RealtimeMessage format
export function toRealtimeMessage(event: ClientEvent): { type: string; [key: string]: unknown } {
  return event as { type: string; [key: string]: unknown };
}

// Server events (received from server)
export interface SessionCreatedEvent {
  type: 'session.created';
  session: {
    id: string;
    model: string;
    modalities: string[];
    voice: string;
  };
}

export interface SessionUpdatedEvent {
  type: 'session.updated';
  session: {
    id: string;
    modalities: string[];
  };
}

export interface ConversationItemCreatedEvent {
  type: 'conversation.item.created';
  item: ConversationItem;
}

export interface ResponseTextDeltaEvent {
  type: 'response.text.delta';
  response_id: string;
  item_id: string;
  delta: string;
}

export interface ResponseTextDoneEvent {
  type: 'response.text.done';
  response_id: string;
  item_id: string;
  text: string;
}

export interface ResponseAudioDeltaEvent {
  type: 'response.audio.delta';
  event_id?: string;
  response_id: string;
  item_id: string;
  output_index?: number;
  content_index?: number;
  delta: string; // Base64-encoded PCM16 audio
}

export interface ResponseAudioTranscriptDeltaEvent {
  type: 'response.audio_transcript.delta';
  event_id?: string;
  response_id: string;
  item_id: string;
  output_index?: number;
  content_index?: number;
  delta: string; // transcript text chunk
}

export interface ResponseAudioTranscriptDoneEvent {
  type: 'response.audio_transcript.done';
  event_id?: string;
  response_id: string;
  item_id: string;
  output_index?: number;
  content_index?: number;
  transcript: string;
}

export interface ResponseAudioDoneEvent {
  type: 'response.audio.done';
  response_id: string;
  item_id: string;
}

export interface ResponseDoneEvent {
  type: 'response.done';
  response: {
    id: string;
    status: 'completed' | 'cancelled' | 'failed';
    status_details?: {
      reason?: string;
    };
  };
}

export interface ErrorEvent {
  type: 'error';
  error: {
    type: string;
    code: string;
    message: string;
  };
}

export type ServerEvent =
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | ConversationItemCreatedEvent
  | ResponseTextDeltaEvent
  | ResponseTextDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseDoneEvent
  | ErrorEvent;

// UI state types
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
