import { useState, useEffect, useCallback } from 'react';
import { apiConfig } from './utils/constants';
import { ChatContainer } from './components/Chat';
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
    if (!health?.azure_openai_endpoint || !health?.azure_openai_deployment) return 'Configuration incomplete';
    if (health?.credential_valid) return 'Backend ready';
    return `Auth error: ${health?.credential_error || 'Unknown'}`;
  };

  return (
    <div className="status-indicator" style={{ color: getStatusColor() }}>
      <span className="status-dot" style={{ backgroundColor: getStatusColor() }} />
      {getStatusText()}
    </div>
  );
}

function App() {
  const [backendStatus, setBackendStatus] = useState<ConnectionStatus>('checking');
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

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

  const handleChatError = useCallback((error: string) => {
    setChatError(error);
    // Auto-dismiss after 5 seconds
    setTimeout(() => setChatError(null), 5000);
  }, []);

  const isConfigured = !!(health?.azure_openai_endpoint && health?.azure_openai_deployment);
  const isBackendReady =
    backendStatus === 'connected' &&
    isConfigured &&
    health?.credential_valid;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Azure OpenAI Realtime Chat</h1>
        <StatusIndicator status={backendStatus} health={health} />
      </header>

      {chatError && (
        <div className="chat-error">
          {chatError}
          <button onClick={() => setChatError(null)}>✕</button>
        </div>
      )}

      <main className="app-main">
        {backendStatus === 'checking' && (
          <div className="loading-state">
            <p>Connecting to backend...</p>
          </div>
        )}

        {backendStatus === 'error' && (
          <div className="error-state">
            <p>Cannot reach the backend server.</p>
            <p className="hint">Make sure the backend is running:</p>
            <code>uv run python src/server.py</code>
          </div>
        )}

        {backendStatus === 'connected' && !isConfigured && (
          <div className="error-state">
            <p>Backend is running but Azure OpenAI is not fully configured.</p>
            <p className="hint">Ensure the following environment variables are set:</p>
            <ul>
              {!health?.azure_openai_endpoint && <li><code>AZURE_OPENAI_ENDPOINT</code></li>}
              {!health?.azure_openai_deployment && <li><code>AZURE_OPENAI_DEPLOYMENT</code></li>}
            </ul>
          </div>
        )}

        {backendStatus === 'connected' && isConfigured && !health?.credential_valid && (
          <div className="error-state">
            <p>Backend is running but Azure authentication failed.</p>
            <p className="hint">Run the following command to authenticate:</p>
            <code>az login</code>
          </div>
        )}

        {isBackendReady && (
          <ChatContainer onError={handleChatError} />
        )}
      </main>
    </div>
  );
}

export default App
