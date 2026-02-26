/**
 * useAuth Hook
 * 
 * Convenience hook for accessing authentication functionality.
 * Re-exports from AuthContext for simpler imports.
 */

import { useAuthContext } from '../contexts/AuthContext';

/**
 * Custom hook for authentication operations.
 * 
 * @returns Authentication state and methods:
 * - isAuthenticated: Whether user is logged in
 * - isLoading: Whether auth operation is in progress
 * - user: Current user account info
 * - error: Any authentication error
 * - login: Trigger login popup
 * - logout: Trigger logout popup
 * - getAccessToken: Get access token for API calls
 * - clearError: Clear current error state
 * 
 * @example
 * ```tsx
 * const { isAuthenticated, login, getAccessToken } = useAuth();
 * 
 * // Check if user is logged in
 * if (!isAuthenticated) {
 *   return <button onClick={login}>Login</button>;
 * }
 * 
 * // Get token for API call
 * const token = await getAccessToken();
 * ```
 */
export function useAuth() {
  return useAuthContext();
}

export default useAuth;
