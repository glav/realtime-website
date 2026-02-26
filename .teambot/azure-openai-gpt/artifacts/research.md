<!-- markdownlint-disable-file -->
# Azure OpenAI GPT Realtime Chatbot - Research Summary

**Research Document**: [Full Research Document](../../../.agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md)

**Date**: 2026-02-26  
**Status**: ✅ Research Complete - Ready for Test Strategy Phase

---

## 🎯 Executive Summary

Deep research completed for building a Single Page Application (SPA) with Azure OpenAI GPT Realtime model, supporting both text and real-time voice interaction capabilities.

### Key Technical Stack
- **Frontend**: React 18.3.1 + TypeScript + Vite 7.3.1
- **Authentication**: MSAL.js (Azure AD RBAC)
- **Voice**: Web Audio API with PCM16 encoding
- **Testing**: Jest 30.2.0 + Playwright 1.58.2
- **Backend**: Azure Functions (recommended) or Node.js Express

---

## ✅ Research Findings

### 1. Project Infrastructure (VERIFIED)
The `web/` directory is established with:
- React 18.3.1 with TypeScript strict mode
- Vite 7.3.1 build tooling
- Jest + React Testing Library (80%/60% coverage thresholds)
- Playwright E2E testing
- Component scaffolding (Auth, Chat, Layout directories)

### 2. Azure OpenAI Realtime API
- **Protocol**: WebSocket for bidirectional real-time streaming
- **Audio Format**: PCM16 or Opus, 16kHz sample rate, mono
- **Chunk Size**: 100-200ms (1600-3200 bytes per chunk)
- **Authentication**: Azure AD token via MSAL.js with scope `https://cognitiveservices.azure.com/.default`
- **Rate Limits**: 60-120 RPM, 40K-90K TPM (subscription tier dependent)
- **⚠️ Region Availability**: Not all Azure regions support Realtime API - must verify before deployment

### 3. MSAL.js Authentication
- **Packages**: `@azure/msal-react` v2.x + `@azure/msal-browser` v3.x
- **Token Acquisition**: `acquireTokenSilent()` with `acquireTokenPopup()` fallback
- **Storage**: sessionStorage (recommended for security)
- **Protected Routes**: AuthenticatedTemplate/UnauthenticatedTemplate components
- **RBAC Role**: "Cognitive Services OpenAI User" assigned to users

### 4. Web Audio API Voice Interaction
- **Browser Support**: Chrome 88+, Firefox 84+, Safari 14.1+, Edge 88+
- **Safari Quirk**: AudioContext starts suspended - must resume after user gesture
- **Codec**: PCM16 for universal support (Safari doesn't support WebM/Opus)
- **Latency Target**: <500ms (50ms capture + 50ms encoding + ~300ms network + 50ms playback)
- **Low-Latency**: AudioWorklet (not deprecated ScriptProcessorNode)

### 5. Testing Infrastructure (IMPLEMENTED)
- **Jest Configuration**: `web/jest.config.js` with coverage thresholds
- **Web Audio Mocks**: `web/jest.setup.js` with AudioContext, MediaRecorder, navigator.mediaDevices
- **E2E Tests**: `web/e2e/app.spec.ts` with page load and interaction tests

---

## 🔴 Critical Open Questions

These require decisions before implementation:

| Priority | Question | Impact | Recommendation |
|----------|----------|--------|----------------|
| 🔴 Critical | Azure region for deployment? | Realtime API availability | Verify region support with Azure docs |
| 🟡 High | Hosting platform? | Deployment complexity | Azure Static Web Apps (free tier, auto CI/CD) |
| 🟡 High | Backend architecture? | Token proxy implementation | Azure Functions (serverless, tight Azure integration) |
| 🟡 Medium | Conversation persistence? | Storage cost, UX | Session-only for MVP (sessionStorage) |
| 🟢 Low | UI framework? | Dev speed, bundle size | Tailwind CSS (utility-first, small bundle) |

---

## 📋 Implementation Tasks (Prioritized)

### Phase 1: Authentication ✅ (Infrastructure Ready)
- [x] Set up React 18+ SPA with Vite
- [x] Configure Jest + Playwright testing
- [ ] Implement MSAL.js authentication service
- [ ] Create useAuth hook
- [ ] Add protected routes

### Phase 2: Text Chat
- [ ] Create Azure OpenAI service wrapper
- [ ] Implement useChat hook
- [ ] Build MessageList and MessageInput components
- [ ] Add streaming response handling

### Phase 3: Voice Interaction
- [ ] Implement audio service with Web Audio API
- [ ] Create useVoiceRecorder hook
- [ ] Build VoiceToggle component
- [ ] Integrate WebSocket for real-time audio streaming

### Phase 4: Backend Token Proxy
- [ ] Create Azure Function or Node.js API
- [ ] Implement secure token acquisition
- [ ] Configure CORS for SPA domain

---

## 📁 Research Document References

- **Main Research**: [20260226-azure-openai-gpt-chatbot-research.md](../../../.agent-tracking/research/20260226-azure-openai-gpt-chatbot-research.md)
- **Azure OpenAI API**: [azure-openai-api-research.md](../../../.agent-tracking/research/subagent/azure-openai-api-research.md)
- **MSAL.js Integration**: [msal-react-research.md](../../../.agent-tracking/research/subagent/msal-react-research.md)
- **Web Audio API**: [web-audio-api-research.md](../../../.agent-tracking/research/subagent/web-audio-api-research.md)

---

## ➡️ Next Steps

1. **Run Step 4** (`sdd.4-determine-test-strategy.prompt.md`) to create formal test strategy document
2. After test strategy approval, **proceed to Step 5** (`sdd.5-task-planner-for-feature.prompt.md`)

The test strategy step will analyze this research and recommend the optimal testing approach (TDD vs Code-First) for each component.
