# Azure OpenAI Realtime API Research

## Executive Summary
✅ **Comprehensive research already exists** in `docs/azure-openai-realtime-chatbot.md` (559 lines). This document consolidates key technical specifications.

## Supported Models
- **GPT-4 Realtime** (region-dependent availability)
- **Model Name**: `gpt-4-realtime` or similar (confirm with Azure deployment name)
- **Regions with Support**: Not all Azure regions support Realtime API - verify availability before deployment

## API Endpoints & Authentication

### Endpoints
- **Base URL**: `https://<resource-name>.openai.azure.com/`
- **Text Completion**: `/openai/deployments/<deployment-id>/chat/completions?api-version=2024-02-15-preview`
- **Realtime API**: WebSocket-based (protocol TBD - requires Azure docs confirmation)

### Authentication Methods
✅ **RBAC (Recommended)**:
- Use Azure AD access token with `Cognitive Services OpenAI User` role
- MSAL.js acquires token with scope: `https://cognitiveservices.azure.com/.default`
- Token passed via `Authorization: Bearer <token>` header

❌ **API Keys (NOT USED)**: Security requirement prohibits client-side API keys

## Message Format & Schema

### Text Chat Schema
```json
{
  "messages": [
    {
      "role": "user | assistant | system",
      "content": "message text"
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7,
  "stream": true
}
```

### Streaming Response (SSE)
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","choices":[{"delta":{"content":"Hello"},"index":0}]}
data: [DONE]
```

## Streaming Protocols

### Supported Protocols
1. **WebSocket** (Primary for real-time voice)
   - Bidirectional communication
   - Low latency (<100ms)
   - Persistent connection

2. **Server-Sent Events (SSE)** (Text streaming)
   - Unidirectional (server → client)
   - HTTP/2 based
   - Fallback for text-only mode

### WebSocket Connection Flow
```
1. Authenticate with MSAL.js → Get access token
2. Establish WebSocket: wss://<resource>.openai.azure.com/realtime?token=<bearer_token>
3. Send audio chunks (PCM16 or Opus)
4. Receive transcription + AI response audio stream
5. Maintain connection with keepalive/heartbeat
```

## Voice Input/Output Format Requirements

### Audio Specifications (from docs/azure-openai-realtime-chatbot.md)
| Parameter | Value |
|-----------|-------|
| **Input Codec** | PCM16 or Opus (Opus preferred for compression) |
| **Output Codec** | PCM16 or Opus |
| **Sample Rate** | 16kHz (voice) or 24kHz (high quality) |
| **Bit Depth** | 16-bit |
| **Channels** | Mono (1 channel) |
| **Chunk Size** | 100-200ms (1600-3200 bytes at 16kHz PCM16) |

### Web Audio API Configuration
```typescript
const audioConstraints: MediaStreamConstraints = {
  audio: {
    sampleRate: 16000,        // 16kHz for Azure OpenAI
    channelCount: 1,          // Mono
    echoCancellation: true,   // Enable AEC
    noiseSuppression: true,   // Enable noise suppression
    autoGainControl: true     // Normalize volume
  }
};
```

### Encoding Example (PCM16)
```typescript
// Convert Float32 audio samples to PCM16
const float32ToPCM16 = (float32Array: Float32Array): Int16Array => {
  const pcm16 = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i])); // Clamp
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; // Convert to 16-bit signed
  }
  return pcm16;
};
```

## Rate Limits & Quotas

### Typical Azure OpenAI Rate Limits
- **Requests per minute (RPM)**: 60-120 (varies by subscription tier)
- **Tokens per minute (TPM)**: 40,000-90,000 (depends on model)
- **Concurrent connections**: 10-50 (WebSocket)

### HTTP Status Codes
- **429 Too Many Requests**: Rate limit exceeded
  - Header: `Retry-After: <seconds>`
  - Client should implement exponential backoff

### Quota Management Strategy
```typescript
// Client-side rate limiter (estimation)
class RateLimiter {
  private queue: Array<() => void> = [];
  private requestCount = 0;
  private readonly maxRequests = 60; // per minute
  
  async enqueue(fn: () => Promise<any>) {
    if (this.requestCount >= this.maxRequests) {
      // Queue or delay
      await this.wait(1000);
    }
    this.requestCount++;
    setTimeout(() => this.requestCount--, 60000); // Reset after 1 min
    return fn();
  }
}
```

## Error Codes & Handling

### Common Error Codes
| Code | Meaning | Client Action |
|------|---------|---------------|
| **400** | Bad Request (invalid message format) | Show user error, log details |
| **401** | Unauthorized (token invalid/expired) | Refresh token with MSAL.js, retry |
| **403** | Forbidden (insufficient permissions) | Show "access denied" message |
| **429** | Too Many Requests | Exponential backoff, show "retrying..." |
| **500** | Internal Server Error | Retry with backoff (2-3 attempts) |
| **503** | Service Unavailable | Retry after delay, show maintenance message |

### WebSocket Error Codes
| WS Code | Meaning | Action |
|---------|---------|--------|
| **1000** | Normal closure | Clean disconnect |
| **1006** | Abnormal closure (network issue) | Auto reconnect with backoff |
| **1008** | Policy violation (auth failure) | Re-authenticate, retry |
| **1011** | Server error | Retry with delay |

### Error Handling Pattern
```typescript
const handleAPIError = async (error: any, retryCount = 0): Promise<void> => {
  if (error.status === 401 && retryCount < 1) {
    // Token expired - refresh and retry
    await refreshToken();
    return retry();
  } else if (error.status === 429) {
    // Rate limit - exponential backoff
    const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
    await sleep(delay);
    return retry();
  } else if (error.status >= 500 && retryCount < 3) {
    // Server error - retry with backoff
    await sleep(2000);
    return retry();
  }
  throw error; // Give up after retries
};
```

## JavaScript/TypeScript SDK (@azure/openai)

### SDK Version
- **Package**: `@azure/openai`
- **Version**: `^1.0.0-beta.11` (latest as of research)
- **Type Definitions**: Included (TypeScript support)

### Basic Usage (Text Chat)
```typescript
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

// Using RBAC token (recommended)
const client = new OpenAIClient(
  endpoint,
  new TokenCredential(msalToken) // Custom credential from MSAL
);

// Stream completion
const events = await client.streamChatCompletions(
  deploymentId,
  messages,
  { maxTokens: 150 }
);

for await (const event of events) {
  console.log(event.choices[0]?.delta?.content);
}
```

### WebSocket Realtime API
⚠️ **Status**: SDK may not fully support WebSocket Realtime API - might require direct WebSocket implementation

```typescript
// Potential approach (requires validation)
const ws = new WebSocket(
  `wss://${resourceName}.openai.azure.com/realtime`,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'api-key': undefined // Not using API key
    }
  }
);

ws.on('open', () => {
  // Send audio chunks
  ws.send(audioChunk);
});

ws.on('message', (data) => {
  // Receive transcription + response audio
  handleAudioResponse(data);
});
```

## Open Questions for Implementation

1. **Q: Exact WebSocket endpoint for Realtime API**
   - Research required: Azure OpenAI Realtime API WebSocket URL format
   - Impact: Critical for voice implementation

2. **Q: Voice response format**
   - Does Azure return PCM16 audio directly or base64-encoded?
   - Is audio chunked or full response?

3. **Q: Conversation context handling**
   - How to maintain conversation history with voice interactions?
   - Does Realtime API handle context automatically?

4. **Q: SDK vs Direct WebSocket**
   - Does `@azure/openai` SDK support Realtime API WebSocket?
   - Or must we use raw WebSocket connection?

5. **Q: Token refresh during long WebSocket session**
   - How to handle token expiration during active voice call?
   - Can WebSocket connection accept new token mid-session?

## References
- **Internal Docs**: `/workspaces/realtime-website/docs/azure-openai-realtime-chatbot.md` (Lines 234-246 for audio specs)
- **Azure OpenAI Docs**: https://learn.microsoft.com/azure/ai-services/openai/ (requires web fetch)
- **@azure/openai SDK**: https://www.npmjs.com/package/@azure/openai
- **RBAC Configuration**: `/workspaces/realtime-website/docs/azure-openai-realtime-chatbot.md` (Lines 323-336)

## Status
✅ **Core specifications documented**
⚠️ **Requires clarification**: WebSocket endpoint format, SDK Realtime API support
📋 **Next Steps**: Confirm Realtime API specifics with Azure documentation or SDK examples
