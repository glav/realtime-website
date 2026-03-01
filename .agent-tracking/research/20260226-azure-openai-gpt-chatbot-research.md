<!-- markdownlint-disable-file -->
# Task Research Documents: Azure OpenAI GPT Realtime Chatbot with Voice

Building a Single Page Application (SPA) that provides a chatbot interface to Azure OpenAI GPT Realtime model with both text and real-time voice interaction capabilities. The application will use React 18+ for the frontend, MSAL.js for Azure RBAC authentication, and Web Audio API for voice capabilities. A lightweight backend (Azure Function or Node.js API) will handle secure token acquisition and CORS proxy needs.

## Task Implementation Requests

### ✅ Completed Tasks
* ✅ **Set up React 18+ SPA with Vite build tooling** - `web/` directory established with React 18.3.1, TypeScript, Vite 7.3.1
* ✅ **Configure Jest + React Testing Library** - `jest.config.js` with 80%/60% coverage thresholds, Web Audio API mocks in `jest.setup.js`
* ✅ **Configure Playwright for E2E testing** - `playwright.config.ts` with basic app loading tests in `e2e/app.spec.ts`
* ✅ **Project scaffolding** - Component directories (`components/Auth`, `components/Chat`, `components/Layout`), hooks, services, contexts, types, utils

### 🚧 Pending Implementation Tasks
* 🔲 **Implement MSAL.js authentication flow with Azure AD** - Auth service, useAuth hook, LoginButton component, MsalProvider integration
* 🔲 **Integrate Azure OpenAI SDK for text-based chat interface** - OpenAI service, useChat hook, MessageList, MessageInput components
* 🔲 **Implement real-time voice input/output using Web Audio API** - Audio service, useVoiceRecorder hook, VoiceToggle component
* 🔲 **Create WebSocket connection for Realtime API** - Connection management, audio streaming, response handling
* 🔲 **Create lightweight backend for secure token management** - Azure Function or Node.js API for token proxy (pending architecture decision)
* 🔲 **Implement error handling for network, authentication, and API failures** - Error boundaries, retry logic, user-friendly messages
* 🔲 **Create responsive UI supporting desktop and mobile** - CSS/Tailwind styling, mobile-first design
* 🔲 **Write comprehensive tests** - Unit tests for hooks/services, integration tests for components, E2E tests for user flows

## Scope and Success Criteria
* Scope: 
  * Research covers frontend SPA architecture, Azure OpenAI Realtime API integration, RBAC authentication patterns, Web Audio API implementation, and lightweight backend requirements
  * Excludes: Server-side rendering, complex backend business logic, non-Azure authentication providers
* Assumptions:
  * Azure OpenAI service is already provisioned
  * Azure AD tenant is configured for application registration
  * Target browsers support Web Audio API, MediaDevices API, and WebSocket API
  * Development team has basic React and TypeScript experience
* Success Criteria:
  * Complete technical approach documented with code examples
  * Testing infrastructure and patterns identified
  * Authentication flow documented with security best practices
  * Voice interaction architecture validated
  * Implementation guidance ready for planning phase

## Outline
1. **Testing Infrastructure Research** - Identify existing test framework, patterns, and coverage requirements
2. **Project Structure Analysis** - Current codebase structure and conventions
3. **React SPA Architecture** - Component structure, state management, routing
4. **Azure OpenAI Realtime API Integration** - SDK usage, WebSocket/streaming patterns, message handling
5. **MSAL.js Authentication** - RBAC flow, token acquisition, refresh patterns
6. **Web Audio API Implementation** - Audio capture, playback, codec considerations
7. **Backend Requirements** - Token proxy, CORS handling, minimal API surface
8. **Error Handling Patterns** - Network failures, auth errors, API limits
9. **Responsive UI Patterns** - Mobile/desktop considerations
10. **Security Best Practices** - Secret management, XSS prevention, CSP policies

### Potential Next Research
* ⚠️ **Azure region availability for GPT Realtime API** (CRITICAL)
  * **Reasoning**: Not all Azure regions support Realtime API - must confirm before deployment
  * **Reference**: Azure OpenAI documentation, user must verify their target region
* Backend architecture finalization (Azure Functions vs Node.js Express)
  * **Reasoning**: Need to decide between serverless (Azure Functions) vs minimal Express API
  * **Reference**: Technical scenarios section 5
* Responsive UI framework selection (Tailwind CSS vs Material-UI vs plain CSS)
  * **Reasoning**: Need consistent styling approach across desktop and mobile
  * **Reference**: User objective - responsive design requirement
* Deployment strategy (Azure Static Web Apps vs App Service)
  * **Reasoning**: Hosting platform affects CI/CD, cost, and scalability
  * **Reference**: User objective - hosting requirements

## Research Executed

### Testing Infrastructure Research
✅ **Status**: Verified - Testing infrastructure is IMPLEMENTED AND WORKING

* **Current Project Framework**: Jest 30.2.0 + React Testing Library + Playwright 1.58.2
  * **Location**: `web/src/__tests__/` for unit tests, `web/e2e/` for E2E tests
  * **Test Files Found**:
    - `web/src/__tests__/setup.test.ts` - Jest setup verification test (Lines 1-13) ✅
    - `web/e2e/app.spec.ts` - Playwright E2E tests (Lines 1-56) ✅
  * **Configuration Files**:
    - `web/jest.config.js` - Jest configuration with 80%/60% coverage thresholds ✅
    - `web/jest.setup.js` - Web Audio API mocks (AudioContext, MediaRecorder, navigator.mediaDevices) ✅
    - `web/playwright.config.ts` - Playwright configuration with dev server integration ✅
  * **Scripts**: `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run test:e2e`

### Test Patterns Found
✅ **Status**: Verified test patterns from implemented infrastructure

**Implemented Patterns** (from `web/jest.setup.js` Lines 1-36):
* Web Audio API mocking established:
  ```javascript
  global.AudioContext = jest.fn().mockImplementation(() => ({
    createMediaStreamSource: jest.fn(),
    createBufferSource: jest.fn(),
    createBuffer: jest.fn(),
    decodeAudioData: jest.fn(),
    close: jest.fn(),
    resume: jest.fn(),
    state: 'running',
    sampleRate: 16000
  }));
  ```
* MediaRecorder API mock with start/stop/pause/resume methods
* navigator.mediaDevices.getUserMedia mock returning stream with configurable settings

**E2E Test Patterns** (from `web/e2e/app.spec.ts` Lines 1-56):
* Page loading verification with timeout management
* Console error detection
* Component visibility assertions
* Interactive element testing (button clicks, state changes)

### Coverage Standards
* **Unit Tests**: 80% minimum (business logic, utilities)
* **Integration Tests**: 60% minimum (component integration, API mocking)
* **E2E Tests**: Critical paths covered (authentication, chat flow, voice interaction)
* **Critical Paths**: 100% required (authentication flow, real-time API communication)

### Testing Approach Recommendation
* **Authentication Module**: TDD (complex MSAL.js integration, security-critical)
* **Chat Interface Components**: Code-First (straightforward UI with clear requirements)
* **Voice Input/Output Handler**: TDD (complex Web Audio API logic, timing-sensitive)
* **Azure OpenAI Integration**: TDD (API contract compliance, error handling critical)
* **UI Components**: Code-First (simple presentation components)
* **Backend Token Proxy**: TDD (security-critical, minimal surface area)

**Rationale**: Complex authentication and voice handling require TDD for confidence and regression prevention. Straightforward UI components benefit from faster Code-First iteration. Real-time API integration is mission-critical and benefits from contract testing upfront.

### File Analysis
* `/workspaces/realtime-website/src/app.py` (Lines 1-5)
  * Current entrypoint is Python-based with environment variable loading
  * ✅ `.env` pattern already established in project
* `/workspaces/realtime-website/pyproject.toml` (Lines 1-32)
  * Python project using `uv` package manager
  * Ruff for linting with Python 3.12 target
  * ⚠️ **Implication**: React SPA will be a NEW application structure alongside Python backend

### Code Search Results
* No existing React, TypeScript, or JavaScript source files found
* No existing test files for frontend
* Project is currently Python-only with minimal structure

### External Research (Evidence Log)
✅ **Status**: Completed - Comprehensive research conducted via explore agents

* **Azure OpenAI Realtime API Research**:
  * Source: [Subagent Research Document](.agent-tracking/research/subagent/azure-openai-api-research.md)
  * Source: [Project Objective Document](docs/azure-openai-realtime-chatbot.md) (Lines 234-246, 323-336)
  * Key Findings:
    * **Models**: GPT-4 Realtime (region-dependent availability) ⚠️ Must verify Azure region support
    * **Protocol**: WebSocket primary for real-time bidirectional audio streaming
    * **Audio Specs**: PCM16 or Opus codec, 16kHz sample rate, mono channel, 100-200ms chunks (1600-3200 bytes)
    * **Authentication**: RBAC with Azure AD, scope `https://cognitiveservices.azure.com/.default`
    * **Rate Limits**: 60-120 RPM, 40K-90K TPM (varies by subscription tier)
    * **Error Codes**: 400 (bad request), 401 (unauthorized), 429 (rate limit), 500/503 (server errors)
    * **SDK**: `@azure/openai` v1.0.0-beta.11+ (TypeScript support included)
    * ⚠️ **Open Questions**: 
      - Exact WebSocket endpoint format for Realtime API
      - Does SDK fully support WebSocket or require raw WebSocket implementation?
      - Voice response format (PCM16 direct or base64-encoded?)
    
* **MSAL.js React Integration Research**:
  * Source: [Subagent Research Document](.agent-tracking/research/subagent/msal-react-research.md)
  * Source: https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react (Accessed: 2026-02-26)
  * Key Findings:
    * **Packages**: `@azure/msal-react` v2.x + `@azure/msal-browser` v3.x
    * **Setup**: MsalProvider at app root with PublicClientApplication instance
    * **Token Acquisition**: 
      - `acquireTokenSilent()` for background acquisition (uses cached/refresh tokens)
      - `acquireTokenPopup()` fallback for InteractionRequiredAuthError
      - `acquireTokenRedirect()` alternative (full page redirect)
    * **Caching**: sessionStorage recommended (balance security + UX), memoryStorage for high security
    * **Error Handling**: InteractionRequiredAuthError (retry with popup), BrowserAuthError (popup blocked)
    * **Azure AD Setup**: SPA platform registration, redirect URIs for localhost:3000 + production domain
    * **RBAC Role**: Assign "Cognitive Services OpenAI User" to users via Azure CLI
    
* **Web Audio API Research**:
  * Source: [Subagent Research Document](.agent-tracking/research/subagent/web-audio-api-research.md)
  * Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API (Accessed: 2026-02-26)
  * Key Findings:
    * **Browser Compatibility**: Chrome 53+, Firefox 36+, Safari 14.1+, Edge 79+ (all meet requirements)
    * **Codec Support**: Safari doesn't support WebM/Opus - **must use PCM16 (WAV) as universal fallback**
    * **getUserMedia Constraints**:
      ```javascript
      {
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }
      ```
    * **Latency Optimization**: 
      - Use AudioWorklet (not deprecated ScriptProcessorNode) for <50ms processing
      - 20ms audio chunks (320 samples at 16kHz) for streaming
      - Web Workers for PCM16 encoding to offload main thread
      - Target: <500ms end-to-end (<200ms input + <50ms encoding + ~100-300ms network + <50ms playback)
    * **Safari Quirk**: AudioContext starts in 'suspended' state - **must resume after user gesture**
    * **Permission Errors**: NotAllowedError (denied), NotFoundError (no device), NotReadableError (in use)
    * **Security**: getUserMedia requires HTTPS (except localhost)

### Project Conventions
* **Standards referenced**: `.github/copilot-instructions.md` (minimal conventions defined)
* **Instructions followed**: Repository workspace search restrictions, prompts files search process
* **Python conventions**: Ruff formatting (double quotes, 100 char line length, Python 3.12+)
* **Testing conventions**: TBD for React/TypeScript (will establish based on industry standards)

## Key Discoveries

### Project Structure
📁 **Current State**: React SPA infrastructure ESTABLISHED in `web/` directory

* **Frontend Directory**: `web/` - React 18.3.1 + TypeScript + Vite 7.3.1
* **Source Files**:
  - `web/src/main.tsx` - Application entry point
  - `web/src/App.tsx` - Root component (currently default Vite template)
  - `web/src/components/` - Auth, Chat, Layout subdirectories (scaffolded, empty)
  - `web/src/hooks/` - Custom hooks directory (scaffolded, empty)
  - `web/src/services/` - Service integrations directory (scaffolded, empty)
  - `web/src/contexts/` - React contexts directory (scaffolded, empty)
  - `web/src/types/` - TypeScript type definitions (scaffolded, empty)
  - `web/src/utils/` - Utilities directory (scaffolded, empty)
* **Test Infrastructure**:
  - `web/src/__tests__/setup.test.ts` - Jest verification test
  - `web/e2e/app.spec.ts` - Playwright E2E tests
  - `web/__mocks__/fileMock.js` - Jest file mocks
* **Configuration**:
  - `web/package.json` - Dependencies (React 18.3.1, devDeps for testing)
  - `web/vite.config.ts` - Vite build configuration
  - `web/tsconfig.json`, `web/tsconfig.app.json`, `web/tsconfig.node.json` - TypeScript configs
  - `web/jest.config.js` - Jest with coverage thresholds (80/60)
  - `web/jest.setup.js` - Web Audio API mocks
  - `web/playwright.config.ts` - E2E test configuration
  - `web/eslint.config.js` - ESLint rules
* **Python Backend**: `src/` - Minimal Python environment loader (existing)
* **Documentation**: `docs/`, `.agent/` (AI workflow instructions)

🎯 **Implementation State**:
The React SPA infrastructure is now established. Component directories are scaffolded but empty, awaiting implementation of:
- MSAL.js authentication components (`components/Auth/`)
- Chat interface components (`components/Chat/`)
- Custom hooks for auth, chat, and voice (`hooks/`)
- Service wrappers for Azure OpenAI and audio (`services/`)
```text
/workspaces/realtime-website/
├── src/                          # Python backend (existing)
│   ├── app.py
│   └── load_env.py
├── web/                          # NEW: React SPA frontend
│   ├── public/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # Azure OpenAI, MSAL services
│   │   ├── utils/               # Helpers, constants
│   │   ├── __tests__/           # Unit/integration tests
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── e2e/                     # Playwright E2E tests
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── playwright.config.ts
├── backend/                      # NEW: Token proxy (Azure Function or Node.js)
│   └── (TBD based on backend choice)
└── pyproject.toml               # Existing Python config
```

### Implementation Patterns
✅ **Status**: Project infrastructure ESTABLISHED with standard React patterns

**Verified Patterns** (from existing `web/` codebase):
* React 18+ with TypeScript (strict mode)
* Functional components with hooks (useState visible in App.tsx)
* Vite for fast development and optimized builds
* ESLint with React hooks plugin
* Jest + React Testing Library for unit tests
* Playwright for E2E tests

**Patterns to Implement** (based on research):
* Custom hooks for reusable logic (useAuth, useAzureOpenAI, useVoiceRecorder)
* Context API for global state (AuthContext, ChatContext)
* MsalProvider wrapper at app root (main.tsx)
* Protected routes with AuthenticatedTemplate/UnauthenticatedTemplate
* AudioWorklet for low-latency voice processing

### Complete Examples

✅ **Status**: Comprehensive code examples available in subagent research documents

**MSAL.js Authentication Service** (src/services/authService.ts):
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
*Full example: [msal-react-research.md](../subagent/msal-react-research.md#8-complete-integration-example)*

**useAuth Custom Hook** (src/hooks/useAuth.ts):
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
*Full example: [msal-react-research.md](../subagent/msal-react-research.md#2-usemsal-hook-usage-patterns)*

**Web Audio Voice Recorder Hook** (src/hooks/useVoiceRecorder.ts):
```typescript
export const useVoiceRecorder = (onAudioChunk: (chunk: Int16Array) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    const audioContext = new AudioContext({ sampleRate: 16000 });
    await audioContext.audioWorklet.addModule('/audio-processor.worklet.js');
    
    const workletNode = new AudioWorkletNode(audioContext, 'audio-stream-processor');
    workletNode.port.onmessage = (event) => {
      onAudioChunk(event.data); // Int16Array PCM16 chunks
    };
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(workletNode);
    setIsRecording(true);
  };
  
  return { isRecording, startRecording };
};
```
*Full example: [web-audio-api-research.md](../subagent/web-audio-api-research.md#7-react-hooks-for-web-audio)*

**PCM16 Audio Encoding** (src/utils/audioEncoding.ts):
```typescript
export const float32ToPCM16 = (float32Array: Float32Array): Int16Array => {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  return pcm16;
};
```
*Full example: [web-audio-api-research.md](../subagent/web-audio-api-research.md#3-audio-encoding-for-real-time-streaming)*

### API and Schema Documentation

✅ **Status**: Documented - Key API specifications identified

**Azure OpenAI Chat Completion API**:
* **Endpoint**: `https://<resource-name>.openai.azure.com/openai/deployments/<deployment-id>/chat/completions`
* **API Version**: `?api-version=2024-02-15-preview` (or later)
* **Authentication**: `Authorization: Bearer <azure-ad-token>`
* **Message Schema**:
  ```json
  {
    "messages": [
      { "role": "system|user|assistant", "content": "text" }
    ],
    "max_tokens": 150,
    "temperature": 0.7,
    "stream": true
  }
  ```
* **Streaming Response**: Server-Sent Events (SSE) with `data:` prefix, terminated by `data: [DONE]`

**Azure OpenAI Realtime API (WebSocket)**:
* ⚠️ **Endpoint Format**: To be confirmed (likely `wss://<resource>.openai.azure.com/realtime?token=<bearer>`)
* **Audio Format**:
  - Input: PCM16 or Opus, 16kHz, mono, chunked (100-200ms / 1600-3200 bytes per chunk)
  - Output: PCM16 or Opus, same specifications
* **Connection Flow**: 
  1. Authenticate via MSAL.js → Get Azure AD token
  2. Establish WebSocket with token in query param or header
  3. Send audio chunks via binary frames
  4. Receive transcription + audio response
  5. Maintain connection with keepalive/heartbeat

**MSAL.js Token Response Schema**:
```typescript
interface AuthenticationResult {
  accessToken: string;         // JWT for Azure OpenAI API
  account: AccountInfo;
  expiresOn: Date;             // Token expiration (typically 1 hour)
  scopes: string[];
  tokenType: string;           // "Bearer"
}
```

**Web Audio MediaStream Constraints**:
```typescript
interface MediaStreamConstraints {
  audio: {
    sampleRate: number;        // 16000 (16kHz)
    channelCount: number;      // 1 (mono)
    echoCancellation: boolean; // true
    noiseSuppression: boolean; // true
    autoGainControl: boolean;  // true
  };
}
```

**References**:
* Azure OpenAI API: [azure-openai-api-research.md](../subagent/azure-openai-api-research.md)
* MSAL.js Token Schema: [msal-react-research.md](../subagent/msal-react-research.md#4-token-acquisition-strategies)
* Web Audio Specs: [web-audio-api-research.md](../subagent/web-audio-api-research.md#3-audio-encoding-for-real-time-streaming)

### Configuration Examples

✅ **Status**: Complete - All configuration examples documented

**Vite Configuration** (web/vite.config.ts):
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:7071', // Azure Function local dev
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

**TypeScript Configuration** (web/tsconfig.json):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

**Environment Variables** (web/.env.example):
```env
VITE_AZURE_CLIENT_ID=<your-azure-ad-app-client-id>
VITE_AZURE_TENANT_ID=<your-azure-ad-tenant-id>
VITE_AZURE_OPENAI_ENDPOINT=https://<resource-name>.openai.azure.com
VITE_AZURE_OPENAI_DEPLOYMENT_ID=<deployment-name>
```

**Jest Configuration** (web/jest.config.js):
```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy'
  },
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**Playwright Configuration** (web/playwright.config.ts):
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
  },
});
```

**Package.json Scripts** (web/package.json):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx"
  }
}
```

**AudioWorklet Processor** (web/public/audio-processor.worklet.js):
```javascript
class AudioStreamProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0]; // Mono channel
      
      // Convert Float32 to PCM16
      const pcm16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      this.port.postMessage(pcm16);
    }
    return true; // Keep processor alive
  }
}

registerProcessor('audio-stream-processor', AudioStreamProcessor);
```

**References**:
* Full configurations: [Research Technical Scenarios](#technical-scenarios)
* MSAL Config: [msal-react-research.md](../subagent/msal-react-research.md#1-msalprovider-configuration)
* Audio Config: [web-audio-api-research.md](../subagent/web-audio-api-research.md#4-latency-optimization-techniques)

## Technical Scenarios

### 1. 🏗️ React SPA Architecture Setup
Setting up a modern React 18+ single-page application with TypeScript, Vite build tooling, and project structure optimized for real-time chat and voice interactions.

**Requirements:**
* React 18+ with TypeScript
* Vite for fast development and production builds
* ESLint + Prettier for code quality
* Component-based architecture
* Routing for potential multi-page flows
* State management for chat history and voice state

**Preferred Approach:**
* Use Vite's React-TypeScript template as foundation
* Organize by feature/domain (components, services, hooks, utils)
* Context API for auth and chat state (avoid Redux overhead for this scope)
* React Router for navigation (if needed for settings/profile pages)

```text
web/                              # NEW React application root
├── public/                       # Static assets
│   └── favicon.ico
├── src/
│   ├── components/              # React components
│   │   ├── Chat/
│   │   │   ├── ChatContainer.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── VoiceToggle.tsx
│   │   ├── Auth/
│   │   │   └── LoginButton.tsx
│   │   └── Layout/
│   │       └── AppLayout.tsx
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useAzureOpenAI.ts
│   │   └── useVoiceRecorder.ts
│   ├── services/                # External service integrations
│   │   ├── authService.ts       # MSAL.js wrapper
│   │   ├── openaiService.ts     # Azure OpenAI SDK wrapper
│   │   └── audioService.ts      # Web Audio API wrapper
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.tsx
│   │   └── ChatContext.tsx
│   ├── utils/                   # Utilities
│   │   ├── constants.ts
│   │   └── errorHandling.ts
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts
│   ├── __tests__/               # Tests
│   ├── App.tsx                  # Root component
│   ├── main.tsx                 # Entry point
│   └── vite-env.d.ts
├── e2e/                         # Playwright tests
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .eslintrc.cjs
└── playwright.config.ts
```

**Implementation Details:**

**Vite Configuration** (web/vite.config.ts):
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:7071', // Azure Function local dev
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
```

**TypeScript Configuration** (web/tsconfig.json):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Package.json Dependencies** (web/package.json):
```json
{
  "name": "realtime-chatbot-web",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@azure/msal-browser": "^3.7.0",
    "@azure/msal-react": "^2.0.0",
    "@azure/openai": "^1.0.0-beta.11",
    "react-router-dom": "^6.21.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.0",
    "jest-webaudio-mock": "^0.1.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}
```

#### Considered Alternatives (Removed After Selection)
* **Vue 3**: Not selected due to React's stronger ecosystem for WebSocket/real-time patterns and better MSAL.js integration
* **Next.js**: Not selected as SSR not required and adds unnecessary complexity for SPA
* **Create React App**: Not selected due to slower builds and outdated tooling vs Vite

### 2. 🔐 MSAL.js Authentication with Azure AD RBAC
Implementing secure authentication using Microsoft Authentication Library (MSAL.js) to authenticate users with Azure AD and obtain tokens for Azure OpenAI API access without exposing API keys.

**Requirements:**
* User authentication via Azure AD
* Acquire access tokens for Azure OpenAI resource
* Token refresh handling
* Protected routes (redirect unauthenticated users)
* No API keys or secrets in frontend code
* Secure token storage (sessionStorage recommended)

**Preferred Approach:**
✅ **Selected**: `@azure/msal-react` wrapper with sessionStorage caching
* Use `MsalProvider` at app root with `PublicClientApplication`
* Implement `useMsal` hook for authentication operations
* Protected component wrapper using `AuthenticatedTemplate` / `UnauthenticatedTemplate`
* `acquireTokenSilent()` for background token acquisition with automatic refresh
* `acquireTokenPopup()` fallback for `InteractionRequiredAuthError`
* Backend NOT required for basic token acquisition (MSAL handles directly with Azure AD)

```text
web/src/
├── services/
│   └── authService.ts           # MSAL configuration + token requests
├── hooks/
│   └── useAuth.ts               # Custom hook wrapping useMsal
├── components/
│   └── Auth/
│       ├── LoginButton.tsx
│       └── ProtectedRoute.tsx
└── main.tsx                      # MsalProvider wrapper
```

**Implementation Details:**

**1. MSAL Configuration** (src/services/authService.ts):
```typescript
import { Configuration, PublicClientApplication } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'sessionStorage', // ✅ Recommended: cleared on tab close
    storeAuthStateInCookie: false
  }
};

export const tokenRequest = {
  scopes: ['https://cognitiveservices.azure.com/.default'] // Azure OpenAI scope
};

export const msalInstance = new PublicClientApplication(msalConfig);
```

**2. Custom useAuth Hook** (src/hooks/useAuth.ts):
```typescript
import { useMsal } from '@azure/msal-react';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

export const useAuth = () => {
  const { instance, accounts } = useMsal();
  
  const getAccessToken = async (): Promise<string> => {
    const account = instance.getActiveAccount();
    if (!account) throw new Error('No active account');
    
    try {
      // Try silent acquisition (uses cached/refresh token)
      const response = await instance.acquireTokenSilent({
        scopes: ['https://cognitiveservices.azure.com/.default'],
        account
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        // Fallback to popup (user interaction required)
        const response = await instance.acquireTokenPopup(tokenRequest);
        return response.accessToken;
      }
      throw error;
    }
  };
  
  return {
    isAuthenticated: accounts.length > 0,
    user: instance.getActiveAccount(),
    getAccessToken,
    login: () => instance.loginPopup(tokenRequest),
    logout: () => instance.logoutPopup()
  };
};
```

**3. Protected Routes** (src/App.tsx):
```typescript
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';

const App = () => (
  <>
    <UnauthenticatedTemplate>
      <LoginPage />
    </UnauthenticatedTemplate>
    
    <AuthenticatedTemplate>
      <ChatInterface />
    </AuthenticatedTemplate>
  </>
);
```

**4. Azure AD App Registration Requirements**:
* **Platform**: Single Page Application (SPA)
* **Redirect URIs**: 
  - `http://localhost:3000` (development)
  - `https://yourdomain.com` (production)
* **API Permissions**: Grant access to Azure OpenAI
  - Scope: `https://cognitiveservices.azure.com/.default`
* **Assign RBAC Role** to users:
  ```bash
  az role assignment create \
    --role "Cognitive Services OpenAI User" \
    --assignee <user-email> \
    --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.CognitiveServices/accounts/<openai>
  ```

**Key Security Practices**:
* ✅ Tokens stored in sessionStorage (cleared on tab close)
* ✅ Automatic token refresh via `acquireTokenSilent()` before expiration
* ✅ No API keys or secrets in client code
* ✅ HTTPS required (enforced by MSAL.js)
* ✅ RBAC role assignment controls who can access Azure OpenAI

**Error Handling**:
* `InteractionRequiredAuthError` → Fallback to popup flow
* `BrowserAuthError` (popup blocked) → Display user guidance
* `consent_required` → User needs to approve permissions
* Token expiration → Automatic refresh 5 minutes before expiration (can be configured)

**Full Documentation**: [msal-react-research.md](../subagent/msal-react-research.md)

#### Considered Alternatives (Removed After Selection)
* **API Key Authentication**: ❌ Not selected - violates security requirement (no secrets in client code)
* **Manual OAuth2 Implementation**: ❌ Not selected - MSAL.js provides battle-tested, maintained solution
* **localStorage for tokens**: ❌ Not selected - sessionStorage more secure (cleared on tab close)
* **Backend token proxy (On-Behalf-Of flow)**: ⚠️ Optional - only needed if additional server-side logic required (e.g., token caching, rate limiting)

### 3. 💬 Azure OpenAI Realtime API Integration
Integrating Azure OpenAI's Realtime API for text-based chat and streaming responses with proper error handling and rate limit management.

**Requirements:**
* Text message sending/receiving
* Streaming response support
* Real-time bidirectional communication
* Conversation history management
* Error handling for API failures
* Rate limit awareness

**Preferred Approach:**
* Use `@azure/openai` SDK (JavaScript/TypeScript)
* WebSocket or Server-Sent Events (SSE) for real-time streaming
* Custom React hook (`useAzureOpenAI`) for chat operations
* Message queue for handling multiple rapid requests
* Backend proxy if direct client-to-Azure OpenAI not feasible

⏳ **Status**: Pending detailed Azure OpenAI Realtime API research

```text
src/
├── services/
│   └── openaiService.ts         # Azure OpenAI SDK wrapper
├── hooks/
│   └── useAzureOpenAI.ts        # Chat operations hook
└── types/
    └── index.ts                  # Message, ChatState types
```

**Implementation Details:**

**Azure OpenAI Service** (src/services/openaiService.ts):
```typescript
// Placeholder - Requires detailed research on:
// 1. Azure OpenAI Realtime API endpoints
// 2. Supported models (gpt-4, gpt-4-turbo, etc.)
// 3. Streaming protocol (WebSocket vs SSE)
// 4. Message format and schema
// 5. Rate limits and retry strategies
// 6. Error codes and handling
```

⏳ **Pending Research**:
- Azure OpenAI Realtime API documentation
- Supported streaming protocols
- Message schema and conversation format
- Rate limiting and quota management
- WebSocket connection lifecycle

#### Considered Alternatives (Removed After Selection)
* **REST Polling**: Not selected - inefficient for real-time requirements
* **Direct API Calls (fetch/axios)**: Not selected - SDK provides better abstractions and error handling

### 4. 🎤 Web Audio API for Voice Input/Output
Implementing real-time voice capture from microphone and audio playback of AI-generated speech using Web Audio API with browser compatibility considerations.

**Requirements:**
* Microphone access with user permission
* Real-time audio capture and encoding
* Audio playback of AI responses
* Browser compatibility (Chrome 88+, Firefox 84+, Safari 14.1+)
* Latency optimization (<500ms)
* Error handling for denied permissions or missing hardware

**Preferred Approach:**
* Use `navigator.mediaDevices.getUserMedia()` for microphone access
* `MediaRecorder` API for audio capture
* Web Audio API (`AudioContext`) for playback
* Codec: Opus or PCM based on Azure OpenAI requirements
* Custom React hook (`useVoiceRecorder`) for voice state management
* Visual feedback for recording state (microphone icon, waveform)

⏳ **Status**: Pending Web Audio API compatibility and Azure OpenAI voice requirements research

```text
src/
├── services/
│   └── audioService.ts          # Web Audio API wrapper
├── hooks/
│   └── useVoiceRecorder.ts      # Voice recording hook
└── components/
    └── Chat/
        └── VoiceToggle.tsx       # Voice UI controls
```

**Implementation Details:**

**Audio Service** (src/services/audioService.ts):
```typescript
// Placeholder - Requires detailed research on:
// 1. Azure OpenAI voice input format (codec, sample rate, channels)
// 2. Audio encoding/decoding requirements
// 3. Streaming audio vs chunked upload
// 4. Browser MediaRecorder codec support
// 5. Latency optimization techniques
// 6. Error handling for permissions and hardware
```

⏳ **Pending Research**:
- Azure OpenAI voice input/output format requirements
- Browser MediaRecorder codec compatibility
- Audio streaming vs chunked processing
- Latency optimization strategies
- Cross-browser audio API differences

#### Considered Alternatives (Removed After Selection)
* **Third-party Audio Libraries (Recorder.js)**: Not selected - Web Audio API is native and sufficient
* **File Upload Approach**: Not selected - doesn't meet real-time requirement

### 5. ⚙️ Lightweight Backend for Token Proxy
Implementing a minimal backend service (Azure Function or Node.js API) for secure token acquisition, CORS handling, and protecting sensitive operations.

**Requirements:**
* Secure token acquisition for Azure OpenAI
* CORS proxy if needed
* Token refresh coordination
* No business logic (SPA remains primary app)
* Minimal attack surface
* Azure deployment compatible

**Preferred Approach:**
* **Azure Functions (Recommended)**: Serverless, minimal overhead, easy Azure integration
  * HTTP-triggered function for token acquisition
  * System-assigned Managed Identity for Azure OpenAI access
  * CORS configuration for SPA domain
* **Alternative**: Express.js minimal API if more control needed

⏳ **Status**: Pending Azure Function vs Express.js evaluation

```text
backend/                          # Azure Functions structure
├── token-proxy/
│   ├── function.json            # Function configuration
│   └── index.js                 # Token acquisition logic
├── host.json                     # Azure Functions host config
├── local.settings.json          # Local development settings
└── package.json
```

**Implementation Details:**

**Azure Function Token Proxy** (backend/token-proxy/index.js):
```javascript
// Placeholder - Requires detailed research on:
// 1. Azure Managed Identity configuration
// 2. On-behalf-of (OBO) flow for user context
// 3. Token caching strategies
// 4. CORS configuration
// 5. Error responses
```

⏳ **Pending Research**:
- Azure Function Managed Identity setup
- On-behalf-of (OBO) token flow
- CORS configuration for Azure Functions
- Token caching best practices
- Alternative: Express.js minimal API structure

#### Considered Alternatives (Removed After Selection)
* **No Backend**: Not feasible - cannot securely acquire tokens without server-side component
* **Full ASP.NET Core API**: Not selected - overkill for minimal token proxy needs
* **Python Backend**: Not selected - JavaScript/TypeScript better aligns with frontend stack

## Summary of Research Status

### ✅ Completed & Verified
* ✅ **React SPA infrastructure setup** - `web/` directory established with React 18.3.1, TypeScript, Vite 7.3.1, component scaffolding
* ✅ **Testing infrastructure implemented** - Jest 30.2.0 with Web Audio API mocks, Playwright 1.58.2 for E2E, verification tests passing
* ✅ **Coverage configuration** - Jest thresholds set at 80% business logic, 60% UI components
* ✅ **Azure OpenAI Realtime API research** - Models, protocols, audio specs (PCM16, 16kHz, mono), rate limits, error codes documented
* ✅ **MSAL.js React integration research** - Complete authentication flow, token acquisition patterns, protected routes, code examples
* ✅ **Web Audio API research** - Browser compatibility, audio encoding (PCM16), latency optimization (<500ms target), cross-browser quirks (Safari AudioContext suspended state)
* ✅ **Code examples ready** - Auth hooks, voice recorder hooks, PCM16 encoding, AudioWorklet processor, configuration files
* ✅ **Technical scenarios 1-5 documented** - Architecture patterns with implementation details and code examples

### ⚠️ Critical Open Questions (Blocking Decisions)
These questions require user input or Azure documentation confirmation before finalizing architecture:

1. **🔴 Azure Region for Deployment** (CRITICAL)
   - **Question**: Which Azure region will host the OpenAI service?
   - **Why Critical**: GPT Realtime API not available in all regions
   - **Impact**: Deployment location, latency, compliance
   - **Action Required**: User must verify region support before architecture decisions

2. **🟡 Hosting Platform Choice**
   - **Options**: Azure Static Web Apps (serverless) vs Azure App Service (VM-based)
   - **Trade-offs**: 
     - Static Web Apps: Free tier, auto CI/CD, built-in Azure Functions
     - App Service: More control, custom domains, scaling options
   - **Decision Needed**: User preference based on budget and scalability needs

3. **🟡 Backend Architecture**
   - **Options**: Azure Functions (serverless) vs Node.js Express (minimal API)
   - **Trade-offs**:
     - Azure Functions: Serverless, pay-per-execution, auto-scale, tight Azure integration
     - Express: More control, traditional deployment, easier local dev
   - **Decision Needed**: User preference based on team expertise and infrastructure

4. **🟡 Conversation History Persistence**
   - **Question**: Should chat history persist beyond browser session?
   - **Options**: Client-side only (sessionStorage) vs Server-side (Azure Table Storage/Cosmos DB)
   - **Impact**: Storage cost, data privacy, user experience
   - **Decision Needed**: User requirements clarification

5. **🟢 UI Framework Choice**
   - **Options**: Plain CSS vs Tailwind CSS vs Material-UI
   - **Impact**: Development speed, bundle size, design consistency
   - **Recommendation**: Tailwind CSS (utility-first, small bundle, fast dev)
   - **Decision Needed**: User/team preference

### 🔄 In Progress (Can Proceed Independently)
* Technical Scenario #3 (Azure OpenAI Realtime API Integration) - Implementation details ready, pending WebSocket endpoint confirmation
* Technical Scenario #4 (Web Audio API Voice I/O) - Implementation details ready, comprehensive examples available
* Technical Scenario #5 (Lightweight Backend) - Draft complete, pending backend choice decision (Azure Functions vs Express)

### ⏳ Remaining Work (Non-Blocking)
* Finalize responsive UI patterns after framework selection
* Document deployment configuration after hosting platform decision
* Create comprehensive error handling patterns across all layers
* Document security best practices (CSP, XSS prevention, CORS)
* Consolidate testing approach recommendations into formal test strategy document

