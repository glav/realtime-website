/**
 * Application Constants
 * 
 * Centralized configuration constants for the application.
 */

// Azure OpenAI scope for RBAC authentication
export const AZURE_OPENAI_SCOPE = 'https://cognitiveservices.azure.com/.default';

// Token refresh timing (5 minutes before expiry)
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// Augment globalThis with Vite-injected environment variables
declare global {
  // eslint-disable-next-line no-var
  var __VITE_ENV__: Record<string, string | undefined> | undefined;
}

// Authentication configuration from environment variables
// In Vite: injected via define in vite.config.ts
// In Jest: set via globalThis.__VITE_ENV__ in jest.setup.js
const getEnvVar = (key: string): string => {
  // Browser: use Vite-injected __VITE_ENV__
  if (typeof globalThis !== 'undefined' && globalThis.__VITE_ENV__) {
    return globalThis.__VITE_ENV__[key] || '';
  }
  return '';
};

export const authConfig = {
  clientId: getEnvVar('VITE_AZURE_CLIENT_ID'),
  tenantId: getEnvVar('VITE_AZURE_TENANT_ID'),
  redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
};
