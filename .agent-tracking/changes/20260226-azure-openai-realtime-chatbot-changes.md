<!-- markdownlint-disable-file -->
# Release Changes: Azure OpenAI GPT Realtime Chatbot

**Related Plan**: 20260226-azure-openai-realtime-chatbot-plan.instructions.md
**Implementation Date**: 2026-02-26

## Summary

Initial setup and implementation of Azure OpenAI GPT Realtime Chatbot SPA with React 18+, TypeScript, MSAL.js authentication, and Web Audio API voice capabilities.

## Changes

### Added

* `web/` - New React 18+ application root created with Vite build tooling and TypeScript template
* `web/package.json` - NPM dependencies including React 18.3, TypeScript 5.7, Vite 7.3
* `web/vite.config.ts` - Vite build configuration with React plugin
* `web/tsconfig.json` - TypeScript compiler configuration
* `web/src/main.tsx` - React application entry point
* `web/src/App.tsx` - Root React component
* `web/index.html` - HTML entry point
* `web/src/components/` - React components directory structure (Auth, Chat, Layout subdirectories)
* `web/src/services/` - External service integrations directory
* `web/src/hooks/` - Custom React hooks directory
* `web/src/contexts/` - React contexts directory
* `web/src/utils/` - Utility functions directory
* `web/src/types/` - TypeScript type definitions directory
* `web/src/__tests__/` - Test files directory
* `web/jest.config.js` - Jest testing framework configuration with 80/60% coverage thresholds
* `web/jest.setup.js` - Jest setup file with React Testing Library matchers and Web Audio API mocks
* `web/playwright.config.ts` - Playwright E2E testing configuration for Chrome, Firefox, Safari
* `web/e2e/` - End-to-end test directory
* `web/__mocks__/fileMock.js` - File mock for Jest
* `web/src/__tests__/setup.test.ts` - Initial test file to verify Jest configuration
* `web/src/services/__tests__/authService.test.ts` - Comprehensive auth service tests (30 tests covering 8 critical scenarios + 5 edge cases) - TDD Phase 1 RED
* `web/src/services/authService.ts` - MSAL.js authentication service implementation with login, logout, token acquisition, refresh, and error handling - TDD Phase 2 GREEN
* `web/src/utils/constants.ts` - Auth configuration constants (AZURE_OPENAI_SCOPE, TOKEN_REFRESH_BUFFER_MS, authConfig)
* `web/.env.example` - Environment variable template for Azure AD and OpenAI configuration
* `web/src/contexts/AuthContext.tsx` - React context for auth state management with login, logout, and token acquisition
* `web/src/hooks/useAuth.ts` - Custom hook for consuming auth functionality
* `web/src/utils/msalConfig.ts` - MSAL PublicClientApplication configuration and initialization
* `web/src/components/Auth/LoginButton.tsx` - Login/logout button component with loading and error states
* `web/src/components/Auth/LoginButton.css` - LoginButton styles
* `web/src/components/Auth/__tests__/LoginButton.test.tsx` - LoginButton component tests (14 tests)
* `web/src/components/Layout/AppLayout.tsx` - Main layout component with header and auth UI
* `web/src/components/Layout/AppLayout.css` - AppLayout styles

### Modified

* `web/tsconfig.app.json` - Updated target to ES2020, added resolveJsonModule and isolatedModules options
* `web/package.json` - Added @azure/msal-browser, @azure/msal-react, and identity-obj-proxy dependencies
* `web/src/main.tsx` - Wrapped app with MsalProvider and AuthProvider
* `web/src/App.tsx` - Replaced demo UI with authenticated/unauthenticated templates
* `web/jest.config.js` - Added JSX and esModuleInterop transform configuration

### Removed

