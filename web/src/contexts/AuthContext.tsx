/**
 * Authentication Context
 * 
 * Provides authentication state and operations to all components.
 * Wraps MSAL.js functionality in a React-friendly context.
 */

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import type { AccountInfo } from '@azure/msal-browser';
import { AZURE_OPENAI_SCOPE } from '../utils/constants';

// Auth context types
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AccountInfo | null;
  error: AuthError | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
  clearError: () => void;
}

interface AuthError {
  type: string;
  message: string;
  suggestion?: string;
}

// Create context with undefined default (will be checked in hook)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token request configuration
const tokenRequest = {
  scopes: [AZURE_OPENAI_SCOPE],
};

// Provider component
export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [error, setError] = useState<AuthError | null>(null);

  // Set active account when accounts change
  useEffect(() => {
    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [accounts, instance]);

  // Get the current user
  const user = instance.getActiveAccount();

  // Login via popup
  const login = useCallback(async () => {
    try {
      setError(null);
      const response = await instance.loginPopup(tokenRequest);
      if (response.account) {
        instance.setActiveAccount(response.account);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      
      // Detect popup blocker
      if (errorMessage.toLowerCase().includes('popup')) {
        setError({
          type: 'popup_blocked',
          message: 'Popup was blocked by your browser',
          suggestion: 'Please enable popups for this site and try again',
        });
      } else {
        setError({
          type: 'login_failed',
          message: errorMessage,
        });
      }
      throw err;
    }
  }, [instance]);

  // Logout via popup
  const logout = useCallback(async () => {
    try {
      setError(null);
      await instance.logoutPopup();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError({
        type: 'logout_failed',
        message: errorMessage,
      });
      throw err;
    }
  }, [instance]);

  // Get access token for API calls
  const getAccessToken = useCallback(async (): Promise<string> => {
    const account = instance.getActiveAccount();
    if (!account) {
      throw new Error('No active account. Please login first.');
    }

    try {
      // Try silent acquisition first (uses cached/refresh token)
      const response = await instance.acquireTokenSilent({
        ...tokenRequest,
        account,
      });
      return response.accessToken;
    } catch (err) {
      // Check if interaction is required
      const isInteractionRequired = 
        err instanceof Error && 
        (err.name === 'InteractionRequiredAuthError' || 
         err.message.includes('interaction_required'));

      if (isInteractionRequired) {
        // Fallback to popup
        const response = await instance.acquireTokenPopup(tokenRequest);
        return response.accessToken;
      }
      throw err;
    }
  }, [instance]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    isLoading: inProgress !== 'none',
    user,
    error,
    login,
    logout,
    getAccessToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
