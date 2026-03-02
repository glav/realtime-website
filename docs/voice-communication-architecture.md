# Voice Communication Architecture

## Overview
This document describes the end-to-end communication flow when a user speaks into the browser, the audio is processed by Azure OpenAI's GPT Realtime model, and a voice response is played back.

## Component Architecture

This architecture includes the following components working together to enable real-time voice interaction:

| Component | Description |
|-----------|-------------|
| **Browser (React SPA)** | User interface and application orchestration |
| **MSAL.js** | Azure AD authentication and token management |
| **Web Audio API** | Audio capture from microphone and playback to speakers |
| **WebSocket** | Real-time bidirectional streaming connection |
| **Backend (Python/Azure Functions)** | Optional token proxy and CORS handling |
| **Azure AD (Entra ID)** | Identity provider and RBAC authorization |
| **Azure OpenAI Realtime** | Speech-to-text, GPT inference, and text-to-speech |

> **Note**: The current implementation uses a Python backend (`src/server.py`) as the WebSocket proxy. Azure Functions is an alternative for serverless deployments.

## Sequence Diagram

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Browser    │    │  Web Audio   │    │   Backend    │    │   Azure AD   │    │ Azure OpenAI │
│  (React SPA) │    │     API      │    │  (Functions) │    │  (Entra ID)  │    │   Realtime   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │                   │
       │ ◀──────────────── INITIAL AUTHENTICATION ────────────────▶ │                   │
       │                   │                   │                   │                   │
  ┌────┴────┐              │                   │                   │                   │
  │ MSAL.js │◀─────────────┼───────────────────┼───────────────────┤                   │
  │  Login  │              │                   │                   │                   │
  └────┬────┘              │                   │                   │                   │
       │───── Redirect to Azure AD Login ──────┼──────────────────▶│                   │
       │                   │                   │                   │                   │
       │◀──── Return Access Token (RBAC) ──────┼───────────────────│                   │
       │                   │                   │                   │                   │
       │ ◀────────────── USER INITIATES VOICE INPUT ─────────────▶ │                   │
       │                   │                   │                   │                   │
  ┌────┴────┐              │                   │                   │                   │
  │  Click  │              │                   │                   │                   │
  │   Mic   │              │                   │                   │                   │
  └────┬────┘              │                   │                   │                   │
       │── getUserMedia() ─▶│                   │                   │                   │
       │   (request mic)   │                   │                   │                   │
       │                   │                   │                   │                   │
       │◀── Audio Stream ──│                   │                   │                   │
       │    (MediaStream)  │                   │                   │                   │
       │                   │                   │                   │                   │
  ┌────┴────┐              │                   │                   │                   │
  │ Audio-  │◀── Process ──│                   │                   │                   │
  │ Worklet │   with AEC,  │                   │                   │                   │
  │ (PCM16) │   noise supp │                   │                   │                   │
  └────┬────┘              │                   │                   │                   │
       │                   │                   │                   │                   │
       │ ◀──────────── WEBSOCKET CONNECTION + STREAMING ──────────────────────────────▶│
       │                   │                   │                   │                   │
       │─────── Establish WebSocket ───────────┼───────────────────┼──────────────────▶│
       │        (with RBAC token)              │                   │                   │
       │                   │                   │                   │                   │
       │◀─────── WebSocket Open ───────────────┼───────────────────┼───────────────────│
       │                   │                   │                   │                   │
       │─────── Audio Chunks (PCM16) ──────────┼───────────────────┼──────────────────▶│
       │        (100-200ms chunks,             │                   │                   │
       │         16kHz, mono)                  │                   │                   │
       │                   │                   │                   │    ┌─────────────┐│
       │                   │                   │                   │    │ Transcribe  ││
       │                   │                   │                   │    │ + Generate  ││
       │                   │                   │                   │    │  Response   ││
       │                   │                   │                   │    └─────────────┘│
       │                   │                   │                   │                   │
       │ ◀──────────────── RESPONSE STREAMING ──────────────────────────────────────── │
       │                   │                   │                   │                   │
       │◀───── Audio Response Chunks ──────────┼───────────────────┼───────────────────│
       │       (PCM16 or Opus)                 │                   │                   │
       │                   │                   │                   │                   │
       │── Queue to ───────▶│                   │                   │                   │
       │   AudioWorklet    │                   │                   │                   │
       │                   │                   │                   │                   │
       │                  ┌┴─────────────┐     │                   │                   │
       │◀── Play Audio ───│ Web Audio   │     │                   │                   │
       │    (speakers)    │ Destination │     │                   │                   │
       │                  └┬─────────────┘     │                   │                   │
       │                   │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼                   ▼
```

## Component Details

### Component Table
| Component | Role | Key Technology |
|-----------|------|----------------|
| **Browser (React SPA)** | UI, state management, orchestration | React 18 + TypeScript + Vite |
| **MSAL.js** | Azure AD authentication, token management | `@azure/msal-react` v2.x |
| **Web Audio API** | Capture mic input, process audio, play output | AudioWorklet, MediaDevices API |
| **WebSocket** | Bidirectional real-time audio streaming | Native WebSocket API |
| **Backend (Python or Azure Functions)** | Token proxy, CORS handling (optional) | Python (current) / Azure Functions (alternative) |
| **Azure AD (Entra ID)** | RBAC authentication, token issuance | "Cognitive Services OpenAI User" role |
| **Azure OpenAI Realtime** | Speech-to-text, GPT inference, text-to-speech | GPT Realtime model via WebSocket |

## Detailed Flow Steps

### 1. Authentication (Pre-requisite)
- User clicks **Login** → MSAL.js redirects to Azure AD
- User authenticates → Azure AD returns **RBAC access token**
- Token includes scope `https://cognitiveservices.azure.com/.default`

### 2. Voice Capture (Browser → Web Audio API)
- User clicks **microphone button** (push-to-talk)
- `navigator.mediaDevices.getUserMedia()` requests mic access
- Audio captured with: **echo cancellation**, **noise suppression**, **auto gain control**
- **AudioWorklet** processes raw audio into **PCM16** format (16kHz, mono, 16-bit)
- Audio chunked into **100-200ms segments** (~1600-3200 bytes each)

### 3. Streaming to Azure OpenAI (WebSocket)
- **WebSocket connection** established to Azure OpenAI Realtime endpoint
- Authentication via RBAC token in headers
- **Audio chunks streamed in real-time** as user speaks
- Format: PCM16 or Opus codec (PCM16 preferred for Safari compatibility)

### 4. Azure OpenAI Processing (Cloud)
- **Real-time transcription** of incoming audio
- **GPT model generates response** based on conversation context
- **Text-to-speech synthesis** of response
- Response audio **streamed back** (not batched)

### 5. Audio Playback (Browser)
- Audio response chunks received via WebSocket
- Buffered in **circular buffer** (~500ms capacity for jitter handling)
- **AudioWorklet** decodes and queues audio
- Plays through **Web Audio API destination** (speakers)

## Audio Technical Specifications

| Parameter | Value |
|-----------|-------|
| **Input Format** | PCM16 (preferred) or Opus |
| **Sample Rate** | 16kHz (voice optimized) |
| **Bit Depth** | 16-bit |
| **Channels** | Mono (single channel) |
| **Chunk Size** | 100-200ms (1600-3200 bytes at 16kHz PCM16) |
| **Buffer Size** | ~500ms circular buffer |

## Performance Targets

| Metric | Target |
|--------|--------|
| Audio capture start | <100ms |
| End-to-end latency | <500ms (ideal), <2s (acceptable) |
| Chunk size | 100-200ms |
| Reconnection on disconnect | <5 seconds |
| Packet loss tolerance | Up to 5% gracefully |

## Browser Support

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 88+ | Full support |
| Edge | 88+ | Full support (Chromium-based) |
| Firefox | 84+ | Full support |
| Safari | 14.1+ | AudioContext requires user gesture to resume |

## Related Documentation

- [Azure OpenAI Realtime Chatbot Objective](./azure-openai-realtime-chatbot.md) - Project goals, requirements, and technical specifications
- [Azure AD Setup Guide](./azure-ad-setup.md) - Authentication and RBAC configuration guide

---

**Document Version**: 1.0  
**Created**: 2026-03-02  
**Owner**: Project Manager
