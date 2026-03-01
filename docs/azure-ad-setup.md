# Azure Authentication Setup Guide for Realtime Website

This guide walks you through configuring authentication for the realtime-website application. Authentication is handled entirely on the **backend** using [`DefaultAzureCredential`](https://docs.microsoft.com/en-us/python/api/azure-identity/azure.identity.defaultazurecredential) from the Azure Identity SDK. No Azure AD App Registration or MSAL.js frontend setup is required.

## How Authentication Works

The Python backend (`src/server.py`) uses `DefaultAzureCredential` to authenticate with Azure OpenAI. The frontend React app connects to the backend WebSocket proxy at `/api/realtime` — the browser never communicates directly with Azure OpenAI.

`DefaultAzureCredential` automatically tries these credential sources in order:
1. **Environment variables** (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`)
2. **Azure CLI** (`az login`) — recommended for local development
3. **Visual Studio Code credentials**
4. **Managed Identity** — used when deployed to Azure (App Service, Container Apps, AKS, etc.)

## Table of Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Local Development Setup](#2-local-development-setup)
- [3. Production Setup (Managed Identity)](#3-production-setup-managed-identity)
- [4. RBAC Configuration](#4-rbac-configuration)
- [5. Troubleshooting](#5-troubleshooting)

---

## 1. Prerequisites

Before you begin, ensure you have:

- **Azure Subscription**: An active Azure subscription
- **Azure CLI**: Installed and authenticated ([Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- **Azure OpenAI Resource**: An existing Azure OpenAI resource with a realtime model deployment configured

### Verify Azure CLI Installation

```bash
# Check Azure CLI version
az --version

# Login to Azure
az login

# Verify your account
az account show
```

---

## 2. Local Development Setup

### Step 1: Login with Azure CLI

```bash
az login
```

This is all that's needed for authentication in local development. `DefaultAzureCredential` will automatically pick up your `az login` credentials.

### Step 2: Configure Environment Variables

Create a `.env` file in the repository root with your Azure OpenAI resource details:

```env
# Azure OpenAI endpoint (required)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# Azure OpenAI model deployment name (required)
AZURE_OPENAI_DEPLOYMENT=gpt-4o-realtime-preview
```

Replace the placeholder values:
- `https://your-resource.openai.azure.com` → Your Azure OpenAI resource endpoint
- `gpt-4o-realtime-preview` → Your realtime model deployment name

### Step 3: Start the Backend and Frontend

```bash
# Start the Python backend (from repo root)
uv run python src/server.py

# In a separate terminal, start the Vite frontend
cd web && npm run dev
```

Navigate to `http://localhost:5173` and the app will connect to the backend proxy.

---

## 3. Production Setup (Managed Identity)

When deploying to Azure, use a [Managed Identity](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview) for the hosting resource (App Service, Container Apps, AKS, etc.). No credentials need to be stored — `DefaultAzureCredential` picks up the managed identity automatically.

### Enable Managed Identity

#### Azure App Service

```bash
# Enable system-assigned managed identity
az webapp identity assign \
    --name "your-app-name" \
    --resource-group "your-resource-group"
```

#### Azure Container Apps

```bash
# Enable system-assigned managed identity
az containerapp identity assign \
    --name "your-container-app" \
    --resource-group "your-resource-group" \
    --system-assigned
```

After enabling Managed Identity, [assign the required RBAC role](#4-rbac-configuration) to the identity's principal ID.

---

## 4. RBAC Configuration

The identity used to run the backend (your `az login` user for local dev, or the managed identity in production) must have the **Cognitive Services OpenAI User** role on the Azure OpenAI resource.

### Use the Setup Script

Run the provided RBAC setup script:

```bash
# From the repository root
./scripts/setup-azure-ad.sh
```

The script will guide you through assigning the required role to a user, group, or managed identity.

### Manual Role Assignment

#### Assign Role to a User (local development)

```bash
RESOURCE_GROUP="your-resource-group"
OPENAI_RESOURCE_NAME="your-openai-resource"
USER_EMAIL="user@example.com"

# Get the Azure OpenAI resource ID
OPENAI_RESOURCE_ID=$(az cognitiveservices account show \
    --name "$OPENAI_RESOURCE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id \
    --output tsv)

# Assign role
az role assignment create \
    --role "Cognitive Services OpenAI User" \
    --assignee "$USER_EMAIL" \
    --scope "$OPENAI_RESOURCE_ID"

echo "Role assigned to $USER_EMAIL"
```

#### Assign Role to a Managed Identity (production)

```bash
RESOURCE_GROUP="your-resource-group"
OPENAI_RESOURCE_NAME="your-openai-resource"
MANAGED_IDENTITY_PRINCIPAL_ID="<principal-id-from-identity-assign-output>"

# Get the Azure OpenAI resource ID
OPENAI_RESOURCE_ID=$(az cognitiveservices account show \
    --name "$OPENAI_RESOURCE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id \
    --output tsv)

# Assign role
az role assignment create \
    --role "Cognitive Services OpenAI User" \
    --assignee-object-id "$MANAGED_IDENTITY_PRINCIPAL_ID" \
    --assignee-principal-type ServicePrincipal \
    --scope "$OPENAI_RESOURCE_ID"

echo "Role assigned to managed identity"
```

#### Verify Role Assignments

```bash
# List role assignments on the Azure OpenAI resource
az role assignment list \
    --scope "$OPENAI_RESOURCE_ID" \
    --output table
```

---

## 5. Troubleshooting

### CredentialUnavailableError or AuthenticationError

**Cause**: `DefaultAzureCredential` could not find any valid credentials.

**Solutions**:
1. Run `az login` and re-authenticate
2. Verify you're using the correct tenant: `az account show`
3. Ensure the backend process can reach Azure endpoints (check firewall/proxy settings)

```bash
# Re-authenticate
az login

# Check active account
az account show
```

---

### 403 Forbidden on Azure OpenAI API Calls

**Cause**: The identity does not have the required RBAC role on the Azure OpenAI resource.

**Solutions**:
1. Assign the **Cognitive Services OpenAI User** role (see [RBAC Configuration](#4-rbac-configuration))
2. Wait a few minutes for role assignment to propagate
3. Re-authenticate (`az login`) to get a new token with updated role claims

```bash
# Check existing role assignments for your account
az role assignment list \
    --assignee "$(az account show --query user.name -o tsv)" \
    --scope "$OPENAI_RESOURCE_ID" \
    --output table
```

---

### Backend Health Check Fails

Use the health endpoint to diagnose backend credential issues:

```bash
curl http://localhost:8000/api/health
```

A healthy response includes `"credential_valid": true`. If `credential_valid` is `false`, the `credential_error` field explains why.

---

### Environment Variables Not Loaded

**Cause**: The `.env` file is missing or in the wrong location.

**Solutions**:
1. Ensure `.env` exists in the repository root (not in `web/` or `src/`)
2. Verify it contains `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_DEPLOYMENT`
3. Restart the backend server after modifying the file

```bash
# Check the .env file
cat .env
```

---

## Additional Resources

- [DefaultAzureCredential documentation](https://docs.microsoft.com/en-us/python/api/azure-identity/azure.identity.defaultazurecredential)
- [Azure Managed Identities overview](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [Azure OpenAI authentication](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/how-to/managed-identity)
- [Azure RBAC for Cognitive Services](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/how-to/role-based-access-control)
