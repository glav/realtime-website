# Azure OpenAI Realtime Chatbot

A web application for real-time text chat with Azure OpenAI GPT models, using RBAC-based authentication.

![React frontend chat interface connected via WebSocket to Python backend, which authenticates to Azure OpenAI Realtime API through Entra ID. The screenshot shows a real-time chat application with message history, user input field, connection status indicator, and responsive design for the web-based chatbot interface.](./docs/realtime-chat-site-screenshot.png)

## How It Works

```
┌─────────────┐     WebSocket     ┌─────────────┐     WebSocket     ┌──────────────────┐
│   Browser   │ ←──────────────→  │   Python    │ ←──────────────→  │  Azure OpenAI    │
│  (React)    │                   │   Backend   │                   │  Realtime API    │
└─────────────┘                   └─────────────┘                   └──────────────────┘
                                        │
                                        │ DefaultAzureCredential
                                        │ (az login / Managed Identity)
                                        ↓
                                  ┌─────────────┐
                                  │  Entra ID   │
                                  └─────────────┘
```

The **React frontend** provides a chat UI that connects via WebSocket to the **Python backend**. The backend acts as a secure proxy to the Azure OpenAI Realtime API, handling authentication using `DefaultAzureCredential`.

## Prerequisites

1. **Azure CLI** - Logged in with `az login`
2. **Azure OpenAI Resource** - With a realtime model deployment (e.g., `gpt-4o-realtime-preview`)
3. **RBAC Role Assignment** - User must have `Cognitive Services OpenAI User` role on the Azure OpenAI resource
4. **uv** - Python dependency manager ([install guide](https://github.com/astral-sh/uv))
5. **Node.js** - For the frontend (v18+)

### Assigning the RBAC Role

```bash
# Get your user object ID
USER_ID=$(az ad signed-in-user show --query id -o tsv)

# Get your Azure OpenAI resource ID (replace with your values)
RESOURCE_GROUP="your-resource-group"
OPENAI_RESOURCE="your-openai-resource"
RESOURCE_ID=$(az cognitiveservices account show \
    --resource-group $RESOURCE_GROUP \
    --name $OPENAI_RESOURCE \
    --query id -o tsv)

# Assign the Cognitive Services OpenAI User role
az role assignment create \
    --assignee $USER_ID \
    --role "Cognitive Services OpenAI User" \
    --scope $RESOURCE_ID
```

## Quick Start

### 1. Install dependencies

```bash
# Backend (Python)
uv sync

# Frontend (Node.js)
cd web && npm install
```

### 2. Configure environment

Create a `.env` file in the repository root:

```bash
# .env (in repo root)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o-realtime-preview
```

The frontend uses the Vite dev server proxy to communicate with the backend, so no separate frontend configuration is required for development.

### 3. Authenticate with Azure

```bash
az login
```

### 4. Start the servers

**Option A: Two terminals**

```bash
# Terminal 1: Backend (port 8000)
uv run python src/server.py

# Terminal 2: Frontend (port 5173)
cd web && npm run dev
```

**Option B: Single terminal (background backend)**

```bash
uv run python src/server.py &
cd web && npm run dev
```

### 5. Open the app

Navigate to http://localhost:5173

The UI will show a green "Backend ready" indicator when everything is working. If you see auth errors, ensure you've run `az login` and have the RBAC role assigned.

## Configuration Reference

| Variable | Location | Description |
|----------|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | `.env` (root) | Your Azure OpenAI resource URL |
| `AZURE_OPENAI_DEPLOYMENT` | `.env` (root) | The realtime model deployment name |
| `PORT` | `.env` (root) | Backend port (default: 8000) |

## Backend API

The Python backend (`src/server.py`) exposes:

| Endpoint | Protocol | Description |
|----------|----------|-------------|
| `/api/health` | HTTP GET | Health check - returns JSON with connection status and credential validity |
| `/api/realtime` | WebSocket | Proxy to Azure OpenAI Realtime API - forwards messages bidirectionally |

Authentication uses `DefaultAzureCredential`, which automatically picks up:
- `az login` credentials (local development)
- Managed Identity (Azure deployments)
- Environment variables, VS Code credentials, etc.

## Frontend

The React frontend (`web/`) provides:
- Chat interface with message history
- Real-time WebSocket connection to the backend
- Connection status indicator
- Error handling and helpful messages

The Vite dev server proxies `/api/*` requests to `http://localhost:8000`, so the frontend and backend work together seamlessly.

## Project Structure

```
├── src/
│   ├── server.py          # Python backend - WebSocket proxy to Azure OpenAI
│   └── load_env.py        # .env file discovery and loading
├── web/
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── services/
│   │   │   └── realtimeService.ts  # WebSocket client
│   │   └── components/
│   │       └── Chat/      # Chat UI components
│   ├── vite.config.ts     # Vite config with API proxy
│   └── package.json       # Frontend dependencies
├── pyproject.toml         # Python dependencies (managed by uv)
├── .env                   # Backend configuration (gitignored)
└── README.md
```

## Troubleshooting

### "Credential not valid" error
- Run `az login` to authenticate
- Verify you have the `Cognitive Services OpenAI User` role assigned to your Azure user

### "Backend unreachable" in the UI
- Ensure the backend is running: `uv run python src/server.py`
- Check the backend console for errors

### WebSocket connection fails
- Verify `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_DEPLOYMENT` are set correctly in `.env`
- Check the backend logs for detailed error messages

---

## Development Tools

### Linting and Formatting (Python)

```bash
uv sync --group dev
uv run ruff check .
uv run ruff format .
```

### Frontend Testing

```bash
cd web
npm run test           # Unit tests
npm run test:e2e       # Playwright E2E tests
npm run lint           # ESLint
```

---

## AI-Assisted Workflow

This repository includes GitHub Copilot integration with reusable prompt commands in `.agent/`:

- **`.agent/commands/`** - Slash commands for common tasks (e.g., `/setup:agents-md-creation`)
- **`.agent/standards/`** - Templates for ADRs, feature specs, task plans
- **`.agent/instructions/`** - Coding guidelines for different file types

### Spec-Driven Development (SDD)

A structured 9-step workflow for feature development with quality gates. See `.agent/commands/sdd/README.md` for full documentation.

The devcontainer includes GitHub Copilot CLI (`copilot`) and Teambot for AI-assisted workflows.
