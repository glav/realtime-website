# Azure OpenAI Realtime Chatbot

A web application for real-time voice and text chat with Azure OpenAI GPT models, featuring RBAC-based authentication.

## Architecture

```
┌─────────────┐     WebSocket     ┌─────────────┐     WebSocket     ┌──────────────────┐
│   Browser   │ ←──────────────→  │   Python    │ ←──────────────→  │  Azure OpenAI    │
│  (React)    │                   │   Backend   │                   │  Realtime API    │
└─────────────┘                   └─────────────┘                   └──────────────────┘
                                        │
                                        │ DefaultAzureCredential
                                        │ (uses az login / Managed Identity)
                                        ↓
                                  ┌─────────────┐
                                  │  Azure AD   │
                                  └─────────────┘
```

## Prerequisites

1. **Azure CLI** - Logged in with `az login`
2. **Azure OpenAI Resource** - With a realtime model deployment (e.g., `gpt-4o-realtime-preview`)
3. **RBAC Role Assignment** - User must have `Cognitive Services OpenAI User` role on the Azure OpenAI resource

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

```bash
# Backend (.env in repo root)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o-realtime-preview

# Frontend (web/.env.local) - optional for MSAL auth
VITE_AZURE_CLIENT_ID=your-app-client-id
VITE_AZURE_TENANT_ID=your-tenant-id
```

### 3. Start the servers

```bash
# Terminal 1: Backend (port 8000)
uv run python src/server.py

# Terminal 2: Frontend (port 5173)
cd web && npm run dev
```

### 4. Open the app

Navigate to http://localhost:5173

## Development

### Backend

The Python backend (`src/server.py`) provides:
- `/api/health` - Health check endpoint
- `/api/realtime` - WebSocket proxy to Azure OpenAI Realtime API

Authentication uses `DefaultAzureCredential`, which automatically picks up:
- `az login` credentials (local development)
- Managed Identity (Azure deployments)
- Environment variables, VS Code credentials, etc.

### Frontend

The React frontend (`web/`) includes:
- MSAL authentication (optional, for user identification)
- WebSocket client for realtime communication
- Voice input/output components (coming soon)

## Project Structure

```
├── src/
│   ├── server.py      # Backend server with WebSocket proxy
│   └── load_env.py    # Environment variable loading
├── web/
│   └── src/
│       ├── services/
│       │   ├── authService.ts      # MSAL authentication
│       │   └── realtimeService.ts  # WebSocket client
│       └── components/             # React components
├── pyproject.toml     # Python dependencies
└── .env               # Backend configuration
```

## Troubleshooting

### "Credential not valid" error
- Ensure you're logged in with `az login`
- Verify you have the `Cognitive Services OpenAI User` role assigned

### WebSocket connection fails
- Check the backend is running on port 8000
- Verify `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_DEPLOYMENT` are set correctly

---

## Original Template Documentation

## What this template includes

- Python 3.12 devcontainer setup
- `uv` for dependency management (`pyproject.toml` + `uv.lock`)
- A tiny runnable entrypoint (`src/app.py`) that loads environment variables from `.env` via `python-dotenv`
- `AGENTS.md` for coding-agent guidance

## Using this repo as a template

Typical workflow:

1. Create a new repository from this template (GitHub: “Use this template”).
2. Update project metadata in `pyproject.toml` (name/description).
3. Replace the sample app code under `src/` with your real project.
4. Update `AGENTS.md` and this README to reflect the new repo’s purpose.

## Setup

This repo uses `uv`.

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync
```

## Run

```bash
uv run python src/app.py
```

## Linting and formatting

This template includes `ruff`.

```bash
uv sync --group dev
uv run ruff check .
uv run ruff format .
```

## Environment variables

- Copy `.env-sample` to `.env` and fill in values as needed.
- `.env` is gitignored.

```bash
cp .env-sample .env
```

## Copilot / AI Assisted workflow

This template includes an `.agent/` directory containing reusable prompt “commands” and standards you can use with GitHub Copilot (and other coding agents).

- `.agent/commands/`: ready-to-run prompts for common tasks, for example:
	- `setup/`: repo bootstrap tasks (e.g. creating `AGENTS.md`)
	- `project/`: planning prompts (e.g. sprint planning)
	- `docs/`: documentation prompts (e.g. creating ADRs)
- `.agent/standards/`: templates and standards for consistent artifacts (ADRs, feature specs, task plans)
- `.agent/instructions/`: “apply-to” instructions that guide how agents write certain file types (e.g. Bash and Bicep)

If you base a new repository on this template, treat `.agent/` as a starting library: keep what helps your team, remove what doesn’t, and add org-specific workflows over time.

## Copilot CLI (devcontainer)

The devcontainer includes GitHub Copilot CLI via the official devcontainer feature (`ghcr.io/devcontainers/features/copilot-cli:latest`).

## Spec-Driven Development (SDD) Workflow

This template includes an enhanced **Spec-Driven Development (SDD)** workflow in `.agent/commands/sdd/`. The SDD workflow provides a structured, 9-step process for developing features with built-in quality gates and testing integration.

### SDD Workflow Steps

| Step | Prompt File | Purpose |
|------|-------------|---------|
| 0 | `sdd.0-initialize.prompt.md` | Initialize environment and verify prerequisites |
| 1 | `sdd.1-create-feature-spec.prompt.md` | Create feature specification via guided Q&A |
| 2 | `sdd.2-review-spec.prompt.md` | Review spec for completeness (quality gate) |
| 3 | `sdd.3-research-feature.prompt.md` | Research implementation approach |
| 4 | `sdd.4-determine-test-strategy.prompt.md` | Determine TDD vs Code-First approach |
| 5 | `sdd.5-task-planner-for-feature.prompt.md` | Create implementation plan with test phases |
| 6 | `sdd.6-review-plan.prompt.md` | Review plan for readiness (quality gate) |
| 7 | `sdd.7-task-implementer-for-feature.prompt.md` | Execute implementation systematically |
| 8 | `sdd.8-post-implementation-review.prompt.md` | Final validation before completion |

### How to Use

1. **Initialize**: Run `sdd.0-initialize.prompt.md` to set up the environment
2. **Start a feature**: Run `sdd.1-create-feature-spec.prompt.md` with your feature idea
3. **Follow handoffs**: Each step tells you which step to run next
4. **Don't skip review gates**: Steps 2, 4, 6, and 8 catch issues early

### Key Features

- **Quality gates** at review steps with explicit PASS/FAIL validation
- **Deterministic test strategy** using a scoring-based decision matrix
- **Integrated testing** with mandatory test phases in implementation plans
- **State management** for session continuity across steps
- **Artifact tracking** in `.agent-tracking/` directory

For full documentation, see `.agent/commands/sdd/README.md`.
