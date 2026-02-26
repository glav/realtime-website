# MSAL.js React Integration Research

## Executive Summary
Comprehensive patterns for integrating Microsoft Authentication Library (MSAL.js) with React for Azure AD authentication with RBAC token acquisition.

## 1. MsalProvider Configuration

### Installation
```bash
npm install @azure/msal-react @azure/msal-browser
```

### Root-Level Setup (src/main.tsx or App.tsx)
```typescript
import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './services/authService';

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

// Optional: Account selection logic
const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

// Account change event handler
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});

// Wrap app with MsalProvider
ReactDOM.createRoot(document.getElementById('root')!).render(
  <MsalProvider instance={msalInstance}>
    <App />
  </MsalProvider>
);
```

### MSAL Configuration Object (src/services/authService.ts)
```typescript
import { Configuration, LogLevel } from '@azure/msal-browser';

// Environment variables (from .env)
const AZURE_CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID;
const AZURE_TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID;
const AZURE_OPENAI_SCOPE = import.meta.env.VITE_AZURE_OPENAI_SCOPE;

export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID, // Application (client) ID from Azure AD app registration
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID}`, // Tenant ID or 'common'
    redirectUri: window.location.origin, // e.g., http://localhost:3000
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: 'sessionStorage', // 'sessionStorage' or 'localStorage' or 'memoryStorage'
    storeAuthStateInCookie: false, // Set to true for IE11 support
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      }
    }
  }
};

// Scopes for Azure OpenAI
export const loginRequest = {
  scopes: ['openid', 'profile', 'User.Read'] // Basic scopes for login
};

export const tokenRequest = {
  scopes: [AZURE_OPENAI_SCOPE || 'https://cognitiveservices.azure.com/.default']
};
```

### Token Caching Strategies

| Strategy | Use Case | Persistence | Security |
|----------|----------|-------------|----------|
| **sessionStorage** | Recommended for SPAs | Session only (tab close = clear) | ✅ Better (cleared on tab close) |
| **localStorage** | Multi-tab persistence | Persists across sessions | ⚠️ Vulnerable to XSS |
| **memoryStorage** | High security apps | Lost on page refresh | ✅ Best security (no DOM storage) |

**Recommendation**: Use `sessionStorage` for balance of UX and security.

## 2. useMsal Hook Usage Patterns

### Basic Authentication Hook (src/hooks/useAuth.ts)
```typescript
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { tokenRequest } from '../services/authService';

export const useAuth = () => {
  const { instance, accounts, inProgress } = useMsal();
  
  const isAuthenticated = accounts.length > 0;
  const isLoading = inProgress !== 'none';
  
  // Login with popup
  const login = async () => {
    try {
      await instance.loginPopup(tokenRequest);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };
  
  // Login with redirect (alternative)
  const loginRedirect = () => {
    instance.loginRedirect(tokenRequest);
  };
  
  // Logout
  const logout = () => {
    instance.logoutPopup({
      account: instance.getActiveAccount()
    });
  };
  
  // Get access token for Azure OpenAI
  const getAccessToken = async (): Promise<string> => {
    const account = instance.getActiveAccount();
    if (!account) {
      throw new Error('No active account. Please login.');
    }
    
    try {
      // Try silent token acquisition first
      const response = await instance.acquireTokenSilent({
        ...tokenRequest,
        account
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Fallback to interactive popup
        const response = await instance.acquireTokenPopup(tokenRequest);
        return response.accessToken;
      }
      throw error;
    }
  };
  
  return {
    isAuthenticated,
    isLoading,
    user: instance.getActiveAccount(),
    login,
    loginRedirect,
    logout,
    getAccessToken
  };
};
```

### Authentication State Management
```typescript
const { isAuthenticated, isLoading, user, login, logout, getAccessToken } = useAuth();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!isAuthenticated) {
  return <LoginButton onClick={login} />;
}

// User is authenticated - show app
return <ChatInterface user={user} />;
```

## 3. Protected Route Implementations

### Declarative Approach with AuthenticatedTemplate
```typescript
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';

const App = () => {
  return (
    <>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
      
      <AuthenticatedTemplate>
        <ChatInterface />
      </AuthenticatedTemplate>
    </>
  );
};
```

### Route Guard with React Router
```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

// Usage in router
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route path="/" element={<ChatInterface />} />
    <Route path="/settings" element={<Settings />} />
  </Route>
</Routes>
```

### Session Persistence Handling
```typescript
// On app initialization (main.tsx)
import { EventType } from '@azure/msal-browser';

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS) {
    // Session established
    console.log('User logged in');
  } else if (event.eventType === EventType.LOGOUT_SUCCESS) {
    // Clear app state
    console.log('User logged out');
  }
});

// Handle page reload
const handleRedirect = async () => {
  await msalInstance.handleRedirectPromise();
  // Check for active account after redirect
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }
};
handleRedirect();
```

## 4. Token Acquisition Strategies

### Silent Token Acquisition (Preferred)
```typescript
const acquireTokenSilent = async (scopes: string[]) => {
  const account = msalInstance.getActiveAccount();
  
  try {
    const response = await msalInstance.acquireTokenSilent({
      scopes,
      account: account!,
      forceRefresh: false // Use cached token if valid
    });
    return response.accessToken;
  } catch (error) {
    // Handle InteractionRequiredAuthError
    throw error;
  }
};
```

### Popup Flow (Fallback)
```typescript
const acquireTokenPopup = async (scopes: string[]) => {
  try {
    const response = await msalInstance.acquireTokenPopup({
      scopes,
      prompt: 'select_account' // 'login', 'consent', 'select_account', 'none'
    });
    return response.accessToken;
  } catch (error) {
    if (error.errorCode === 'popup_window_error') {
      // Popup blocked by browser
      console.error('Popup blocked. Use redirect instead.');
    }
    throw error;
  }
};
```

### Redirect Flow (Alternative)
```typescript
const acquireTokenRedirect = (scopes: string[]) => {
  msalInstance.acquireTokenRedirect({
    scopes,
    redirectUri: '/auth-callback' // Optional: specific redirect URI
  });
  // After redirect, handle with handleRedirectPromise()
};
```

### Scopes Configuration for Azure OpenAI
```typescript
// Required scopes for Azure OpenAI API
export const azureOpenAIScopes = [
  'https://cognitiveservices.azure.com/.default'
  // OR specific scopes if custom role:
  // 'api://<azure-openai-app-id>/OpenAI.Read'
];

// Token acquisition with specific scopes
const getOpenAIToken = async () => {
  const account = msalInstance.getActiveAccount();
  const response = await msalInstance.acquireTokenSilent({
    scopes: azureOpenAIScopes,
    account: account!
  });
  return response.accessToken;
};
```

## 5. Token Caching & Refresh

### Automatic Token Refresh
MSAL.js handles token refresh automatically:
- Access tokens cached for duration (typically 1 hour)
- `acquireTokenSilent()` uses refresh token if access token expired
- Refresh tokens valid for 90 days (configurable in Azure AD)

### Manual Cache Management
```typescript
// Clear token cache (e.g., on logout)
const clearCache = () => {
  const accounts = msalInstance.getAllAccounts();
  accounts.forEach(account => {
    msalInstance.setActiveAccount(null);
  });
  // Optionally clear browser storage
  sessionStorage.clear();
};

// Force token refresh
const forceRefresh = async () => {
  const account = msalInstance.getActiveAccount();
  const response = await msalInstance.acquireTokenSilent({
    scopes: tokenRequest.scopes,
    account: account!,
    forceRefresh: true // Bypass cache
  });
  return response.accessToken;
};
```

### Token Expiration Handling
```typescript
// Proactive token refresh (5 minutes before expiration)
const setupTokenRefresh = (expiresOn: Date) => {
  const refreshTime = expiresOn.getTime() - Date.now() - (5 * 60 * 1000); // 5 min buffer
  
  if (refreshTime > 0) {
    setTimeout(async () => {
      try {
        await acquireTokenSilent(tokenRequest.scopes);
        console.log('Token refreshed proactively');
      } catch (error) {
        console.error('Proactive refresh failed:', error);
      }
    }, refreshTime);
  }
};
```

### In-Memory Cache (High Security)
```typescript
// For sensitive applications - no browser storage
export const msalConfig: Configuration = {
  cache: {
    cacheLocation: 'memoryStorage', // No persistence
    storeAuthStateInCookie: false
  }
};

// Warning: User must re-authenticate on page refresh
```

## 6. Error Handling Patterns

### Error Classification
```typescript
import {
  InteractionRequiredAuthError,
  BrowserAuthError,
  AuthError
} from '@azure/msal-browser';

const handleAuthError = async (error: any) => {
  if (error instanceof InteractionRequiredAuthError) {
    // Silent acquisition failed - need user interaction
    console.log('User interaction required');
    return await msalInstance.acquireTokenPopup(tokenRequest);
    
  } else if (error instanceof BrowserAuthError) {
    // Browser-specific error (popup blocked, network issue)
    if (error.errorCode === 'popup_window_error') {
      alert('Popup blocked. Please allow popups for this site.');
    } else if (error.errorCode === 'user_cancelled') {
      console.log('User cancelled login');
    }
    throw error;
    
  } else if (error instanceof AuthError) {
    // Generic auth error (invalid credentials, etc.)
    console.error('Authentication error:', error.message);
    throw error;
  }
};
```

### Retry Logic for Transient Failures
```typescript
const acquireTokenWithRetry = async (scopes: string[], maxRetries = 3) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await acquireTokenSilent(scopes);
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Not a transient error - fallback to popup immediately
        return await acquireTokenPopup(scopes);
      }
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};
```

### User-Friendly Error Messages
```typescript
const getAuthErrorMessage = (error: any): string => {
  if (error.errorCode === 'user_cancelled') {
    return 'Login was cancelled. Please try again.';
  } else if (error.errorCode === 'consent_required') {
    return 'Additional permissions required. Please approve.';
  } else if (error.errorCode === 'interaction_in_progress') {
    return 'Another login is in progress. Please wait.';
  } else if (error.errorCode === 'popup_window_error') {
    return 'Popup blocked. Enable popups and try again.';
  }
  return 'Authentication failed. Please try again later.';
};
```

## 7. Azure AD App Registration Requirements

### Required Configuration in Azure Portal

1. **Platform: Single Page Application (SPA)**
   - Navigate to: Azure AD → App registrations → Your App → Authentication
   - Add platform: **Single-page application**
   - Add Redirect URIs:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)
   - Enable **ID tokens** if using implicit flow (not recommended for new apps)

2. **API Permissions**
   - Grant permissions to **Azure OpenAI** service:
     - `Microsoft.CognitiveServices/accounts/OpenAI/*` (via custom role)
     - OR use delegated permissions if exposed
   - Add **Microsoft Graph** permissions (optional):
     - `User.Read` (basic profile)
     - `openid`, `profile`, `email`

3. **Required Scopes**
   - Azure OpenAI scope format: `https://cognitiveservices.azure.com/.default`
   - Custom scopes (if using custom API): `api://<app-id>/<scope-name>`

4. **Client ID Configuration**
   - Copy **Application (client) ID** from Overview page
   - Copy **Directory (tenant) ID**
   - Store in `.env` file:
     ```env
     VITE_AZURE_CLIENT_ID=<your-client-id>
     VITE_AZURE_TENANT_ID=<your-tenant-id>
     VITE_AZURE_OPENAI_SCOPE=https://cognitiveservices.azure.com/.default
     ```

5. **CORS Configuration** (if using backend proxy)
   - Add allowed origins in Azure Function or backend API
   - Include: `http://localhost:3000`, `https://yourdomain.com`

### Role Assignment for Users
```bash
# Assign "Cognitive Services OpenAI User" role to users
az role assignment create \
  --role "Cognitive Services OpenAI User" \
  --assignee <user-email-or-object-id> \
  --scope /subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<openai-resource>
```

## 8. Complete Integration Example

### Auth Service (src/services/authService.ts)
```typescript
import { PublicClientApplication, Configuration, AuthenticationResult } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['openid', 'profile', 'User.Read']
};

export const tokenRequest = {
  scopes: ['https://cognitiveservices.azure.com/.default']
};
```

### Main App Setup (src/main.tsx)
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './services/authService';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>
  </React.StrictMode>
);
```

### App Component (src/App.tsx)
```typescript
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/Auth/LoginPage';
import ChatInterface from './components/Chat/ChatInterface';

const App = () => {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
      
      <AuthenticatedTemplate>
        <ChatInterface />
      </AuthenticatedTemplate>
    </>
  );
};

export default App;
```

## Implementation Checklist

- [ ] Install `@azure/msal-browser` and `@azure/msal-react`
- [ ] Create Azure AD app registration (SPA platform)
- [ ] Configure redirect URIs and API permissions
- [ ] Set up `.env` with client ID, tenant ID, and scopes
- [ ] Initialize `PublicClientApplication` in main.tsx
- [ ] Wrap app with `MsalProvider`
- [ ] Create `useAuth()` custom hook for token acquisition
- [ ] Implement protected routes with `AuthenticatedTemplate`
- [ ] Add error handling for `InteractionRequiredAuthError`
- [ ] Test token refresh before expiration
- [ ] Assign Azure RBAC role to test users

## References
- **MSAL.js React Documentation**: https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react
- **Azure AD App Registration**: https://learn.microsoft.com/azure/active-directory/develop/quickstart-register-app
- **Token Acquisition**: https://learn.microsoft.com/azure/active-directory/develop/scenario-spa-acquire-token
- **MSAL Browser Package**: https://www.npmjs.com/package/@azure/msal-browser
