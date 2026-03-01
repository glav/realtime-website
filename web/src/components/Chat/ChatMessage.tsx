/**
 * Chat Message Component
 * 
 * Displays a single chat message with role indicator and content.
 */

import type { ChatMessage as ChatMessageType } from '../../types/realtime';
import './ChatMessage.css';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        <div className="message-role">
          {isUser ? 'You' : 'Assistant'}
        </div>
        <div className="message-text">
          {message.content || (message.isStreaming ? '...' : '')}
          {message.isStreaming && <span className="typing-indicator">▋</span>}
        </div>
        <div className="message-time">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
