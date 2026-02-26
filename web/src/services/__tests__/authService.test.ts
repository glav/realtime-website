/**
 * Authentication Service Tests (TDD Phase 1 - RED)
 * 
 * Comprehensive tests for MSAL.js authentication service covering:
 * - 8 critical scenarios from test strategy
 * - 5 edge cases from test strategy
 * 
 * These tests are written BEFORE the implementation (TDD approach).
 * Coverage Target: 95%
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { AuthenticationResult, AccountInfo } from '@azure/msal-browser';

// Mock functions with explicit any typing to work with Jest 30
/* eslint-disable @typescript-eslint/no-explicit-any */
const mockLoginPopup = jest.fn<any>();
const mockLogout = jest.fn<any>();
const mockAcquireTokenSilent = jest.fn<any>();
const mockAcquireTokenPopup = jest.fn<any>();
const mockGetActiveAccount = jest.fn<any>();
const mockSetActiveAccount = jest.fn<any>();
const mockGetAllAccounts = jest.fn<any>();
/* eslint-enable @typescript-eslint/no-explicit-any */

jest.mock('@azure/msal-browser', () => ({
  PublicClientApplication: jest.fn().mockImplementation(() => ({
    loginPopup: mockLoginPopup,
    logoutPopup: mockLogout,
    acquireTokenSilent: mockAcquireTokenSilent,
    acquireTokenPopup: mockAcquireTokenPopup,
    getActiveAccount: mockGetActiveAccount,
    setActiveAccount: mockSetActiveAccount,
    getAllAccounts: mockGetAllAccounts,
  })),
  InteractionRequiredAuthError: class InteractionRequiredAuthError extends Error {
    constructor(message: string = 'Interaction required') {
      super(message);
      this.name = 'InteractionRequiredAuthError';
    }
  },
  BrowserAuthError: class BrowserAuthError extends Error {
    errorCode: string;
    constructor(errorCode: string, message: string = 'Browser auth error') {
      super(message);
      this.name = 'BrowserAuthError';
      this.errorCode = errorCode;
    }
  },
}));

// Mock account data
const mockAccount: AccountInfo = {
  homeAccountId: 'test-home-account-id',
  environment: 'login.microsoftonline.com',
  tenantId: 'test-tenant-id',
  username: 'testuser@example.com',
  localAccountId: 'test-local-account-id',
  name: 'Test User',
};

// Mock token response
const mockTokenResponse: AuthenticationResult = {
  accessToken: 'mock-access-token-12345',
  account: mockAccount,
  expiresOn: new Date(Date.now() + 3600 * 1000), // 1 hour from now
  scopes: ['https://cognitiveservices.azure.com/.default'],
  tokenType: 'Bearer',
  uniqueId: 'test-unique-id',
  tenantId: 'test-tenant-id',
  idToken: 'mock-id-token',
  idTokenClaims: {},
  authority: 'https://login.microsoftonline.com/test-tenant-id',
  correlationId: 'test-correlation-id',
  fromCache: false,
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations to prevent test pollution
    // clearAllMocks only clears call history, not mock chains
    mockLoginPopup.mockReset();
    mockLogout.mockReset();
    mockAcquireTokenSilent.mockReset();
    mockAcquireTokenPopup.mockReset();
    mockGetActiveAccount.mockReset();
    mockSetActiveAccount.mockReset();
    mockGetAllAccounts.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================
  // CRITICAL SCENARIO 1: Successful Azure AD login flow
  // ============================================
  describe('Critical Scenario 1: Successful Azure AD login flow', () => {
    it('should redirect to Azure AD login when user is unauthenticated', async () => {
      mockGetActiveAccount.mockReturnValue(null);
      mockGetAllAccounts.mockReturnValue([]);
      mockLoginPopup.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      
      expect(mockLoginPopup).toHaveBeenCalledWith({
        scopes: ['https://cognitiveservices.azure.com/.default'],
      });
    });

    it('should return authentication result after successful login', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      const result = await authService.login();
      
      expect(result).toEqual(expect.objectContaining({
        accessToken: expect.any(String),
        account: expect.objectContaining({
          username: 'testuser@example.com',
        }),
      }));
    });

    it('should set active account after successful login', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      
      expect(mockSetActiveAccount).toHaveBeenCalledWith(mockAccount);
    });
  });

  // ============================================
  // CRITICAL SCENARIO 2: Token acquisition and in-memory storage
  // ============================================
  describe('Critical Scenario 2: Token acquisition and storage', () => {
    it('should store access token in memory after successful login', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      const token = authService.getAccessToken();
      
      expect(token).toBe('mock-access-token-12345');
    });

    it('should NOT store tokens in localStorage or sessionStorage directly', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);
      const localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      
      // Verify no direct token storage (MSAL handles caching internally)
      const tokenStorageCalls = localStorageSpy.mock.calls.filter(
        call => call[1]?.includes('accessToken')
      );
      expect(tokenStorageCalls).toHaveLength(0);
      
      localStorageSpy.mockRestore();
    });

    it('should provide method to get current access token', async () => {
      mockAcquireTokenSilent.mockResolvedValue(mockTokenResponse);
      mockGetActiveAccount.mockReturnValue(mockAccount);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      const token = await authService.acquireToken();
      
      expect(token).toBe('mock-access-token-12345');
    });
  });

  // ============================================
  // CRITICAL SCENARIO 3: Automatic token refresh 5 minutes before expiry
  // ============================================
  describe('Critical Scenario 3: Automatic token refresh before expiry', () => {
    it('should schedule token refresh 5 minutes before expiry', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);
      mockAcquireTokenSilent.mockResolvedValue(mockTokenResponse);
      mockGetActiveAccount.mockReturnValue(mockAccount);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      
      // Fast-forward to 5 minutes before expiry (55 minutes from login)
      const fiftyFiveMinutes = 55 * 60 * 1000;
      jest.advanceTimersByTime(fiftyFiveMinutes);
      
      // Token refresh should be triggered
      expect(mockAcquireTokenSilent).toHaveBeenCalled();
    });

    it('should refresh token proactively before it expires', async () => {
      const tokenExpiringSoon = {
        ...mockTokenResponse,
        expiresOn: new Date(Date.now() + 4 * 60 * 1000), // 4 minutes
      };
      mockAcquireTokenSilent.mockResolvedValue(tokenExpiringSoon);
      mockGetActiveAccount.mockReturnValue(mockAccount);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.acquireToken();
      
      // Should trigger refresh since expiry is within 5 minutes
      expect(mockAcquireTokenSilent).toHaveBeenCalledWith(
        expect.objectContaining({
          forceRefresh: true,
        })
      );
    });
  });

  // ============================================
  // CRITICAL SCENARIO 4: Token refresh during active session
  // ============================================
  describe('Critical Scenario 4: Token refresh during active session', () => {
    it('should refresh token without interrupting active chat session', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      // Simulate active session with multiple token acquisitions
      const [token1, token2] = await Promise.all([
        authService.acquireToken(),
        authService.acquireToken(),
      ]);
      
      expect(token1).toBe('mock-access-token-12345');
      expect(token2).toBe('mock-access-token-12345');
    });

    it('should not require user interaction during background refresh', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.acquireToken();
      
      expect(mockAcquireTokenSilent).toHaveBeenCalled();
      expect(mockAcquireTokenPopup).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CRITICAL SCENARIO 5: Token expiry handling
  // ============================================
  describe('Critical Scenario 5: Token expiry handling', () => {
    it('should attempt silent refresh when token is expired', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.acquireToken();
      
      expect(mockAcquireTokenSilent).toHaveBeenCalledWith(
        expect.objectContaining({
          account: mockAccount,
          scopes: ['https://cognitiveservices.azure.com/.default'],
        })
      );
    });

    it('should retry request after successful silent refresh', async () => {
      const { InteractionRequiredAuthError } = await import('@azure/msal-browser');
      
      // First call fails, second succeeds
      mockAcquireTokenSilent
        .mockRejectedValueOnce(new InteractionRequiredAuthError())
        .mockResolvedValueOnce(mockTokenResponse);
      mockAcquireTokenPopup.mockResolvedValue(mockTokenResponse);
      mockGetActiveAccount.mockReturnValue(mockAccount);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      const token = await authService.acquireToken();
      
      expect(token).toBe('mock-access-token-12345');
    });
  });

  // ============================================
  // CRITICAL SCENARIO 6: 401/403 error handling
  // ============================================
  describe('Critical Scenario 6: 401/403 error handling', () => {
    it('should handle 401 Unauthorized by redirecting to login', async () => {
      const { InteractionRequiredAuthError } = await import('@azure/msal-browser');
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockRejectedValueOnce(new InteractionRequiredAuthError());
      mockAcquireTokenPopup.mockResolvedValueOnce(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.acquireToken();
      
      expect(mockAcquireTokenPopup).toHaveBeenCalled();
    });

    it('should clear auth state on 403 Forbidden', async () => {
      const forbiddenError = new Error('403 Forbidden');
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockRejectedValue(forbiddenError);
      mockGetAllAccounts.mockReturnValue([]);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await expect(authService.acquireToken()).rejects.toThrow();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  // ============================================
  // CRITICAL SCENARIO 7: Logout and token cleanup
  // ============================================
  describe('Critical Scenario 7: Logout and token cleanup', () => {
    it('should clear all tokens on logout', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);
      mockLogout.mockResolvedValue(undefined);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      await authService.logout();
      
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should clear in-memory token state on logout', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);
      mockLogout.mockResolvedValue(undefined);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      await authService.logout();
      
      expect(authService.getAccessToken()).toBeNull();
    });

    it('should update authentication state after logout', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);
      mockLogout.mockResolvedValue(undefined);
      mockGetActiveAccount.mockReturnValue(null);
      mockGetAllAccounts.mockReturnValue([]);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      await authService.logout();
      
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  // ============================================
  // CRITICAL SCENARIO 8: Concurrent requests during token refresh
  // ============================================
  describe('Critical Scenario 8: Concurrent requests during token refresh', () => {
    it('should queue concurrent requests during token refresh', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      
      // Simulate slow token refresh
      let resolveToken: (value: typeof mockTokenResponse) => void;
      const tokenPromise = new Promise<typeof mockTokenResponse>((resolve) => {
        resolveToken = resolve;
      });
      mockAcquireTokenSilent.mockReturnValue(tokenPromise);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      // Start multiple concurrent requests
      const request1 = authService.acquireToken();
      const request2 = authService.acquireToken();
      const request3 = authService.acquireToken();
      
      // Resolve the token
      resolveToken!(mockTokenResponse);
      
      const [token1, token2, token3] = await Promise.all([request1, request2, request3]);
      
      // All should get the same token
      expect(token1).toBe('mock-access-token-12345');
      expect(token2).toBe('mock-access-token-12345');
      expect(token3).toBe('mock-access-token-12345');
      
      // Should only call acquireTokenSilent once (not 3 times)
      expect(mockAcquireTokenSilent).toHaveBeenCalledTimes(1);
    });

    it('should handle race conditions during token refresh', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      // Simulate rapid concurrent token requests
      const requests = Array(10).fill(null).map(() => authService.acquireToken());
      const tokens = await Promise.all(requests);
      
      // All tokens should be valid
      tokens.forEach(token => {
        expect(token).toBe('mock-access-token-12345');
      });
      
      // Should batch requests, not make 10 separate calls
      expect(mockAcquireTokenSilent.mock.calls.length).toBeLessThanOrEqual(2);
    });
  });

  // ============================================
  // EDGE CASE 1: Token refresh fails
  // ============================================
  describe('Edge Case 1: Token refresh fails', () => {
    it('should require re-authentication when token refresh fails', async () => {
      const { InteractionRequiredAuthError } = await import('@azure/msal-browser');
      
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockRejectedValue(new InteractionRequiredAuthError());
      mockAcquireTokenPopup.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      const token = await authService.acquireToken();
      
      expect(mockAcquireTokenPopup).toHaveBeenCalled();
      expect(token).toBe('mock-access-token-12345');
    });

    it('should emit auth error event when refresh completely fails', async () => {
      const { InteractionRequiredAuthError } = await import('@azure/msal-browser');
      
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockRejectedValue(new InteractionRequiredAuthError());
      mockAcquireTokenPopup.mockRejectedValue(new Error('User cancelled'));

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      const onError = jest.fn();
      authService.onAuthError(onError);
      
      await expect(authService.acquireToken()).rejects.toThrow('User cancelled');
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        type: 'token_refresh_failed',
      }));
    });
  });

  // ============================================
  // EDGE CASE 2: Multiple simultaneous API calls during token expiry
  // ============================================
  describe('Edge Case 2: Multiple simultaneous API calls during token expiry', () => {
    it('should prevent thundering herd during token expiry', async () => {
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockAcquireTokenSilent.mockResolvedValue(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      // Simulate burst of API calls
      const requests = Array(20).fill(null).map(() => authService.acquireToken());
      await Promise.all(requests);
      
      // Should coalesce into minimal calls
      expect(mockAcquireTokenSilent.mock.calls.length).toBeLessThanOrEqual(3);
    });
  });

  // ============================================
  // EDGE CASE 3: User denied Azure AD permissions
  // ============================================
  describe('Edge Case 3: User denied Azure AD permissions', () => {
    it('should handle missing RBAC role gracefully', async () => {
      const forbiddenError = new Error('User does not have Cognitive Services OpenAI User role');
      (forbiddenError as any).status = 403;
      mockLoginPopup.mockRejectedValue(forbiddenError);
      mockGetAllAccounts.mockReturnValue([]);
      mockGetActiveAccount.mockReturnValue(null);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await expect(authService.login()).rejects.toThrow('User does not have');
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should provide helpful error message for missing permissions', async () => {
      const consentError = new Error('AADSTS65001: User consent required');
      mockLoginPopup.mockRejectedValue(consentError);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      try {
        await authService.login();
      } catch (error) {
        expect((error as Error).message).toContain('consent');
      }
    });
  });

  // ============================================
  // EDGE CASE 4: Network timeout during authentication
  // ============================================
  describe('Edge Case 4: Network timeout during authentication', () => {
    it('should handle network timeout during login', async () => {
      const timeoutError = new Error('Network request timed out');
      timeoutError.name = 'NetworkError';
      mockLoginPopup.mockRejectedValue(timeoutError);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await expect(authService.login()).rejects.toThrow('Network');
    });

    it('should retry authentication on transient network errors', async () => {
      // Use real timers for this test since it involves complex async retry logic
      jest.useRealTimers();
      
      const timeoutError = new Error('Network timeout');
      mockLoginPopup
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(mockTokenResponse);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      const result = await authService.loginWithRetry(2);
      
      expect(mockLoginPopup).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe('mock-access-token-12345');
    }, 15000);
  });

  // ============================================
  // EDGE CASE 5: Popup blocker prevents authentication popup
  // ============================================
  describe('Edge Case 5: Popup blocker prevents authentication popup', () => {
    it('should detect popup blocker and provide helpful message', async () => {
      const { BrowserAuthError } = await import('@azure/msal-browser');
      const popupBlockedError = new BrowserAuthError('popup_window_error', 'Popup blocked');
      mockLoginPopup.mockRejectedValue(popupBlockedError);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      try {
        await authService.login();
      } catch (error) {
        expect((error as Error).message.toLowerCase()).toContain('popup');
      }
    });

    it('should suggest enabling popups when blocked', async () => {
      const { BrowserAuthError } = await import('@azure/msal-browser');
      const popupBlockedError = new BrowserAuthError('popup_window_error', 'Popup blocked');
      mockLoginPopup.mockRejectedValue(popupBlockedError);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      const onError = jest.fn();
      authService.onAuthError(onError);
      
      await expect(authService.login()).rejects.toThrow();
      
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        type: 'popup_blocked',
        suggestion: expect.stringContaining('popup'),
      }));
    });
  });

  // ============================================
  // Additional utility tests
  // ============================================
  describe('Authentication state management', () => {
    it('should report correct authentication state', async () => {
      mockGetActiveAccount.mockReturnValue(null);
      mockGetAllAccounts.mockReturnValue([]);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      expect(authService.isAuthenticated()).toBe(false);
      
      mockLoginPopup.mockResolvedValue(mockTokenResponse);
      mockGetActiveAccount.mockReturnValue(mockAccount);
      mockGetAllAccounts.mockReturnValue([mockAccount]);
      
      await authService.login();
      
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should provide current user information', async () => {
      mockLoginPopup.mockResolvedValue(mockTokenResponse);
      mockGetActiveAccount.mockReturnValue(mockAccount);

      const { createAuthService } = await import('../authService');
      const authService = createAuthService();
      
      await authService.login();
      
      const user = authService.getCurrentUser();
      expect(user).toEqual(expect.objectContaining({
        username: 'testuser@example.com',
        name: 'Test User',
      }));
    });
  });
});
