/**
 * MSAL Configuration
 * 
 * Centralized configuration for Azure AD authentication.
 * Used by MsalProvider in main.tsx.
 */

import { PublicClientApplication, type Configuration } from '@azure/msal-browser';
import { authConfig } from './constants';

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

// Create and export MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize the MSAL instance
export async function initializeMsal(): Promise<void> {
  await msalInstance.initialize();
  
  // Check for redirect response
  const response = await msalInstance.handleRedirectPromise();
  if (response?.account) {
    msalInstance.setActiveAccount(response.account);
  } else {
    // Set active account if available
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }
}

export default msalInstance;
