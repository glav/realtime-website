/**
 * Login Button Component
 * 
 * Displays login/logout button and user info based on authentication state.
 * Uses useAuth hook for authentication operations.
 */

import { useAuth } from '../../hooks/useAuth';
import './LoginButton.css';

export interface LoginButtonProps {
  /** Optional class name for styling */
  className?: string;
  /** Whether to show user info when authenticated */
  showUserInfo?: boolean;
}

export function LoginButton({ className = '', showUserInfo = true }: LoginButtonProps) {
  const { isAuthenticated, isLoading, user, login, logout, error, clearError } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
    } catch {
      // Error is handled by useAuth
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Error is handled by useAuth
    }
  };

  if (isAuthenticated) {
    return (
      <div className={`login-button-container authenticated ${className}`}>
        {showUserInfo && user && (
          <span className="user-info">
            {user.name || user.username}
          </span>
        )}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="auth-button logout-button"
          aria-label="Sign out"
        >
          {isLoading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    );
  }

  return (
    <div className={`login-button-container ${className}`}>
      {error && (
        <div className="auth-error" role="alert">
          <span>{error.message}</span>
          {error.suggestion && <span className="suggestion">{error.suggestion}</span>}
          <button onClick={clearError} className="dismiss-error" aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="auth-button login-button"
        aria-label="Sign in with Azure AD"
      >
        {isLoading ? 'Signing in...' : 'Sign In with Azure AD'}
      </button>
    </div>
  );
}

export default LoginButton;
