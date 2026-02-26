import { useState, useEffect } from 'react';
import { apiConfig } from './utils/constants';
import './App.css'

interface BackendHealth {
  status: string;
  azure_openai_endpoint?: boolean;
  azure_openai_deployment?: boolean;
  credential_valid?: boolean;
  credential_error?: string;
}

type ConnectionStatus = 'checking' | 'connected' | 'error';

function StatusIndicator({ status, health }: { status: ConnectionStatus; health: BackendHealth | null }) {
  const getStatusColor = () => {
    if (status === 'checking') return '#888';
    if (status === 'connected' && health?.credential_valid) return '#4caf50';
    return '#f44336';
  };

  const getStatusText = () => {
    if (status === 'checking') return 'Checking backend...';
    if (status === 'error') return 'Backend unreachable';
    if (health?.credential_valid) return 'Connected & Authenticated';
    return `Auth error: ${health?.credential_error || 'Unknown'}`;
  };

  return (
    <div className="status-indicator" style={{ color: getStatusColor() }}>
      <span className="status-dot" style={{ backgroundColor: getStatusColor() }} />
      {getStatusText()}
    </div>
  );
}

function ChatInterface() {
  const [backendStatus, setBackendStatus] = useState<ConnectionStatus>('checking');
  const [health, setHealth] = useState<BackendHealth | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${apiConfig.backendUrl}/api/health`);
        const data = await response.json();
        setHealth(data);
        setBackendStatus('connected');
      } catch {
        setBackendStatus('error');
        setHealth(null);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Azure OpenAI Chatbot</h1>
        <StatusIndicator status={backendStatus} health={health} />
      </header>
      
      <main className="chat-main">
        {backendStatus === 'checking' && (
          <p>Connecting to backend...</p>
        )}
        
        {backendStatus === 'error' && (
          <div className="error-message">
            <p>Cannot reach the backend server.</p>
            <p className="suggestion">Make sure the backend is running: <code>uv run python src/server.py</code></p>
          </div>
        )}
        
        {backendStatus === 'connected' && !health?.credential_valid && (
          <div className="error-message">
            <p>Backend is running but Azure authentication failed.</p>
            <p className="suggestion">Run <code>az login</code> to authenticate with Azure.</p>
          </div>
        )}
        
        {backendStatus === 'connected' && health?.credential_valid && (
          <>
            <p>Chat interface coming soon...</p>
            <p>Text and voice interactions with Azure OpenAI GPT Realtime model</p>
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return <ChatInterface />;
}

export default App
