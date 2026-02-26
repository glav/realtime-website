<!-- markdownlint-disable-file -->
# Task Details: Azure OpenAI GPT Realtime Chatbot Implementation

## Research Reference

**Source Research**: .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md  
**Test Strategy**: .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md

---

## Phase 1: Project Setup & Infrastructure

### Task 1.1: Initialize React 18+ application with Vite

Create a new React application using Vite build tooling with TypeScript template, organized with feature-based folder structure.

* **Files**:
  * `web/` - New React application root directory
  * `web/package.json` - NPM dependencies and scripts
  * `web/vite.config.ts` - Vite build configuration
  * `web/index.html` - HTML entry point
  * `web/src/main.tsx` - React application entry
  * `web/src/App.tsx` - Root component
* **Success**:
  * `npm run dev` starts development server on port 3000
  * Browser displays default React welcome page
  * Hot module replacement (HMR) works for code changes
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 536-595) - React SPA architecture setup with Vite configuration and folder structure
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 599-620) - Vite configuration with proxy setup for Azure Function
* **Implementation Commands**:
  ```bash
  npm create vite@latest web -- --template react-ts
  cd web
  npm install
  npm run dev
  ```
* **Dependencies**: None

---

### Task 1.2: Configure TypeScript and project structure

Setup TypeScript compiler options, create folder structure for components/services/hooks, and configure ESLint for code quality.

* **Files**:
  * `web/tsconfig.json` - TypeScript compiler configuration
  * `web/tsconfig.node.json` - Node-specific TypeScript config
  * `web/.eslintrc.cjs` - ESLint rules
  * `web/src/components/` - React components directory
  * `web/src/services/` - External service integrations directory
  * `web/src/hooks/` - Custom React hooks directory
  * `web/src/contexts/` - React contexts directory
  * `web/src/utils/` - Utility functions directory
  * `web/src/types/` - TypeScript type definitions directory
* **Success**:
  * `npm run build` compiles TypeScript with zero errors
  * `npm run lint` passes with no warnings
  * Folder structure matches architecture diagram
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 622-645) - TypeScript configuration with strict mode and compiler options
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 553-595) - Complete folder structure specification
* **TypeScript Configuration** (web/tsconfig.json):
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "useDefineForClassFields": true,
      "lib": ["ES2020", "DOM", "DOM.Iterable"],
      "module": "ESNext",
      "skipLibCheck": true,
      "moduleResolution": "bundler",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "noEmit": true,
      "jsx": "react-jsx",
      "strict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true
    }
  }
  ```
* **Dependencies**: Task 1.1

---

### Task 1.3: Setup Jest + React Testing Library infrastructure

Install and configure Jest, React Testing Library, jest-webaudio-mock, and Playwright for comprehensive test coverage.

* **Files**:
  * `web/jest.config.js` - Jest configuration
  * `web/jest.setup.js` - Jest setup with RTL matchers
  * `web/playwright.config.ts` - Playwright E2E configuration
  * `web/src/__tests__/` - Unit/integration test directory
  * `web/e2e/` - End-to-end test directory
* **Success**:
  * `npm test` runs Jest and executes test files
  * `npm run test:e2e` runs Playwright tests
  * Coverage reports generate correctly
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 60-100) - Testing infrastructure recommendations with Jest, React Testing Library, Playwright, and jest-webaudio-mock
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 433-482) - Test framework detection and configuration
* **Install Commands**:
  ```bash
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom @playwright/test jest-webaudio-mock
  ```
* **Dependencies**: Task 1.2

---

## Phase 2: Authentication Service (TDD Approach)

### Task 2.1: Write comprehensive auth service tests (TDD Phase 1)

Write Jest tests for all authentication scenarios BEFORE implementing the auth service. Tests must cover login, logout, token acquisition, token refresh, error handling, and edge cases.

* **Files**:
  * `web/src/services/__tests__/authService.test.ts` - Comprehensive auth service tests
* **Success**:
  * All tests defined but initially failing (RED phase of TDD)
  * Tests cover all 8 critical scenarios from test strategy
  * Tests cover all 5 edge cases from test strategy
  * Tests use MSAL.js mocks
* **Research References**:
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 143-187) - Authentication service TDD requirements with critical scenarios and edge cases
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 695-882) - MSAL.js React integration patterns and token acquisition examples
* **Test Scenarios to Cover**:
  1. Successful Azure AD login flow (MSAL.js popup)
  2. Token acquisition and in-memory storage
  3. Automatic token refresh 5 minutes before expiry
  4. Token refresh during active session (no interruption)
  5. Token expiry handling (silent refresh → retry)
  6. 401/403 error handling (redirect to login)
  7. Logout and token cleanup
  8. Concurrent requests during token refresh (queue)
* **Edge Cases to Cover**:
  1. Token refresh fails (require re-authentication)
  2. Multiple simultaneous API calls during token expiry (race condition)
  3. User denied Azure AD permissions (no RBAC role)
  4. Network timeout during authentication
  5. Popup blocker prevents authentication popup
* **Mocking Strategy**:
  ```typescript
  // Mock @azure/msal-browser
  jest.mock('@azure/msal-browser', () => ({
    PublicClientApplication: jest.fn().mockImplementation(() => ({
      loginPopup: jest.fn(),
      acquireTokenSilent: jest.fn(),
      logout: jest.fn()
    }))
  }));
  ```
* **Coverage Target**: 95% (per test strategy)
* **Dependencies**: Task 1.3

---

### Task 2.2: Implement MSAL.js authentication service (TDD Phase 2)

Implement authentication service to make all tests from Task 2.1 pass (GREEN phase of TDD). Follow MSAL.js patterns from research, implement token acquisition, refresh logic, and error handling.

* **Files**:
  * `web/src/services/authService.ts` - MSAL.js authentication wrapper
  * `web/src/utils/constants.ts` - Auth configuration constants
  * `web/.env.local` - Local environment variables (gitignored)
  * `web/.env.example` - Example environment variables
* **Success**:
  * All tests from Task 2.1 pass (GREEN phase)
  * Code coverage reaches 95%+
  * Token refresh works automatically
  * Error handling covers all scenarios
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 234-286) - Complete MSAL.js authentication service example with msalConfig, tokenRequest, and msalInstance
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 695-748) - MSAL.js authentication requirements and Azure AD setup steps
* **Implementation Example** (authService.ts):
  ```typescript
  import { Configuration, PublicClientApplication } from '@azure/msal-browser';

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

  export const tokenRequest = {
    scopes: ['https://cognitiveservices.azure.com/.default']
  };

  export const msalInstance = new PublicClientApplication(msalConfig);
  ```
* **Environment Variables** (.env.example):
  ```
  VITE_AZURE_CLIENT_ID=your-azure-ad-client-id
  VITE_AZURE_TENANT_ID=your-azure-ad-tenant-id
  ```
* **Dependencies**: Task 2.1 (tests must exist first - TDD)

---

### Task 2.3: Create authentication context and hooks

Create React context for authentication state management and custom `useAuth` hook for consuming auth functionality across components.

* **Files**:
  * `web/src/contexts/AuthContext.tsx` - React context for auth state
  * `web/src/hooks/useAuth.ts` - Custom hook for auth operations
  * `web/src/App.tsx` - Wrap app with MsalProvider and AuthContext
* **Success**:
  * Components can access auth state via `useAuth()` hook
  * Token acquisition works from any component
  * Authentication state persists across page refreshes
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 258-285) - useAuth custom hook implementation with acquireTokenSilent and error handling
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 808-867) - MsalProvider setup and authentication context patterns
* **Implementation Example** (useAuth.ts):
  ```typescript
  import { useMsal } from '@azure/msal-react';
  import { InteractionRequiredAuthError } from '@azure/msal-browser';

  export const useAuth = () => {
    const { instance, accounts } = useMsal();
    
    const getAccessToken = async (): Promise<string> => {
      const account = instance.getActiveAccount();
      try {
        const response = await instance.acquireTokenSilent({
          scopes: ['https://cognitiveservices.azure.com/.default'],
          account: account!
        });
        return response.accessToken;
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          const response = await instance.acquireTokenPopup(tokenRequest);
          return response.accessToken;
        }
        throw error;
      }
    };
    
    return { isAuthenticated: accounts.length > 0, getAccessToken };
  };
  ```
* **Dependencies**: Task 2.2

---

### Task 2.4: Build login/logout UI components

Create login button component that triggers MSAL.js authentication popup, displays user info when authenticated, and provides logout functionality.

* **Files**:
  * `web/src/components/Auth/LoginButton.tsx` - Login/logout button component
  * `web/src/components/Auth/__tests__/LoginButton.test.tsx` - Component tests (Code-First)
  * `web/src/components/Layout/AppLayout.tsx` - Main layout with auth UI
* **Success**:
  * Login button triggers Azure AD popup
  * User info displays after successful authentication
  * Logout button clears authentication state
  * Component tests pass with 60%+ coverage
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 868-905) - Login/logout component patterns with MSAL React hooks
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 281-322) - UI component testing approach (Code-First) with 60% coverage target
* **Implementation Pattern**:
  ```typescript
  import { useAuth } from '../../hooks/useAuth';
  
  export const LoginButton = () => {
    const { isAuthenticated, login, logout } = useAuth();
    
    return isAuthenticated ? (
      <button onClick={logout}>Logout</button>
    ) : (
      <button onClick={login}>Login with Azure AD</button>
    );
  };
  ```
* **Test Approach**: Code-First (build UI, then test)
* **Coverage Target**: 60%
* **Dependencies**: Task 2.3

---

## Phase 3: Azure OpenAI Service Integration (TDD Approach)

### Task 3.1: Write Azure OpenAI service tests (TDD Phase 1)

Write comprehensive Jest tests for Azure OpenAI API interactions BEFORE implementation. Tests must cover text messaging, WebSocket streaming, rate limiting, error handling, and token injection.

* **Files**:
  * `web/src/services/__tests__/openaiService.test.ts` - Comprehensive OpenAI service tests
* **Success**:
  * All tests defined but initially failing (RED phase)
  * Tests cover all 10 critical scenarios from test strategy
  * Tests cover all 5 edge cases from test strategy
  * Tests mock Azure OpenAI SDK and Fetch API
* **Research References**:
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 188-228) - Azure OpenAI service TDD requirements with critical scenarios
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 120-135) - Azure OpenAI API specifications (WebSocket, PCM16, authentication)
* **Test Scenarios to Cover**:
  1. Send text message with auth token in header
  2. Receive streamed text response (chunked)
  3. WebSocket connection establishment for voice
  4. Send audio chunks via WebSocket (PCM16 format)
  5. Receive and buffer audio response chunks
  6. Handle 429 rate limiting with exponential backoff (1s, 2s, 4s, 8s)
  7. Request queue management during rate limits (FIFO)
  8. API error handling (400, 500, 503)
  9. Token injection into API headers
  10. Request timeout handling (abort long requests)
* **Edge Cases to Cover**:
  1. WebSocket connection drops mid-conversation (reconnect)
  2. Rate limit exceeded (show countdown timer, queue messages)
  3. API returns malformed response (graceful degradation)
  4. Request timeout (retry with backoff)
  5. Quota exceeded (daily limit reached, disable input)
* **Mocking Strategy**:
  ```typescript
  // Mock Azure OpenAI SDK
  jest.mock('@azure/openai', () => ({
    OpenAIClient: jest.fn().mockImplementation(() => ({
      getChatCompletions: jest.fn()
    }))
  }));
  
  // Mock WebSocket
  global.WebSocket = jest.fn().mockImplementation(() => ({
    send: jest.fn(),
    close: jest.fn()
  }));
  ```
* **Coverage Target**: 90% (per test strategy)
* **Dependencies**: Task 2.2 (needs auth token access)

---

### Task 3.2: Implement Azure OpenAI SDK wrapper service (TDD Phase 2)

Implement Azure OpenAI service to make all tests from Task 3.1 pass. Use @azure/openai SDK for text chat, implement WebSocket for voice streaming, and integrate with auth service for token injection.

* **Files**:
  * `web/src/services/openaiService.ts` - Azure OpenAI SDK wrapper
  * `web/src/utils/constants.ts` - API endpoint and model configuration
* **Success**:
  * All tests from Task 3.1 pass (GREEN phase)
  * Code coverage reaches 90%+
  * Text messages send and receive successfully
  * WebSocket connection establishes for voice
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 907-1007) - Complete Azure OpenAI service implementation with OpenAIClient, text chat, and WebSocket streaming
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 120-135) - Azure OpenAI Realtime API specifications (WebSocket endpoint, audio format, rate limits)
* **Implementation Pattern** (openaiService.ts):
  ```typescript
  import { OpenAIClient } from '@azure/openai';
  import { useAuth } from '../hooks/useAuth';
  
  export class AzureOpenAIService {
    private client: OpenAIClient;
    
    constructor(accessToken: string) {
      this.client = new OpenAIClient(
        import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
        { key: accessToken }
      );
    }
    
    async sendMessage(message: string): Promise<string> {
      const response = await this.client.getChatCompletions(
        import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT,
        [{ role: 'user', content: message }]
      );
      return response.choices[0].message?.content || '';
    }
    
    connectWebSocket(accessToken: string): WebSocket {
      const wsUrl = `${import.meta.env.VITE_AZURE_OPENAI_WS_ENDPOINT}?api-version=2024-02-15`;
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ auth: { token: accessToken } }));
      };
      return ws;
    }
  }
  ```
* **Environment Variables** (.env.example):
  ```
  VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
  VITE_AZURE_OPENAI_DEPLOYMENT=gpt-4-realtime
  VITE_AZURE_OPENAI_WS_ENDPOINT=wss://your-resource.openai.azure.com/realtime
  ```
* **Dependencies**: Task 3.1 (tests must exist first - TDD)

---

### Task 3.3: Add rate limiting and request queue

Implement client-side rate limiting with token bucket algorithm, request queue for managing bursts, and exponential backoff for 429 responses.

* **Files**:
  * `web/src/services/rateLimiter.ts` - Rate limiting logic
  * `web/src/services/__tests__/rateLimiter.test.ts` - Rate limiter tests
  * `web/src/services/openaiService.ts` - Integrate rate limiting into service
* **Success**:
  * Requests are queued when rate limit approached
  * 429 responses trigger exponential backoff
  * User sees countdown timer during rate limiting
  * Rate limiter tests pass
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1009-1062) - Rate limiting implementation with token bucket algorithm and backoff calculation
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 127-129) - Azure OpenAI rate limits (60-120 RPM, 40K-90K TPM)
* **Implementation Pattern** (rateLimiter.ts):
  ```typescript
  export class RateLimiter {
    private queue: Array<() => void> = [];
    private requestCount = 0;
    private maxRequests = 60; // RPM
    private intervalMs = 60000; // 1 minute
    
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      if (this.requestCount >= this.maxRequests) {
        await this.waitForSlot();
      }
      this.requestCount++;
      setTimeout(() => this.requestCount--, this.intervalMs);
      return fn();
    }
    
    private async waitForSlot(): Promise<void> {
      return new Promise(resolve => this.queue.push(resolve));
    }
    
    handleRateLimitError(retryAfterSeconds: number): void {
      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(retryAfterSeconds * 1000, 30000);
      setTimeout(() => this.processQueue(), delay);
    }
  }
  ```
* **Dependencies**: Task 3.2

---

### Task 3.4: Implement comprehensive error handling

Add error handling for all 18 documented error scenarios including authentication errors (401, 403), rate limiting (429), network errors (timeout, offline), and API errors (400, 500, 503).

* **Files**:
  * `web/src/utils/errorHandling.ts` - Error classification and handling utilities
  * `web/src/services/openaiService.ts` - Integrate error handling into service
  * `web/src/components/ErrorDisplay.tsx` - User-facing error messages component
* **Success**:
  * All 18 error scenarios handled gracefully
  * User-friendly error messages displayed
  * Network errors trigger retry with backoff
  * Authentication errors redirect to login
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1064-1144) - Comprehensive error handling patterns with error classification and retry logic
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 86-91) - Error scenarios matrix (18 types documented)
* **Error Classification**:
  ```typescript
  export enum ErrorType {
    AUTHENTICATION_ERROR, // 401, 403
    RATE_LIMIT_ERROR,     // 429
    NETWORK_ERROR,        // timeout, offline
    API_ERROR,            // 400, 500, 503
    AUDIO_DEVICE_ERROR,   // permission denied, device failure
    VALIDATION_ERROR      // malformed input
  }
  
  export const classifyError = (error: any): ErrorType => {
    if (error.status === 401 || error.status === 403) return ErrorType.AUTHENTICATION_ERROR;
    if (error.status === 429) return ErrorType.RATE_LIMIT_ERROR;
    if (error.name === 'NetworkError' || !navigator.onLine) return ErrorType.NETWORK_ERROR;
    if (error.status >= 400 && error.status < 600) return ErrorType.API_ERROR;
    return ErrorType.VALIDATION_ERROR;
  };
  ```
* **Dependencies**: Task 3.3

---

## Phase 4: Chat Interface Components (Code-First Approach)

### Task 4.1: Create chat container and message list components

Build React components for chat container layout and scrollable message list. Implement auto-scroll to bottom for new messages and message history state management.

* **Files**:
  * `web/src/components/Chat/ChatContainer.tsx` - Main chat container component
  * `web/src/components/Chat/MessageList.tsx` - Scrollable message list component
  * `web/src/contexts/ChatContext.tsx` - Chat state management context
  * `web/src/types/index.ts` - Message type definitions
* **Success**:
  * Chat container renders with proper layout
  * Message list displays conversation history
  * Auto-scroll works for new messages
  * Chat history persists in context state
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 559-568) - Chat component structure (ChatContainer, MessageList, MessageInput, VoiceToggle)
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 281-322) - UI component testing approach (Code-First) with 60% coverage target
* **Type Definitions** (types/index.ts):
  ```typescript
  export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    type: 'text' | 'voice';
  }
  
  export interface ChatState {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
  }
  ```
* **Implementation Pattern** (ChatContainer.tsx):
  ```typescript
  import { useState } from 'react';
  import { MessageList } from './MessageList';
  import { MessageInput } from './MessageInput';
  
  export const ChatContainer = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    
    return (
      <div className="chat-container">
        <MessageList messages={messages} />
        <MessageInput onSend={(msg) => setMessages([...messages, msg])} />
      </div>
    );
  };
  ```
* **Test Approach**: Code-First (build UI first, test after in Task 4.4)
* **Dependencies**: Task 3.2 (needs OpenAI service for sending messages)

---

### Task 4.2: Implement message rendering with markdown support

Create message bubble component that renders user and assistant messages with markdown formatting, syntax highlighting for code blocks, and proper styling for different message types.

* **Files**:
  * `web/src/components/Chat/Message.tsx` - Individual message component with markdown rendering
  * `web/src/styles/chat.css` - Chat component styles
  * `web/package.json` - Add react-markdown dependency
* **Success**:
  * Messages render with proper user/assistant styling
  * Markdown formatting works (bold, italic, lists, code blocks)
  * Code blocks have syntax highlighting
  * Message bubbles are visually distinct
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1146-1195) - Message rendering patterns with markdown support
* **Install Dependencies**:
  ```bash
  npm install react-markdown remark-gfm react-syntax-highlighter
  ```
* **Implementation Pattern** (Message.tsx):
  ```typescript
  import ReactMarkdown from 'react-markdown';
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
  
  export const Message = ({ message }: { message: Message }) => {
    return (
      <div className={`message ${message.role}`}>
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              return !inline ? (
                <SyntaxHighlighter language="javascript">
                  {String(children)}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>{children}</code>
              );
            }
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    );
  };
  ```
* **Dependencies**: Task 4.1

---

### Task 4.3: Build message input component with send functionality

Create text input component with send button, Enter key submission, loading state during API calls, and integration with Azure OpenAI service for sending messages.

* **Files**:
  * `web/src/components/Chat/MessageInput.tsx` - Text input with send button
  * `web/src/hooks/useChatMessages.ts` - Custom hook for message operations
* **Success**:
  * User can type message and click send button
  * Enter key submits message (Shift+Enter for new line)
  * Loading indicator shows during API call
  * Messages display in chat after successful send
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1197-1245) - Message input component patterns with send functionality
* **Implementation Pattern** (MessageInput.tsx):
  ```typescript
  import { useState } from 'react';
  import { useAzureOpenAI } from '../../hooks/useAzureOpenAI';
  
  export const MessageInput = ({ onSend }: { onSend: (msg: Message) => void }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { sendMessage } = useAzureOpenAI();
    
    const handleSubmit = async () => {
      if (!input.trim()) return;
      setIsLoading(true);
      
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: input,
        timestamp: new Date(),
        type: 'text'
      };
      onSend(userMessage);
      
      const response = await sendMessage(input);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        type: 'text'
      };
      onSend(assistantMessage);
      
      setInput('');
      setIsLoading(false);
    };
    
    return (
      <div className="message-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder="Type a message..."
        />
        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    );
  };
  ```
* **Dependencies**: Task 4.2

---

### Task 4.4: Write component tests for chat UI (Code-First Phase 2)

Write React Testing Library tests for chat components after implementation is complete. Test user interactions, message rendering, and integration with mocked OpenAI service.

* **Files**:
  * `web/src/components/Chat/__tests__/ChatContainer.test.tsx` - Chat container tests
  * `web/src/components/Chat/__tests__/MessageList.test.tsx` - Message list tests
  * `web/src/components/Chat/__tests__/MessageInput.test.tsx` - Input component tests
* **Success**:
  * All component tests pass
  * Coverage reaches 60%+ for UI components
  * User interaction tests verify send functionality
  * Accessibility tests pass (proper ARIA labels)
* **Research References**:
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 281-322) - UI component testing strategy (Code-First) with 60% coverage target
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 782-850) - Example test patterns for React Testing Library
* **Test Pattern** (MessageInput.test.tsx):
  ```typescript
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import { MessageInput } from '../MessageInput';
  
  describe('MessageInput', () => {
    it('should send message when send button clicked', async () => {
      const onSend = jest.fn();
      render(<MessageInput onSend={onSend} />);
      
      const input = screen.getByPlaceholderText('Type a message...');
      const sendButton = screen.getByText('Send');
      
      await userEvent.type(input, 'Hello AI');
      fireEvent.click(sendButton);
      
      await waitFor(() => expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Hello AI', role: 'user' })
      ));
    });
  });
  ```
* **Test Approach**: Code-First (tests after implementation)
* **Coverage Target**: 60%
* **Dependencies**: Tasks 4.1, 4.2, 4.3 (implementation complete first)

---

## Phase 5: Voice Interaction Features (Hybrid Approach)

### Task 5.1: Write audio service tests for critical logic (TDD Phase 1)

Write Jest tests for audio service state machine logic, buffer management, and error handling BEFORE implementation. Use jest-webaudio-mock for Web Audio API mocking.

* **Files**:
  * `web/src/services/__tests__/audioService.test.ts` - Audio service tests
* **Success**:
  * All tests defined but initially failing (RED phase)
  * Tests cover state machine transitions (idle → recording → streaming → playing)
  * Tests cover audio buffer management (circular buffer)
  * Tests mock Web Audio API with jest-webaudio-mock
* **Research References**:
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 231-278) - Audio service testing strategy (Hybrid: TDD for core logic, exploratory for optimization)
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 151-176) - Web Audio API specifications and getUserMedia constraints
* **Test Scenarios to Cover**:
  1. Request microphone permission (getUserMedia)
  2. Capture audio from microphone (16kHz, mono, PCM16)
  3. Chunk audio for streaming (100-200ms chunks)
  4. Send audio chunks to WebSocket
  5. Receive and buffer incoming audio (circular buffer)
  6. Play audio response (AudioContext)
  7. Handle permission denied (fallback to text)
  8. Handle device failure (show error, disable voice)
* **Mocking Strategy**:
  ```typescript
  // Import jest-webaudio-mock
  import 'jest-webaudio-mock';
  
  // Mock navigator.mediaDevices
  global.navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }])
    })
  };
  ```
* **Coverage Target**: 70% (lower due to browser API mocking complexity)
* **Dependencies**: Task 1.3 (test infrastructure with jest-webaudio-mock)

---

### Task 5.2: Implement audio capture with Web Audio API (Hybrid)

Implement audio capture using navigator.mediaDevices.getUserMedia with Web Audio API AudioContext. Follow test-driven approach for state machine logic, but use exploratory development for buffer optimization and latency tuning.

* **Files**:
  * `web/src/services/audioService.ts` - Web Audio API wrapper for capture/playback
  * `web/src/hooks/useVoiceRecorder.ts` - Custom hook for voice recording
  * `web/src/utils/audioProcessing.ts` - PCM16 encoding and audio utilities
* **Success**:
  * Tests from Task 5.1 pass for state machine logic
  * Microphone permission prompt works correctly
  * Audio captures at 16kHz, mono, PCM16 format
  * Recording starts within 100ms of button press
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 288-355) - Complete Web Audio API voice recorder hook with getUserMedia constraints and state management
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 151-176) - Web Audio API specifications (16kHz sample rate, mono channel, PCM16 encoding)
* **Implementation Pattern** (useVoiceRecorder.ts):
  ```typescript
  import { useState, useRef } from 'react';
  
  export const useVoiceRecorder = (onAudioChunk: (chunk: Int16Array) => void) => {
    const [isRecording, setIsRecording] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        streamRef.current = stream;
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        
        const source = audioContextRef.current.createMediaStreamSource(stream);
        // Use AudioWorklet for low-latency processing
        await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
        const processor = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
        
        processor.port.onmessage = (event) => {
          const pcm16Data = convertToPCM16(event.data);
          onAudioChunk(pcm16Data);
        };
        
        source.connect(processor);
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone access denied:', error);
        throw new Error('AUDIO_DEVICE_ERROR');
      }
    };
    
    const stopRecording = () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      audioContextRef.current?.close();
      setIsRecording(false);
    };
    
    return { isRecording, startRecording, stopRecording };
  };
  ```
* **Test Approach**: TDD for state logic, exploratory for buffer tuning
* **Dependencies**: Task 5.1 (tests for state machine)

---

### Task 5.3: Add WebSocket streaming for voice data

Implement WebSocket connection to Azure OpenAI Realtime API for bidirectional voice streaming. Send PCM16 audio chunks from microphone, receive audio response chunks from API.

* **Files**:
  * `web/src/services/voiceStreamingService.ts` - WebSocket voice streaming handler
  * `web/src/hooks/useVoiceStreaming.ts` - Custom hook for voice streaming
* **Success**:
  * WebSocket connection establishes to Azure OpenAI Realtime endpoint
  * Audio chunks stream from microphone to WebSocket
  * Incoming audio chunks buffer for playback
  * Connection resilience: reconnect after disconnect
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1247-1335) - WebSocket streaming implementation with connection management and audio chunk handling
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 120-135) - Azure OpenAI Realtime API WebSocket specifications (endpoint, authentication, audio format)
* **Implementation Pattern** (voiceStreamingService.ts):
  ```typescript
  export class VoiceStreamingService {
    private ws: WebSocket | null = null;
    private onAudioReceived: (audio: ArrayBuffer) => void;
    
    constructor(onAudioReceived: (audio: ArrayBuffer) => void) {
      this.onAudioReceived = onAudioReceived;
    }
    
    connect(accessToken: string) {
      const wsUrl = `${import.meta.env.VITE_AZURE_OPENAI_WS_ENDPOINT}?api-version=2024-02-15`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.ws!.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16'
          }
        }));
      };
      
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'response.audio.delta') {
          const audioData = Uint8Array.from(atob(data.delta), c => c.charCodeAt(0));
          this.onAudioReceived(audioData.buffer);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.reconnect(accessToken);
      };
    }
    
    sendAudioChunk(chunk: Int16Array) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(chunk.buffer)));
        this.ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio
        }));
      }
    }
    
    reconnect(accessToken: string) {
      setTimeout(() => this.connect(accessToken), 1000);
    }
  }
  ```
* **Dependencies**: Task 5.2

---

### Task 5.4: Implement audio playback and buffering

Implement audio playback using Web Audio API AudioContext with circular buffer for smooth playback. Handle incoming audio chunks from WebSocket and queue for continuous playback without gaps.

* **Files**:
  * `web/src/services/audioPlayback.ts` - Audio playback with circular buffer
  * `web/src/hooks/useAudioPlayback.ts` - Custom hook for audio playback
* **Success**:
  * Audio plays smoothly without gaps or stuttering
  * Circular buffer handles variable chunk sizes
  * Playback latency <50ms
  * Total voice round-trip latency <500ms
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1337-1410) - Audio playback implementation with circular buffer and latency optimization
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 169-174) - Latency optimization targets (<500ms end-to-end)
* **Implementation Pattern** (audioPlayback.ts):
  ```typescript
  export class AudioPlaybackService {
    private audioContext: AudioContext;
    private audioQueue: AudioBuffer[] = [];
    private isPlaying = false;
    
    constructor() {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
    }
    
    async addAudioChunk(audioData: ArrayBuffer) {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      this.audioQueue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playNextChunk();
      }
    }
    
    private playNextChunk() {
      if (this.audioQueue.length === 0) {
        this.isPlaying = false;
        return;
      }
      
      this.isPlaying = true;
      const buffer = this.audioQueue.shift()!;
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => {
        this.playNextChunk();
      };
      
      source.start();
    }
    
    stop() {
      this.audioQueue = [];
      this.isPlaying = false;
    }
  }
  ```
* **Dependencies**: Task 5.3

---

### Task 5.5: Create voice toggle UI components (Code-First)

Build UI components for voice interaction mode: push-to-talk button, voice indicator (speaking animation), voice mode toggle, and permission error display.

* **Files**:
  * `web/src/components/Chat/VoiceToggle.tsx` - Voice mode toggle button
  * `web/src/components/Chat/PushToTalkButton.tsx` - Push-to-talk recording button
  * `web/src/components/Chat/VoiceIndicator.tsx` - Speaking animation indicator
  * `web/src/styles/voice.css` - Voice UI styles
* **Success**:
  * Push-to-talk button triggers recording when pressed
  * Voice indicator shows speaking animation during recording/playback
  * Voice mode toggle switches between text and voice input
  * Permission errors display user-friendly message
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1412-1480) - Voice UI component patterns with push-to-talk and mode toggle
* **Implementation Pattern** (PushToTalkButton.tsx):
  ```typescript
  import { useVoiceRecorder } from '../../hooks/useVoiceRecorder';
  
  export const PushToTalkButton = () => {
    const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
    
    return (
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`push-to-talk ${isRecording ? 'recording' : ''}`}
      >
        🎤 {isRecording ? 'Recording...' : 'Hold to Talk'}
      </button>
    );
  };
  ```
* **Test Approach**: Code-First (UI exploration, test after in Task 5.6)
* **Dependencies**: Task 5.4

---

### Task 5.6: Write integration tests for voice workflow

Write integration tests that cover the complete voice workflow: permission request → recording → streaming → playback. Use manual E2E testing for audio quality validation.

* **Files**:
  * `web/src/__tests__/integration/voiceWorkflow.test.ts` - Voice workflow integration tests
  * `web/e2e/voice-interaction.spec.ts` - Playwright E2E voice test (manual validation)
* **Success**:
  * Integration tests verify voice workflow without errors
  * Permission handling tests pass
  * WebSocket streaming tests pass
  * Manual E2E test confirms audio quality
* **Research References**:
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 323-377) - Integration testing strategy for voice workflow
* **Test Pattern** (voiceWorkflow.test.ts):
  ```typescript
  describe('Voice Workflow Integration', () => {
    it('should complete voice interaction flow', async () => {
      const { startRecording, stopRecording } = useVoiceRecorder();
      const { connect, sendAudioChunk } = useVoiceStreaming();
      
      // Mock permission granted
      global.navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
      
      // Start recording
      await startRecording();
      expect(mockStream.getTracks).toHaveBeenCalled();
      
      // Send audio chunk
      const mockChunk = new Int16Array(1600);
      sendAudioChunk(mockChunk);
      
      // Verify WebSocket send
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('input_audio_buffer.append')
      );
      
      // Stop recording
      stopRecording();
      expect(mockStream.getTracks()[0].stop).toHaveBeenCalled();
    });
  });
  ```
* **Dependencies**: Tasks 5.2, 5.3, 5.4, 5.5 (voice features complete)

---

## Phase 6: Backend Token Proxy (TDD Approach)

### Task 6.1: Initialize Azure Function project with TypeScript

Create Azure Function project using TypeScript template with HTTP trigger for token acquisition endpoint. Configure local development environment with Azure Functions Core Tools.

* **Files**:
  * `backend/` - Azure Function project root
  * `backend/package.json` - Function dependencies
  * `backend/tsconfig.json` - TypeScript config for Functions
  * `backend/host.json` - Function host configuration
  * `backend/local.settings.json` - Local development settings (gitignored)
  * `backend/.funcignore` - Files to exclude from deployment
* **Success**:
  * `func start` runs Azure Function locally on port 7071
  * Function responds to HTTP requests
  * TypeScript compilation works without errors
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1482-1550) - Backend token proxy architecture with Azure Function setup
* **Setup Commands**:
  ```bash
  npm install -g azure-functions-core-tools@4
  func init backend --typescript
  cd backend
  func new --name token --template "HTTP trigger" --authlevel "anonymous"
  npm install @azure/identity @azure/openai
  ```
* **Dependencies**: Task 2.4 (auth flow understood)

---

### Task 6.2: Implement token acquisition endpoint with tests (TDD)

Write tests for token endpoint BEFORE implementation. Tests must cover RBAC token acquisition, on-behalf-of flow, token caching, and error handling. Then implement endpoint to pass all tests.

* **Files**:
  * `backend/token/index.ts` - HTTP trigger function for token acquisition
  * `backend/token/__tests__/index.test.ts` - Token endpoint tests (TDD)
  * `backend/token/tokenService.ts` - Token acquisition logic with Azure Identity
* **Success**:
  * Tests pass for all token scenarios
  * Endpoint returns valid Azure OpenAI access token
  * On-behalf-of flow works correctly
  * Token caching reduces repeated requests
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1552-1635) - Token proxy implementation with on-behalf-of flow and caching
* **Test Scenarios** (write tests first - TDD):
  1. Valid token request returns 200 with token
  2. Invalid auth header returns 401
  3. Missing RBAC role returns 403
  4. Token caching reduces Azure AD calls
  5. Token refresh works before expiry
* **Implementation Pattern** (token/index.ts):
  ```typescript
  import { AzureFunction, Context, HttpRequest } from '@azure/functions';
  import { DefaultAzureCredential } from '@azure/identity';
  
  const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        context.res = { status: 401, body: 'Unauthorized' };
        return;
      }
      
      const userToken = authHeader.replace('Bearer ', '');
      
      // On-behalf-of flow to get Azure OpenAI token
      const credential = new DefaultAzureCredential();
      const tokenResponse = await credential.getToken(
        'https://cognitiveservices.azure.com/.default'
      );
      
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { accessToken: tokenResponse.token }
      };
    } catch (error) {
      context.res = { status: 500, body: 'Internal Server Error' };
    }
  };
  
  export default httpTrigger;
  ```
* **Test Approach**: TDD (security-critical component)
* **Coverage Target**: 95%
* **Dependencies**: Task 6.1

---

### Task 6.3: Configure CORS and security headers

Configure Azure Function CORS settings to allow frontend origin, add security headers (Content-Security-Policy, X-Content-Type-Options), and setup rate limiting middleware.

* **Files**:
  * `backend/host.json` - CORS configuration
  * `backend/token/middleware.ts` - Security headers middleware
* **Success**:
  * CORS allows requests from frontend origin (localhost:3000, production domain)
  * Security headers present in all responses
  * Preflight OPTIONS requests handled correctly
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1637-1685) - CORS and security configuration for Azure Functions
* **CORS Configuration** (host.json):
  ```json
  {
    "version": "2.0",
    "extensions": {
      "http": {
        "routePrefix": "api",
        "cors": {
          "allowedOrigins": [
            "http://localhost:3000",
            "https://your-production-domain.com"
          ],
          "allowedMethods": ["GET", "POST", "OPTIONS"],
          "allowedHeaders": ["Authorization", "Content-Type"]
        }
      }
    }
  }
  ```
* **Dependencies**: Task 6.2

---

### Task 6.4: Test token proxy integration with frontend

Integrate frontend OpenAI service with backend token proxy. Update authService to fetch tokens from proxy endpoint instead of direct Azure AD calls. Test complete authentication flow.

* **Files**:
  * `web/src/services/authService.ts` - Update to use token proxy
  * `web/src/utils/constants.ts` - Add backend proxy endpoint
  * `web/src/__tests__/integration/tokenProxyIntegration.test.ts` - Integration test
* **Success**:
  * Frontend successfully fetches tokens from backend proxy
  * OpenAI API calls work with proxy-acquired tokens
  * Token refresh flow works through proxy
  * Integration test passes
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1687-1740) - Frontend-backend token proxy integration patterns
* **Integration Pattern** (authService.ts):
  ```typescript
  export const getAzureOpenAIToken = async (userToken: string): Promise<string> => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Token acquisition failed');
    }
    
    const data = await response.json();
    return data.accessToken;
  };
  ```
* **Environment Variables** (.env.example):
  ```
  VITE_BACKEND_URL=http://localhost:7071
  ```
* **Dependencies**: Task 6.3, Task 3.2 (frontend OpenAI service)

---

## Phase 7: Responsive UI & Polish

### Task 7.1: Implement responsive mobile layout

Create responsive CSS with mobile-first approach, add media queries for tablet and desktop breakpoints, optimize chat interface for mobile touch interactions, and ensure voice UI works on mobile devices.

* **Files**:
  * `web/src/styles/responsive.css` - Mobile-first responsive styles
  * `web/src/styles/chat.css` - Update chat styles for mobile
  * `web/src/styles/voice.css` - Update voice UI for mobile
  * `web/src/components/Layout/MobileLayout.tsx` - Mobile-specific layout component
* **Success**:
  * Mobile layout (<768px width) displays correctly
  * Touch interactions work for push-to-talk
  * Tablet layout (768px-1024px) optimized
  * Desktop layout (>1024px) maintains current design
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1742-1810) - Responsive UI patterns and mobile optimization strategies
* **Responsive CSS Pattern** (responsive.css):
  ```css
  /* Mobile-first base styles */
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 1rem;
  }
  
  .message-list {
    flex: 1;
    overflow-y: auto;
  }
  
  .message-input {
    width: 100%;
    padding: 0.5rem;
  }
  
  /* Tablet breakpoint */
  @media (min-width: 768px) {
    .chat-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
  }
  
  /* Desktop breakpoint */
  @media (min-width: 1024px) {
    .chat-container {
      max-width: 1200px;
      display: grid;
      grid-template-columns: 250px 1fr;
    }
  }
  ```
* **Test Approach**: Manual testing + visual regression
* **Dependencies**: Tasks 4.3, 5.5 (all UI components exist)

---

### Task 7.2: Add error boundaries and fallback UI

Implement React error boundaries to catch and display errors gracefully, create fallback UI components for error states, add retry mechanisms for recoverable errors, and implement global error handler.

* **Files**:
  * `web/src/components/ErrorBoundary.tsx` - React error boundary component
  * `web/src/components/ErrorFallback.tsx` - Fallback UI for errors
  * `web/src/utils/errorHandler.ts` - Global error handler
* **Success**:
  * Error boundaries catch all component errors
  * Fallback UI displays user-friendly error messages
  * Retry button works for recoverable errors
  * Error details logged for debugging
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1064-1144) - Error handling patterns with classification and user messages
* **Implementation Pattern** (ErrorBoundary.tsx):
  ```typescript
  import { Component, ErrorInfo, ReactNode } from 'react';
  
  interface Props {
    children: ReactNode;
  }
  
  interface State {
    hasError: boolean;
    error: Error | null;
  }
  
  export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    render() {
      if (this.state.hasError) {
        return (
          <div className="error-fallback">
            <h2>Something went wrong</h2>
            <p>{this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </button>
          </div>
        );
      }
      
      return this.props.children;
    }
  }
  ```
* **Dependencies**: All Phase 4-5 tasks

---

### Task 7.3: Optimize bundle size and loading performance

Implement code splitting with React.lazy and Suspense, optimize images and assets, configure Vite for production build optimization, analyze bundle size with rollup-plugin-visualizer, and add loading states for lazy-loaded components.

* **Files**:
  * `web/vite.config.ts` - Production build optimizations
  * `web/src/App.tsx` - Add code splitting with React.lazy
  * `web/src/components/LoadingSpinner.tsx` - Loading state component
* **Success**:
  * Initial bundle size <500KB gzipped
  * Page load time <3 seconds on 3G network
  * Code splitting reduces main bundle size
  * Lighthouse performance score >90
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1812-1870) - Performance optimization strategies for React + Vite
* **Vite Optimization** (vite.config.ts):
  ```typescript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import { visualizer } from 'rollup-plugin-visualizer';
  
  export default defineConfig({
    plugins: [
      react(),
      visualizer({ open: true })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'msal-vendor': ['@azure/msal-browser', '@azure/msal-react'],
            'openai-vendor': ['@azure/openai']
          }
        }
      },
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true
        }
      }
    }
  });
  ```
* **Code Splitting Pattern** (App.tsx):
  ```typescript
  import { lazy, Suspense } from 'react';
  
  const ChatContainer = lazy(() => import('./components/Chat/ChatContainer'));
  
  export const App = () => {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <ChatContainer />
      </Suspense>
    );
  };
  ```
* **Dependencies**: Task 7.2

---

### Task 7.4: Test responsive design across devices

Conduct manual testing on physical devices (mobile phone, tablet, desktop), test with browser dev tools device emulation, validate touch interactions and gestures, test voice UI on mobile Safari (iOS) and Chrome (Android), and document browser compatibility issues.

* **Files**:
  * `web/docs/browser-compatibility.md` - Browser compatibility testing results
  * `web/e2e/responsive.spec.ts` - Playwright responsive tests
* **Success**:
  * All features work on target browsers (Chrome 88+, Firefox 84+, Safari 14.1+)
  * Mobile touch interactions responsive
  * Voice features work on mobile devices
  * Compatibility issues documented
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 151-176) - Browser compatibility requirements and Web Audio API support
* **Testing Checklist**:
  - [ ] Chrome desktop (1920x1080)
  - [ ] Firefox desktop (1920x1080)
  - [ ] Safari desktop (1920x1080)
  - [ ] Chrome mobile (375x667, Android)
  - [ ] Safari mobile (375x667, iOS)
  - [ ] Tablet (768x1024, iPad)
  - [ ] Voice features (microphone permission, recording, playback)
  - [ ] Touch gestures (push-to-talk, scroll, tap)
* **Dependencies**: Tasks 7.1, 7.2, 7.3

---

## Phase 8: End-to-End Testing & Final Validation

### Task 8.1: Write Playwright E2E tests for critical flows

Write comprehensive Playwright E2E tests covering authentication flow, text chat interaction, voice interaction, and error scenarios. Tests must validate complete user journeys from login to conversation.

* **Files**:
  * `web/e2e/auth-flow.spec.ts` - Authentication E2E tests
  * `web/e2e/text-chat.spec.ts` - Text chat E2E tests
  * `web/e2e/voice-interaction.spec.ts` - Voice E2E tests
  * `web/e2e/error-scenarios.spec.ts` - Error handling E2E tests
* **Success**:
  * All E2E tests pass consistently
  * Critical user flows validated end-to-end
  * Test execution time <10 minutes
  * Screenshots captured for failures
* **Research References**:
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 378-432) - E2E testing strategy with Playwright and critical user flows
* **E2E Test Pattern** (auth-flow.spec.ts):
  ```typescript
  import { test, expect } from '@playwright/test';
  
  test('should complete authentication flow', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000');
    
    // Click login button
    await page.click('button:text("Login with Azure AD")');
    
    // Azure AD login popup (mock or real)
    await page.fill('input[name="loginfmt"]', 'test@example.com');
    await page.click('input[type="submit"]');
    await page.fill('input[name="passwd"]', 'password');
    await page.click('input[type="submit"]');
    
    // Verify authenticated state
    await expect(page.locator('text=Welcome')).toBeVisible();
    await expect(page.locator('button:text("Logout")')).toBeVisible();
  });
  
  test('should send and receive text message', async ({ page }) => {
    // Assumes authenticated
    await page.goto('http://localhost:3000');
    
    // Type message
    await page.fill('textarea[placeholder="Type a message..."]', 'Hello AI');
    await page.click('button:text("Send")');
    
    // Verify user message displayed
    await expect(page.locator('.message.user:text("Hello AI")')).toBeVisible();
    
    // Verify assistant response received
    await expect(page.locator('.message.assistant')).toBeVisible({ timeout: 10000 });
  });
  ```
* **Test Approach**: E2E (per test strategy Lines 378-432)
* **Dependencies**: All Phase 2-7 tasks complete

---

### Task 8.2: Validate test coverage targets

Run Jest coverage report, analyze coverage by component type, verify business logic coverage >80%, verify UI component coverage >60%, identify untested critical paths, and write additional tests if coverage below targets.

* **Files**:
  * `web/coverage/` - Jest coverage reports (gitignored)
  * `web/docs/test-coverage-report.md` - Coverage analysis document
* **Success**:
  * Business logic coverage >80% (auth, OpenAI, audio services)
  * UI component coverage >60% (chat, voice components)
  * Coverage report shows no critical gaps
  * All critical paths have test coverage
* **Research References**:
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (Lines 87-99, 151-407) - Coverage targets per component (95% auth, 90% API, 70% audio, 60% UI)
* **Coverage Commands**:
  ```bash
  npm test -- --coverage --collectCoverageFrom='src/**/*.{ts,tsx}'
  ```
* **Coverage Analysis**:
  ```markdown
  # Test Coverage Report
  
  ## Business Logic
  - authService.ts: 95.2% ✅ (Target: 95%)
  - openaiService.ts: 91.8% ✅ (Target: 90%)
  - audioService.ts: 72.4% ✅ (Target: 70%)
  - rateLimiter.ts: 88.3% ✅ (Target: 85%)
  
  ## UI Components
  - ChatContainer.tsx: 62.1% ✅ (Target: 60%)
  - MessageInput.tsx: 58.9% ⚠️ (Target: 60%) - NEEDS IMPROVEMENT
  - VoiceToggle.tsx: 64.5% ✅ (Target: 60%)
  
  ## Overall: 82.3% ✅ (Target: 80% business logic, 60% UI)
  ```
* **Dependencies**: Task 8.1

---

### Task 8.3: Conduct security audit

Review code for security vulnerabilities, verify no secrets in client-side code, test RBAC authentication security, validate CORS configuration, check for XSS vulnerabilities, and run npm audit for dependency vulnerabilities.

* **Files**:
  * `web/docs/security-audit-report.md` - Security audit findings
  * `backend/docs/security-checklist.md` - Backend security checklist
* **Success**:
  * No critical security vulnerabilities found
  * All secrets properly externalized to environment variables
  * RBAC authentication verified secure
  * CORS only allows trusted origins
  * No XSS or injection vulnerabilities
* **Research References**:
  * .agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md (Lines 1872-1930) - Security best practices including secret management, XSS prevention, CSP policies
* **Security Checklist**:
  - [ ] No API keys or secrets in frontend code
  - [ ] Environment variables properly configured
  - [ ] RBAC roles assigned correctly
  - [ ] CORS allows only trusted origins
  - [ ] Content-Security-Policy header configured
  - [ ] XSS protection in message rendering
  - [ ] SQL injection (N/A - no database)
  - [ ] npm audit shows no critical vulnerabilities
  - [ ] HTTPS enforced in production
  - [ ] Token expiry handled correctly
* **Audit Commands**:
  ```bash
  npm audit
  grep -r "api_key\|secret\|password" web/src/
  ```
* **Dependencies**: All implementation complete

---

### Task 8.4: Final integration testing and validation

Execute full integration test suite, validate all 35+ acceptance criteria from specification, test complete user workflows (login → text chat → voice interaction), verify performance targets (<3s page load, <500ms voice latency), document known issues and limitations, and prepare deployment checklist.

* **Files**:
  * `web/docs/acceptance-criteria-validation.md` - Validation checklist
  * `web/docs/deployment-checklist.md` - Deployment preparation
  * `web/docs/known-issues.md` - Known limitations and issues
* **Success**:
  * All 35+ acceptance criteria validated
  * Complete user workflows tested successfully
  * Performance targets met
  * Deployment checklist complete
  * Ready for production deployment
* **Research References**:
  * docs/azure-openai-realtime-chatbot.md (specification with 35+ acceptance criteria)
  * .agent-tracking/test-strategies/20260226-azure-openai-realtime-chatbot-test-strategy.md (validation approach)
* **Acceptance Criteria Validation** (excerpt):
  ```markdown
  # Acceptance Criteria Validation
  
  ## Authentication (AC 1-8)
  - [x] AC1: Users can log in with Azure AD
  - [x] AC2: RBAC roles enforced
  - [x] AC3: Token refresh automatic
  - [x] AC4: No API keys in client code
  - [x] AC5: Logout clears authentication state
  - [x] AC6: 401 errors redirect to login
  - [x] AC7: Token stored in sessionStorage
  - [x] AC8: Concurrent requests handled
  
  ## Text Chat (AC 9-15)
  - [x] AC9: Text messages send successfully
  - [x] AC10: Responses display correctly
  - [x] AC11: Message history maintained
  - [x] AC12: Markdown rendering works
  - [x] AC13: Rate limiting displays countdown
  - [x] AC14: Error messages user-friendly
  - [x] AC15: Loading state during API calls
  
  ## Voice Interaction (AC 16-25)
  - [x] AC16: Microphone permission prompt
  - [x] AC17: Voice recording <100ms latency
  - [x] AC18: Audio streams to API
  - [x] AC19: Voice response playback
  - [x] AC20: Voice latency <500ms
  - [x] AC21: Push-to-talk button responsive
  - [x] AC22: Voice indicator shows state
  - [x] AC23: Permission denied fallback
  - [x] AC24: WebSocket reconnect works
  - [x] AC25: Audio quality acceptable
  
  ## Performance (AC 26-30)
  - [x] AC26: Page load <3s
  - [x] AC27: Voice latency <500ms
  - [x] AC28: Test coverage >80% business logic
  - [x] AC29: Test coverage >60% UI components
  - [x] AC30: Bundle size <500KB gzipped
  
  ## Responsive Design (AC 31-35)
  - [x] AC31: Mobile layout works <768px
  - [x] AC32: Tablet layout works 768px-1024px
  - [x] AC33: Desktop layout works >1024px
  - [x] AC34: Touch interactions responsive
  - [x] AC35: Voice features work on mobile
  ```
* **Performance Validation**:
  ```bash
  # Lighthouse audit
  npx lighthouse http://localhost:3000 --view
  
  # Voice latency test
  # Manual: Record push-to-talk → start playback timing
  ```
* **Dependencies**: Tasks 8.1, 8.2, 8.3

---

## Summary

This implementation plan provides comprehensive, actionable specifications for building the Azure OpenAI GPT Realtime Chatbot. Each task includes:

* **Clear file paths** for all artifacts
* **Success criteria** for validation
* **Research references** with specific line numbers
* **Code examples** from research findings
* **Dependencies** to ensure proper sequencing

**Test Strategy Integration**: HYBRID approach applied throughout:
* **TDD**: Authentication (Phase 2), Azure OpenAI Service (Phase 3), Backend Token Proxy (Phase 6), Audio State Logic (Phase 5 partial)
* **Code-First**: Chat UI (Phase 4), Voice UI (Phase 5 partial), Responsive Design (Phase 7)
* **E2E**: Final validation (Phase 8)

**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 8 (approximately 28 hours total)

**Parallel Work**: Phase 6 (backend) can proceed in parallel with Phase 4-5 (frontend features) after Phase 2 completes

**Next Step**: Run **Step 6** (`sdd.6-review-plan.prompt.md`) to validate this implementation plan before proceeding to execution
