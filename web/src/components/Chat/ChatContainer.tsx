/**
 * Chat Container Component
 * 
 * Main chat interface with message list, input, and connection controls.
 */

import { useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { useAudioCapture } from '../../hooks/useAudioCapture';
import './ChatContainer.css';

interface ChatContainerProps {
  onError?: (error: string) => void;
}

export function ChatContainer({ onError }: ChatContainerProps) {
  const {
    messages,
    connectionState,
    isProcessing,
    connect,
    disconnect,
    sendMessage,
    isConnected,
  } = useRealtimeChat({ onError });

  const {
    isRecording,
    toggleRecording,
  } = useAudioCapture({ onError });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConnect = useCallback(() => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  }, [isConnected, connect, disconnect]);

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected': return '#4caf50';
      case 'connecting': return '#ff9800';
      case 'error': return '#f44336';
      default: return '#666';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="chat-container-wrapper">
      <div className="chat-toolbar">
        <div className="connection-status">
          <span 
            className="status-dot" 
            style={{ backgroundColor: getConnectionStatusColor() }} 
          />
          <span className="status-text">{getConnectionStatusText()}</span>
        </div>
        
        <button 
          onClick={handleConnect}
          className={`connect-button ${isConnected ? 'connected' : ''}`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            {isConnected ? (
              <>
                <p>👋 Ready to chat!</p>
                <p className="hint">Type a message or use voice input to start</p>
              </>
            ) : (
              <>
                <p>🔌 Not connected</p>
                <p className="hint">Click &quot;Connect&quot; to start chatting with Azure OpenAI</p>
              </>
            )}
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSend={sendMessage}
        onVoiceToggle={isConnected ? toggleRecording : undefined}
        disabled={!isConnected}
        isRecording={isRecording}
        isProcessing={isProcessing}
        placeholder={isConnected ? 'Type a message...' : 'Connect to start chatting'}
      />
    </div>
  );
}
