import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import { useAuth } from './hooks/useAuth'
import './App.css'

function LoginPage() {
  const { login, error, clearError, isLoading } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch {
      // Error is handled by useAuth
    }
  };

  return (
    <div className="login-container">
      <h1>Azure OpenAI GPT Realtime Chatbot</h1>
      <p>Sign in with your Azure AD account to start chatting</p>
      
      {error && (
        <div className="error-message">
          <p>{error.message}</p>
          {error.suggestion && <p className="suggestion">{error.suggestion}</p>}
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
      
      <button 
        onClick={handleLogin} 
        disabled={isLoading}
        className="login-button"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </div>
  );
}

function ChatInterface() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Error is handled by useAuth
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Azure OpenAI Chatbot</h1>
        <div className="user-info">
          <span>Welcome, {user?.name || user?.username || 'User'}</span>
          <button 
            onClick={handleLogout} 
            disabled={isLoading}
            className="logout-button"
          >
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="chat-main">
        <p>Chat interface coming soon...</p>
        <p>Text and voice interactions with Azure OpenAI GPT Realtime model</p>
      </main>
    </div>
  );
}

function App() {
  return (
    <>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
      
      <AuthenticatedTemplate>
        <ChatInterface />
      </AuthenticatedTemplate>
    </>
  )
}

export default App
