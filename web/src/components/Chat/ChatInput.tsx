/**
 * Chat Input Component
 * 
 * Text input with send button and voice recording toggle.
 */

import { useState, useCallback, type KeyboardEvent, type FormEvent } from 'react';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceToggle?: () => void;
  disabled?: boolean;
  isRecording?: boolean;
  isProcessing?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onVoiceToggle,
  disabled = false,
  isRecording = false,
  isProcessing = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !disabled) {
        onSend(text.trim());
        setText('');
      }
    }
  }, [text, disabled, onSend]);

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="chat-input-field"
      />
      
      {onVoiceToggle && (
        <button
          type="button"
          onClick={onVoiceToggle}
          disabled={disabled}
          className={`voice-button ${isRecording ? 'recording' : ''}`}
          title={isRecording ? 'Stop recording' : 'Start voice input'}
        >
          {isRecording ? '⏹️' : '🎤'}
        </button>
      )}
      
      <button
        type="submit"
        disabled={disabled || !text.trim() || isProcessing}
        className="send-button"
        title="Send message"
      >
        {isProcessing ? '⏳' : '➤'}
      </button>
    </form>
  );
}
