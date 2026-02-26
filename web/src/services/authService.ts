/**
 * Authentication Service
 * 
 * MSAL.js wrapper for Azure AD authentication with RBAC support.
 * Implements secure token acquisition, refresh, and error handling.
 * 
 * TDD Phase 2 - GREEN: Implementation to make all tests pass.
 */

import {
  PublicClientApplication,
  type Configuration,
  type AccountInfo,
  type AuthenticationResult,
  type SilentRequest,
  InteractionRequiredAuthError,
  BrowserAuthError,
} from '@azure/msal-browser';
import { AZURE_OPENAI_SCOPE, TOKEN_REFRESH_BUFFER_MS, authConfig } from '../utils/constants';

// Type definitions
export interface AuthError {
  type: string;
  message: string;
  suggestion?: string;
}

export interface AuthService {
  login(): Promise<AuthenticationResult>;
  loginWithRetry(retries: number): Promise<AuthenticationResult>;
  logout(): Promise<void>;
  acquireToken(): Promise<string>;
  getAccessToken(): string | null;
  isAuthenticated(): boolean;
  getCurrentUser(): AccountInfo | null;
  onAuthError(callback: (error: AuthError) => void): void;
}

// MSAL Configuration
const msalConfig: Configuration = {
  auth: {
    clientId: authConfig.clientId,
    authority: `https://login.microsoftonline.com/${authConfig.tenantId}`,
    redirectUri: authConfig.redirectUri,
    postLogoutRedirectUri: authConfig.redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

// Token request configuration
const tokenRequest = {
  scopes: [AZURE_OPENAI_SCOPE],
};

/**
 * Creates an authentication service instance
 */
export function createAuthService(): AuthService {
  const msalInstance = new PublicClientApplication(msalConfig);
  
  // State
  let cachedToken: string | null = null;
  let tokenExpiresOn: Date | null = null;
  let pendingTokenRequest: Promise<string> | null = null;
  let refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  const errorCallbacks: Array<(error: AuthError) => void> = [];

  // Helper: Emit auth error to subscribers
  const emitAuthError = (error: AuthError): void => {
    errorCallbacks.forEach(callback => callback(error));
  };

  // Helper: Schedule token refresh before expiry
  const scheduleTokenRefresh = (expiresOn: Date | null): void => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }

    if (!expiresOn) return;

    const msUntilExpiry = expiresOn.getTime() - Date.now();
    const msUntilRefresh = msUntilExpiry - TOKEN_REFRESH_BUFFER_MS;

    if (msUntilRefresh > 0) {
      refreshTimeoutId = setTimeout(async () => {
        try {
          await acquireTokenInternal(true);
        } catch (error) {
          console.error('Background token refresh failed:', error);
        }
      }, msUntilRefresh);
    }
  };

  // Helper: Check if token needs refresh
  const tokenNeedsRefresh = (): boolean => {
    if (!tokenExpiresOn) return true;
    const msUntilExpiry = tokenExpiresOn.getTime() - Date.now();
    return msUntilExpiry <= TOKEN_REFRESH_BUFFER_MS;
  };

  // Internal token acquisition with coalescing
  const acquireTokenInternal = async (forceRefresh: boolean = false): Promise<string> => {
    const account = msalInstance.getActiveAccount();
    
    if (!account) {
      // Clear state when no account
      cachedToken = null;
      tokenExpiresOn = null;
      throw new Error('No active account. Please login.');
    }

    // Return cached token if valid and not forcing refresh
    if (!forceRefresh && cachedToken && !tokenNeedsRefresh()) {
      return cachedToken;
    }

    // Coalesce concurrent requests
    if (pendingTokenRequest) {
      return pendingTokenRequest;
    }

    const silentRequest: SilentRequest = {
      scopes: tokenRequest.scopes,
      account,
      forceRefresh: forceRefresh || tokenNeedsRefresh(),
    };

    pendingTokenRequest = (async () => {
      try {
        const response = await msalInstance.acquireTokenSilent(silentRequest);
        cachedToken = response.accessToken;
        tokenExpiresOn = response.expiresOn;
        scheduleTokenRefresh(response.expiresOn);
        return response.accessToken;
      } catch (error) {
        // Check for InteractionRequiredAuthError by name (works with mocks)
        const isInteractionRequired = 
          error instanceof InteractionRequiredAuthError ||
          (error instanceof Error && error.name === 'InteractionRequiredAuthError');
        
        if (isInteractionRequired) {
          try {
            const response = await msalInstance.acquireTokenPopup(tokenRequest);
            cachedToken = response.accessToken;
            tokenExpiresOn = response.expiresOn;
            msalInstance.setActiveAccount(response.account);
            scheduleTokenRefresh(response.expiresOn);
            return response.accessToken;
          } catch (popupError) {
            emitAuthError({
              type: 'token_refresh_failed',
              message: (popupError as Error).message,
            });
            throw popupError;
          }
        }
        // For other errors (403, network, etc.), clear state
        cachedToken = null;
        tokenExpiresOn = null;
        throw error;
      } finally {
        pendingTokenRequest = null;
      }
    })();

    return pendingTokenRequest;
  };

  // Public API
  const login = async (): Promise<AuthenticationResult> => {
    try {
      const response = await msalInstance.loginPopup(tokenRequest);
      cachedToken = response.accessToken;
      tokenExpiresOn = response.expiresOn;
      msalInstance.setActiveAccount(response.account);
      scheduleTokenRefresh(response.expiresOn);
      return response;
    } catch (error) {
      // Handle popup blocked
      if (error instanceof BrowserAuthError && error.errorCode === 'popup_window_error') {
        emitAuthError({
          type: 'popup_blocked',
          message: (error as Error).message,
          suggestion: 'Please enable popups for this site and try again.',
        });
      }
      throw error;
    }
  };

  const loginWithRetry = async (maxRetries: number): Promise<AuthenticationResult> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await login();
      } catch (error) {
        lastError = error as Error;
        // Only retry on network errors
        if (!(error instanceof Error) || !error.message.toLowerCase().includes('network')) {
          throw error;
        }
        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw lastError;
  };

  const logout = async (): Promise<void> => {
    // Clear local state first
    cachedToken = null;
    tokenExpiresOn = null;
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      refreshTimeoutId = null;
    }
    
    await msalInstance.logoutPopup();
  };

  const acquireToken = async (): Promise<string> => {
    return acquireTokenInternal(false);
  };

  const getAccessToken = (): string | null => {
    return cachedToken;
  };

  const isAuthenticated = (): boolean => {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0 && msalInstance.getActiveAccount() !== null;
  };

  const getCurrentUser = (): AccountInfo | null => {
    return msalInstance.getActiveAccount();
  };

  const onAuthError = (callback: (error: AuthError) => void): void => {
    errorCallbacks.push(callback);
  };

  return {
    login,
    loginWithRetry,
    logout,
    acquireToken,
    getAccessToken,
    isAuthenticated,
    getCurrentUser,
    onAuthError,
  };
}

export default createAuthService;
