/**
 * Application Constants
 * 
 * Centralized configuration constants for the application.
 */

// Azure OpenAI scope for RBAC authentication
export const AZURE_OPENAI_SCOPE = 'https://cognitiveservices.azure.com/.default';

// Token refresh timing (5 minutes before expiry)
export const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// Authentication configuration from environment variables
// In Vite, these are exposed via import.meta.env.VITE_*
// For Jest tests, we use default empty strings
export const authConfig = {
  // These will be populated by Vite in browser, empty in tests
  clientId: '',
  tenantId: '',
  redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
};

// Initialize config if running in Vite
if (typeof globalThis !== 'undefined') {
  // This will be replaced by Vite during build
  try {
    /* @vite-ignore */
    const viteEnv = (globalThis as any).__VITE_ENV__;
    if (viteEnv) {
      authConfig.clientId = viteEnv.VITE_AZURE_CLIENT_ID || '';
      authConfig.tenantId = viteEnv.VITE_AZURE_TENANT_ID || '';
    }
  } catch {
    // Ignore - running in test environment
  }
}
