/**
 * LoginButton Component Tests
 * 
 * Code-First testing approach for UI component.
 * Target: 60% coverage
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginButton } from '../LoginButton';

// Mock useAuth hook
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockClearError = jest.fn();

let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null as { name?: string; username?: string } | null,
  error: null as { type: string; message: string; suggestion?: string } | null,
  login: mockLogin,
  logout: mockLogout,
  getAccessToken: jest.fn(),
  clearError: mockClearError,
};

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('LoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: mockLogin,
      logout: mockLogout,
      getAccessToken: jest.fn(),
      clearError: mockClearError,
    };
  });

  describe('when unauthenticated', () => {
    it('renders login button', () => {
      render(<LoginButton />);
      
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('calls login when clicked', async () => {
      mockLogin.mockResolvedValue(undefined);
      render(<LoginButton />);
      
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state during login', () => {
      mockAuthState.isLoading = true;
      render(<LoginButton />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Signing in...');
    });

    it('displays error message when login fails', () => {
      mockAuthState.error = {
        type: 'login_failed',
        message: 'Authentication failed',
        suggestion: 'Try again',
      };
      render(<LoginButton />);
      
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('clears error when dismiss button clicked', () => {
      mockAuthState.error = {
        type: 'login_failed',
        message: 'Authentication failed',
      };
      render(<LoginButton />);
      
      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
      
      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = { name: 'Test User', username: 'testuser@example.com' };
    });

    it('renders logout button', () => {
      render(<LoginButton />);
      
      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
    });

    it('displays user name', () => {
      render(<LoginButton />);
      
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('falls back to username when name not available', () => {
      mockAuthState.user = { username: 'testuser@example.com' };
      render(<LoginButton />);
      
      expect(screen.getByText('testuser@example.com')).toBeInTheDocument();
    });

    it('hides user info when showUserInfo is false', () => {
      render(<LoginButton showUserInfo={false} />);
      
      expect(screen.queryByText('Test User')).not.toBeInTheDocument();
    });

    it('calls logout when clicked', async () => {
      mockLogout.mockResolvedValue(undefined);
      render(<LoginButton />);
      
      fireEvent.click(screen.getByRole('button', { name: /sign out/i }));
      
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('shows loading state during logout', () => {
      mockAuthState.isLoading = true;
      render(<LoginButton />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('Signing out...');
    });
  });

  describe('accessibility', () => {
    it('has accessible login button', () => {
      render(<LoginButton />);
      
      const button = screen.getByRole('button', { name: /sign in with azure ad/i });
      expect(button).toHaveAttribute('aria-label', 'Sign in with Azure AD');
    });

    it('has accessible logout button', () => {
      mockAuthState.isAuthenticated = true;
      mockAuthState.user = { name: 'Test User' };
      render(<LoginButton />);
      
      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).toHaveAttribute('aria-label', 'Sign out');
    });

    it('error message has alert role', () => {
      mockAuthState.error = {
        type: 'login_failed',
        message: 'Authentication failed',
      };
      render(<LoginButton />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
