# Azure OpenAI GPT Realtime Chatbot - Objective Document

## Objective

**Goal**: Build a Single Page Application (SPA) that provides a chatbot interface to Azure OpenAI GPT Realtime model with both text and real-time voice interaction capabilities.

**Problem Statement**: Organizations need a secure, modern web interface to interact with Azure OpenAI's GPT Realtime model that supports both traditional text-based chat and real-time voice conversations. The solution must use enterprise-grade authentication (RBAC) rather than API keys to ensure security and proper access control.

**Success Criteria**:
- [ ] SPA deployed and accessible via web browser
- [ ] Text-based chat interface functional with Azure OpenAI GPT Realtime model
- [ ] Real-time voice input and output working with the GPT Realtime model
- [ ] RBAC authentication implemented (no API key exposure)
- [ ] Users can seamlessly switch between text and voice interaction modes
- [ ] Proper error handling for network issues, authentication failures, and API errors
- [ ] Responsive design works on desktop and mobile devices
- [ ] Security best practices followed (no secrets in client-side code)

---

## Acceptance Criteria (Definition of Done)

These are testable acceptance criteria that must be satisfied for the feature to be considered complete:

- [ ] User can complete a text chat conversation within 3 clicks from landing page (login → type → send)
- [ ] Voice recording starts within 100ms of push-to-talk button press
- [ ] Authentication works for Azure AD users assigned "Cognitive Services OpenAI User" role
- [ ] Application gracefully handles network disconnection and shows reconnection UI
- [ ] Error messages are user-friendly (no raw API errors displayed)
- [ ] Application loads and displays cached UI within 2 seconds on repeat visits
- [ ] Voice latency (speak to response playback) averages under 2 seconds
- [ ] All interactive elements are keyboard accessible (tab navigation works)
- [ ] Application passes WCAG 2.1 Level A compliance (minimum)
- [ ] No console errors on happy path user flows
- [ ] Unit test coverage >80% for business logic, >60% for components

---

## Technical Context

**Target Codebase**: /workspaces/realtime-website/src/

**Primary Language/Framework**: 
- Frontend: JavaScript/TypeScript with **React 18+** (recommended for rich state management, WebSocket handling, and mature ecosystem)
- SPA Architecture with Vite (fast builds, modern ESM support)
- Azure OpenAI SDK for JavaScript/TypeScript (^1.x)
- MSAL.js for Azure AD authentication (^3.x)
- Web Audio API for voice capture and playback

**Framework Choice Rationale**: React recommended due to:
- Excellent real-time state management with hooks
- Strong Web Audio API integration patterns
- Mature MSAL.js React wrapper (`@azure/msal-react`)
- Large community support for WebSocket/streaming
- Can be replaced with Vue 3+ or vanilla JS if team expertise dictates

**Testing Preference**: 
- **Unit Tests**: Jest + React Testing Library for components and business logic
- **Integration Tests**: Mock MSAL.js authentication flows, mock Azure OpenAI API responses
- **Audio Testing**: Mock Web Audio API with jest-webaudio-mock or manual mocks
- **E2E Tests**: Playwright for critical user flows (login → text chat → voice interaction)
- **Coverage Target**: 80% for business logic, 60% for UI components

**Key Constraints**:
- Must use Azure RBAC (Role-Based Access Control) for authentication, not API keys
- Must be a Single Page Application (no server-side rendering required)
- Real-time voice interaction requires WebSocket or streaming connection support
- Must comply with Azure OpenAI service limits and quotas
- **Browser Compatibility**: 
  - Chrome/Edge 88+ (Chromium-based)
  - Firefox 84+
  - Safari 14.1+
  - Web Audio API, MediaDevices API, WebSocket API support required
- Security: No secrets or credentials embedded in client-side code
- Performance: Voice latency should be minimized for real-time feel (<500ms)

**Backend Requirements**:
- **Lightweight backend required** (Azure Function or minimal Node.js API) for:
  - Secure RBAC token acquisition (on-behalf-of flow)
  - CORS proxy for Azure OpenAI if needed
  - Token refresh coordination
  - NOT for business logic - SPA remains primary application
- Backend is infrastructure, not application layer

---

## Functional Requirements

### Core Features

#### 1. Text Chat Interface
- Text input field with send button
- Chat history display with user/assistant message differentiation
- Message timestamps
- Markdown rendering for formatted responses
- Copy message functionality
- Clear conversation button

#### 2. Voice Interaction Interface
- Push-to-talk or toggle-to-talk button
- Visual feedback for recording state (active/inactive)
- Audio level indicator during recording
- Real-time audio streaming to Azure OpenAI
- Audio playback of assistant responses
- Fallback to text if voice fails

**Note**: Voice interruption (stopping assistant mid-response) is a complex feature requiring bidirectional streaming state management and is deferred to Phase 2.

#### 3. Authentication & Authorization
- Azure AD / Microsoft Entra ID authentication
- RBAC-based access control to Azure OpenAI resource
- Token refresh mechanism
- Session management
- Logout functionality
- Clear indication of authentication status

#### 4. Mode Switching
- Toggle between text and voice modes
- Persistent mode selection across sessions
- Clear visual indication of active mode
- Graceful degradation if voice not supported

#### 5. Configuration & Settings
- Select different GPT models (if multiple available)
- Adjust voice input sensitivity
- Volume control for assistant voice output
- Theme toggle (light/dark mode)
- Conversation export (download as JSON/text)

### Non-Functional Requirements

#### Performance
- Initial page load < 3 seconds
- Text message response initiated within 1 second
- Voice latency < 500ms for real-time experience
- Smooth UI with no blocking operations

#### Security
- All authentication tokens stored securely (httpOnly cookies or secure token storage)
- No API keys or secrets in client-side JavaScript
- CORS properly configured
- CSP headers implemented
- Input sanitization to prevent XSS

#### Reliability
- Graceful error handling with user-friendly messages
- Automatic reconnection on network interruption
- Offline detection with clear user notification
- Conversation state recovery after disconnection

#### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Alt text for images/icons
- Focus indicators
- ARIA labels for interactive elements

#### Scalability
- Efficient memory management for long conversations
- Pagination or virtualization for chat history
- Service worker for caching static assets
- Lazy loading of non-critical features

---

## Technical Architecture

### Frontend Components
```
src/
├── components/
│   ├── ChatInterface/
│   │   ├── TextChat.jsx
│   │   ├── VoiceChat.jsx
│   │   ├── MessageList.jsx
│   │   └── InputArea.jsx
│   ├── Auth/
│   │   ├── LoginButton.jsx
│   │   └── AuthProvider.jsx
│   ├── Settings/
│   │   └── SettingsPanel.jsx
│   └── Common/
│       ├── Header.jsx
│       └── ErrorBoundary.jsx
├── services/
│   ├── azureOpenAI.js
│   ├── authService.js
│   ├── audioService.js
│   └── storageService.js
├── hooks/
│   ├── useAuth.js
│   ├── useChat.js
│   └── useVoice.js
├── utils/
│   ├── errorHandling.js
│   └── validators.js
└── App.jsx
```

### Azure Resources Required
- **Azure OpenAI Service** instance (region with GPT Realtime API support)
- **GPT Realtime model** deployment
- **Azure AD / Microsoft Entra ID** application registration
- **Azure Static Web App** (recommended) or App Service for SPA hosting
- **Azure Functions** (lightweight backend for token exchange)
- **Azure Key Vault** (for backend secrets - OpenAI endpoint, client secrets)
- **Application Insights** (optional but recommended for monitoring)

### Authentication Flow
1. User accesses SPA
2. SPA redirects to Azure AD login (MSAL.js)
3. User authenticates with Azure AD credentials
4. Azure AD returns access token with appropriate RBAC role
5. SPA uses token to call Azure OpenAI service
6. Token refreshed automatically before expiration

### Data Flow - Text
1. User types message
2. Message sent to Azure OpenAI API with auth token
3. Response streamed back
4. UI updated in real-time with assistant response

### Data Flow - Voice
1. User activates voice input
2. Browser captures audio via Web Audio API (16kHz PCM or Opus codec)
3. Audio chunked and streamed to Azure OpenAI Realtime API via WebSocket
4. Server performs real-time transcription and generates response
5. Audio response streamed back (PCM16 or Opus format)
6. Browser plays audio response with minimal buffering

### Voice Technical Requirements

**Audio Specifications**:
- **Input Format**: PCM16 or Opus codec (Opus preferred for bandwidth)
- **Sample Rate**: 16kHz (voice optimized) or 24kHz (higher quality)
- **Bit Depth**: 16-bit PCM
- **Channels**: Mono (single channel)
- **Chunk Size**: 100-200ms audio chunks for streaming (1600-3200 bytes at 16kHz PCM16)

**Audio Processing**:
- **Echo Cancellation**: Use browser AEC (acoustic echo cancellation) via `echoCancellation: true`
- **Noise Suppression**: Enable via `noiseSuppression: true` in MediaStreamConstraints
- **Auto Gain Control**: Enable via `autoGainControl: true`
- **Buffer Management**: Circular buffer with 500ms capacity to handle jitter

**Performance Targets**:
- Audio capture start: <100ms
- End-to-end latency: <2s (ideal: <1s)
- Packet loss tolerance: Handle up to 5% packet loss gracefully

---

## Error Handling Strategy

### Error Handling Matrix

| Error Type | HTTP/WS Code | User Message | Action | Retry Strategy |
|------------|--------------|--------------|--------|----------------|
| **Authentication** |
| Token expired | 401 | "Session expired. Reconnecting..." | Silent token refresh → retry | Auto (1 attempt) |
| Auth failed | 401/403 | "Authentication failed. Please log in again." | Redirect to login | Manual |
| Insufficient permissions | 403 | "You don't have access. Contact admin." | Show contact info | None |
| **Rate Limiting** |
| Rate limit (user) | 429 | "Too many requests. Please wait {X} seconds..." | Show countdown timer | Auto after wait |
| Rate limit (system) | 429 | "Service busy. Retrying in {X}s..." | Exponential backoff | Auto (3 attempts) |
| Quota exceeded | 429 | "Daily quota reached. Try again tomorrow." | Disable input | None |
| **Network** |
| Network offline | - | "No internet connection. Messages will send when online." | Queue messages | Auto on reconnect |
| Connection timeout | - | "Connection timeout. Retrying..." | Exponential backoff | Auto (3 attempts) |
| WebSocket disconnect | 1006 | "Connection lost. Reconnecting..." | Auto reconnect | Auto (infinite, backoff) |
| **API Errors** |
| Bad request | 400 | "Message couldn't be sent. Please try again." | Log details | Manual retry |
| Server error | 500 | "Service error. Our team is notified." | Log to monitoring | Auto (2 attempts) |
| Model unavailable | 503 | "Service temporarily unavailable. Retrying..." | Exponential backoff | Auto (3 attempts) |
| **Audio/Voice** |
| Mic permission denied | - | "Microphone access required. Click to enable." | Show permission guide | Manual |
| Audio device error | - | "Microphone error. Check device settings." | Fall back to text | Manual |
| Unsupported browser | - | "Voice not supported in this browser. Use text chat." | Hide voice button | None |

### API Rate Limiting Client Strategy

**Proactive Design**:
- **Request Queue**: FIFO queue for outgoing messages during rate limits
- **Token Bucket Algorithm**: Track available request capacity client-side (estimate)
- **Backoff Strategy**: Exponential backoff with jitter (1s, 2s, 4s, 8s, max 30s)
- **User Feedback**: 
  - Show "Sending..." indicator
  - Display queue position if >3 messages queued
  - Show countdown timer during rate limit cooldown
- **Quota Visualization** (optional): Progress bar showing estimated daily usage (if backend provides metrics)

---

## Dependencies & Integration Points

### External Services
- **Azure OpenAI Service**: GPT Realtime API endpoint
- **Azure AD / Microsoft Entra ID**: Authentication provider
- **Azure Monitor (optional)**: Telemetry and logging

### JavaScript Libraries/SDKs (with versions)
- **@azure/openai** (^1.x) - Azure OpenAI SDK for JavaScript/TypeScript
- **@azure/msal-browser** (^3.x) or **@azure/msal-react** (^2.x) - Microsoft Authentication Library
- **react** (^18.x) / **react-dom** (^18.x) - UI framework
- **axios** (^1.x) or native Fetch API - HTTP requests
- **Web Audio API** (browser native) - Voice capture/playback
- **MediaDevices API** (browser native) - Microphone access
- **WebSocket API** (browser native) - Streaming connections

### Browser APIs
- Web Audio API (voice capture/playback)
- MediaDevices API (microphone access)
- LocalStorage/SessionStorage (settings persistence)
- WebSocket API (for streaming connections)

---

## Security Considerations

### Authentication & Authorization

**RBAC Configuration**:
- **Recommended Azure Role**: `Cognitive Services OpenAI User` (read/inference access)
- **Alternative**: `Cognitive Services OpenAI Contributor` (full access - only if needed)
- **Best Practice**: Create custom role with minimal required permissions:
  ```json
  {
    "permissions": [{
      "actions": [
        "Microsoft.CognitiveServices/accounts/OpenAI/deployments/chat/completions/action",
        "Microsoft.CognitiveServices/accounts/OpenAI/deployments/audio/action"
      ]
    }]
  }
  ```

**Token Management**:
- Use MSAL.js for Azure AD authentication
- Store access tokens in memory (React state/context) - NOT localStorage for production tokens
- Refresh tokens can use httpOnly cookies (if backend handles refresh)
- Implement token refresh 5 minutes before expiration
- Validate user roles/permissions on client and enforce on Azure side
- Use HTTPS only (enforce with HSTS headers)

### API Security
- Never expose API keys in client code
- Use RBAC tokens for all Azure OpenAI calls
- Implement rate limiting indicators
- Handle 401/403 errors gracefully with re-authentication

### Data Privacy
- Do not log sensitive conversation content
- Implement conversation data retention policies
- Provide clear privacy policy to users
- Option to clear conversation history

### Input Validation
- Sanitize all user inputs
- Validate audio input parameters
- Implement CSP headers
- Prevent XSS attacks in rendered markdown

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Voice API latency too high | High | Medium | Implement buffering, optimize audio encoding, fallback to text |
| Browser incompatibility | Medium | Low | Feature detection, graceful degradation, clear browser requirements |
| Authentication token expiry mid-conversation | Medium | Medium | Implement silent token refresh, queue requests during refresh |
| Azure OpenAI quota/rate limits | High | Medium | Implement client-side rate limiting, queue management, user feedback |
| Microphone permission denied | Medium | High | Clear permission prompts, fallback to text mode, help documentation |
| WebSocket connection drops | High | Medium | Auto-reconnect logic, conversation state persistence, user notification |
| CORS issues with Azure OpenAI | High | Low | Proper Azure CORS configuration, proxy if needed |

---

## Deployment Strategy

### Environment Setup
1. Development: Local development with Azure OpenAI dev instance
2. Staging: Azure Static Web App with staging OpenAI endpoint
3. Production: Azure Static Web App with production OpenAI endpoint

### CI/CD Pipeline
- Automated builds on commit
- Unit and integration tests in pipeline
- Security scanning (dependency checks, SAST)
- Automated deployment to staging
- Manual approval for production deployment

### Monitoring & Observability
- Application Insights for telemetry
- Error tracking and alerting
- Performance monitoring (page load, API latency)
- Usage analytics (text vs voice interaction rates)

---

## Cost Considerations

### Azure OpenAI Usage Costs

**Estimated Token Usage**:
- Average text conversation: 500-2000 tokens per exchange (prompt + completion)
- Voice conversation: Higher token consumption due to transcription + generation + audio synthesis
- Estimated ratio: Voice ~3-5x more expensive than text per interaction

**Cost Optimization Strategies**:
- Implement client-side message length limits (e.g., 500 characters for text, 30s for voice)
- Use streaming to show progress and allow early termination
- Cache common responses if applicable (FAQ mode)
- Monitor token usage per user via Application Insights custom metrics
- Set up budget alerts in Azure Cost Management

**Quota Recommendations**:
- **MVP/Dev**: 10K requests/month, 100K tokens/month (~$10-50/month)
- **Production (small)**: 100K requests/month, 1M tokens/month (~$100-500/month)
- **Production (medium)**: 1M requests/month, 10M tokens/month (~$1K-5K/month)

**Cost Monitoring**:
- Track tokens per request (log in Application Insights)
- Daily/weekly usage reports
- Per-user quota enforcement (if needed for abuse prevention)
- Alert on 80% quota consumption

---

## Additional Context

### Azure OpenAI Realtime API
- The GPT Realtime API supports low-latency voice interactions
- Requires WebSocket connection for streaming audio
- Supports both audio input/output and text fallback
- Token-based authentication (Azure AD) is supported

### Reference Documentation
- [Azure OpenAI Service Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [GPT Realtime API Guide](https://learn.microsoft.com/azure/ai-services/openai/realtime-audio)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

### Architectural Decisions
- **Why SPA?**: Single Page Application provides the best real-time user experience without page reloads, critical for voice interaction
- **Why RBAC over API keys?**: Enterprise security requirement, enables proper access control, audit trails, and eliminates secret management in client code
- **Why both text and voice?**: Provides flexibility for different user contexts and serves as fallback for each mode

---

## Phase 1: MVP Scope

**Goal**: Deliver minimum viable product for validation

**In Scope**:
- Text chat interface with Azure OpenAI
- Azure AD authentication with RBAC
- Basic voice input (push-to-talk)
- Basic voice output playback
- Simple, clean UI (desktop-focused)
- Error handling basics

**Out of Scope for MVP**:
- **Advanced voice features**: Voice interruption (complex bidirectional streaming), voice selection, voice speed control
- Mobile optimization (responsive design, touch gestures)
- Conversation export (download as JSON/text/PDF)
- Advanced settings panel (theme customization, model selection)
- Full WCAG 2.1 Level AA compliance (targeting Level A for MVP)
- Advanced performance optimizations (service worker, virtualization)
- Conversation history persistence to backend database

**Timeline**: MVP delivered first for validation before full feature set

---

## Open Questions

| ID | Question | Priority | Owner | Status |
|----|----------|----------|-------|--------|
| Q1 | ~~Which JavaScript framework preferred (React/Vue/Vanilla)?~~ | ~~High~~ | ~~TBD~~ | **RESOLVED: React 18+** |
| Q2 | Hosting platform choice (Azure Static Web App vs App Service)? | High | TBD | Open |
| Q3 | Which specific GPT Realtime model version to target? | High | TBD | Open |
| Q4 | Conversation history persistence required (backend storage)? | **High** | TBD | Open |
| Q5 | Multi-tenancy support needed? | Medium | TBD | Open |
| Q6 | ~~Specific RBAC roles and permissions mapping?~~ | ~~High~~ | ~~TBD~~ | **RESOLVED: See RBAC section** |
| Q7 | ~~Audio format preferences (codec, bitrate)?~~ | ~~Low~~ | ~~TBD~~ | **RESOLVED: See Voice Tech Requirements** |
| Q8 | Telemetry/analytics requirements? | Medium | TBD | Open |
| Q9 | **Azure region for OpenAI deployment (Realtime API availability)?** | **High** | TBD | Open |
| Q10 | **Backend architecture: Azure Functions vs lightweight API?** | **High** | TBD | Open |

---

## Success Metrics

### Usage Metrics
- Number of active users per day
- Text vs voice interaction ratio
- Average conversation length
- Session duration

### Performance Metrics
- Page load time (target: <3s)
- Voice latency (target: <500ms)
- API response time (target: <1s for text)
- Error rate (target: <1%)

### User Satisfaction
- User feedback ratings
- Feature adoption rate (voice usage)
- Authentication success rate (target: >99%)
- Return user rate

---

## Next Steps & Critical Pre-Implementation Actions

### Immediate Actions (Before Implementation)

1. ✅ **Objective Document Reviewed** - Approved with reviewer suggestions implemented
2. 🔴 **Answer Open Questions Q2, Q3, Q4, Q9, Q10** - These are blocking for architecture decisions
3. 🔴 **Validate Azure OpenAI Realtime API Access** - Confirm Azure subscription has access (GPT-4 Realtime not available in all regions)
4. 🟡 **Prototype RBAC Authentication Flow** - Create minimal proof-of-concept: Browser → MSAL.js → Azure AD → Token → Azure OpenAI
5. 🟡 **Confirm Backend Architecture** - Decide: Pure SPA with CORS, or SPA + Azure Functions for token exchange
6. 🟡 **Provision Development Environment**:
   - Azure OpenAI instance (dev/test)
   - Azure AD app registration
   - Local development setup

### Workflow Progression

Once immediate actions complete:

1. **Run `/sdd:3-research-feature`** - Deep dive into Azure OpenAI Realtime API, MSAL.js integration, WebSocket patterns
2. **Technical Spike** - 1-2 day prototype: MSAL.js auth + Azure OpenAI API call + WebSocket audio streaming
3. **Run `/sdd:4-determine-test-strategy`** - Define testing approach for auth, API, audio
4. **Run `/sdd:5-task-planner-for-feature`** - Break down into atomic implementation tasks
5. **Assign to @builder agents** - Delegate implementation work to builder-1 or builder-2

### Critical Validation Checkpoints

- [ ] Confirm GPT-4 Realtime API is accessible from chosen Azure region
- [ ] Verify RBAC token can authenticate to Azure OpenAI from browser context
- [ ] Test Web Audio API microphone access in target browsers
- [ ] Validate WebSocket connection stability with Azure OpenAI
- [ ] Confirm token refresh works without interrupting active chat session

---

**Document Version**: 2.0  
**Created**: 2026-02-25  
**Last Updated**: 2026-02-25  
**Owner**: Project Manager  
**Status**: **Approved** - Ready for Research Phase

**Changelog**:
- **v2.0** (2026-02-25): Implemented reviewer suggestions - Added acceptance criteria, voice technical specs, error handling matrix, RBAC details, cost considerations, browser compatibility, dependency versions, resolved Q1/Q6/Q7
- **v1.0** (2026-02-25): Initial draft created
