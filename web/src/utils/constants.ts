/**
 * Application Constants
 * 
 * Centralized configuration constants for the application.
 * Authentication is handled by the backend via DefaultAzureCredential.
 */

// Augment globalThis with Vite-injected environment variables
declare global {
  // eslint-disable-next-line no-var
  var __VITE_ENV__: Record<string, string | undefined> | undefined;
}

// Environment variable helper
// In Vite: injected via define in vite.config.ts
// In Jest: set via globalThis.__VITE_ENV__ in jest.setup.js
const getEnvVar = (key: string): string => {
  if (typeof globalThis !== 'undefined' && globalThis.__VITE_ENV__) {
    return globalThis.__VITE_ENV__[key] || '';
  }
  return '';
};

// Backend API configuration
export const apiConfig = {
  // In development with Vite proxy, use relative URLs (empty string)
  // In production, set VITE_BACKEND_URL to the actual backend URL
  backendUrl: getEnvVar('VITE_BACKEND_URL') || '',
};
