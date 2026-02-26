# Azure AD Setup Guide for Realtime Website

This guide walks you through configuring Azure Active Directory (Azure AD) authentication for the realtime-website application, which uses MSAL.js for authentication and Azure OpenAI for AI capabilities.

## Table of Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Manual Setup (Azure Portal)](#2-manual-setup-azure-portal)
- [3. Automated Setup (Azure CLI)](#3-automated-setup-azure-cli)
- [4. Configure the Application](#4-configure-the-application)
- [5. RBAC Configuration](#5-rbac-configuration)
- [6. Troubleshooting](#6-troubleshooting)

---

## 1. Prerequisites

Before you begin, ensure you have:

- **Azure Subscription**: An active Azure subscription with permissions to create resources
- **Azure CLI**: Installed and authenticated ([Install Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- **Admin Permissions**: Sufficient permissions to create App Registrations in Azure AD (typically requires "Application Administrator" or "Global Administrator" role)
- **Azure OpenAI Resource**: An existing Azure OpenAI resource with a deployment configured

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

## 2. Manual Setup (Azure Portal)

Follow these steps to manually create and configure the Azure AD App Registration.

### Step 1: Create an App Registration

1. Navigate to the [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** → **App registrations**
3. Click **+ New registration**
4. Configure the registration:
   - **Name**: `realtime-website` (or your preferred name)
   - **Supported account types**: Select based on your requirements:
     - *Single tenant*: "Accounts in this organizational directory only"
     - *Multi-tenant*: "Accounts in any organizational directory"
   - **Redirect URI**: Leave blank for now (we'll configure this in the next step)
5. Click **Register**

### Step 2: Configure as a Single Page Application (SPA)

1. In your newly created App Registration, go to **Authentication**
2. Click **+ Add a platform**
3. Select **Single-page application**
4. Configure the redirect URIs:
   - **Development**: `http://localhost:5173`
   - **Production**: `https://your-production-domain.com` (add your actual production URL)
5. Under **Implicit grant and hybrid flows**:
   - Leave both checkboxes **unchecked** (we use PKCE, not implicit flow)
6. Click **Configure**

> **Note**: This application uses the Authorization Code Flow with PKCE (Proof Key for Code Exchange), which is the recommended flow for SPAs. No client secret is required.

### Step 3: Configure API Permissions

1. In your App Registration, go to **API permissions**
2. Click **+ Add a permission**
3. Select **APIs my organization uses**
4. Search for and select **Azure Cognitive Services**
5. Select **Delegated permissions**
6. Check **user_impersonation**
7. Click **Add permissions**
8. Click **Grant admin consent for [Your Organization]** if you have admin rights

The application uses the scope `https://cognitiveservices.azure.com/.default` for Azure OpenAI access.

> **Important**: In enterprise tenants, admin consent is typically **required** before regular users can sign in. If you skip this step, users will see an "Admin approval required" error. See [Troubleshooting: Admin Consent Required](#aadsts65001-admin-consent-required) for details.

### Step 4: Note Your Application Details

1. Go to **Overview** in your App Registration
2. Copy and save:
   - **Application (client) ID**: This is your `VITE_AZURE_CLIENT_ID`
   - **Directory (tenant) ID**: This is your `VITE_AZURE_TENANT_ID`

---

## 3. Automated Setup (Azure CLI)

Use the provided script or run the commands manually to automate the App Registration setup.

### Option A: Use the Setup Script

Run the automated setup script:

```bash
# From the repository root
./scripts/setup-azure-ad.sh
```

The script will:
1. Prompt for your app name and redirect URIs
2. Create the App Registration
3. Configure SPA redirect URIs
4. Add API permissions
5. Output the CLIENT_ID and TENANT_ID

### Option B: Manual CLI Commands

If you prefer to run commands manually:

```bash
# Set variables
APP_NAME="realtime-website"
DEV_REDIRECT_URI="http://localhost:5173"
PROD_REDIRECT_URI="https://your-production-domain.com"

# Create the App Registration
APP_ID=$(az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience "AzureADMyOrg" \
    --query appId \
    --output tsv)

echo "Created App Registration with Client ID: $APP_ID"

# Get Tenant ID
TENANT_ID=$(az account show --query tenantId --output tsv)

echo "Tenant ID: $TENANT_ID"

# Configure SPA redirect URIs
az ad app update \
    --id "$APP_ID" \
    --set spa.redirectUris="[\"$DEV_REDIRECT_URI\",\"$PROD_REDIRECT_URI\"]"

echo "Configured SPA redirect URIs"

# Add Azure Cognitive Services API permission (user_impersonation)
# The Azure Cognitive Services API ID is: 7a72c8f3-0000-0000-0000-000000000000
# user_impersonation permission ID: a]
az ad app permission add \
    --id "$APP_ID" \
    --api "7f432311-97d9-4a25-94ab-5d80e38c4a01" \
    --api-permissions "4914d7f7-8b41-4e45-b19a-5f8c6d8db0e5=Scope"

echo "Added Azure Cognitive Services API permission"

# Output configuration
echo ""
echo "============================================"
echo "Azure AD App Registration Complete!"
echo "============================================"
echo ""
echo "Add these values to your .env.local file:"
echo ""
echo "VITE_AZURE_CLIENT_ID=$APP_ID"
echo "VITE_AZURE_TENANT_ID=$TENANT_ID"
echo ""
```

---

## 4. Configure the Application

### Step 1: Create Environment File

```bash
# From the web directory
cd web

# Copy the example file
cp .env.example .env.local
```

### Step 2: Fill in the Values

Edit `web/.env.local` with your Azure AD configuration:

```env
# Azure AD Configuration
# Copy this file to .env.local and fill in your values

# Azure AD Application (client) ID from app registration
VITE_AZURE_CLIENT_ID=your-azure-ad-client-id

# Azure AD Directory (tenant) ID
VITE_AZURE_TENANT_ID=your-azure-ad-tenant-id

# Azure OpenAI Resource endpoint (optional - used by OpenAI service)
VITE_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# Azure OpenAI Deployment name (optional)
VITE_AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

Replace the placeholder values:
- `your-azure-ad-client-id` → Your Application (client) ID from Step 4 of Manual Setup
- `your-azure-ad-tenant-id` → Your Directory (tenant) ID from Step 4 of Manual Setup
- `https://your-resource.openai.azure.com` → Your Azure OpenAI endpoint
- `your-deployment-name` → Your Azure OpenAI model deployment name

### Step 3: Verify Configuration

Start the development server and verify authentication works:

```bash
npm run dev
```

Navigate to `http://localhost:5173` and attempt to sign in.

---

## 5. RBAC Configuration

For users to access Azure OpenAI through the application, they must have the **Cognitive Services OpenAI User** role assigned.

### Assign Role to Individual Users

```bash
# Set variables
RESOURCE_GROUP="your-resource-group"
OPENAI_RESOURCE_NAME="your-openai-resource"
USER_EMAIL="user@example.com"

# Get the user's Object ID
USER_OBJECT_ID=$(az ad user show --id "$USER_EMAIL" --query id --output tsv)

# Get the Azure OpenAI resource ID
OPENAI_RESOURCE_ID=$(az cognitiveservices account show \
    --name "$OPENAI_RESOURCE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id \
    --output tsv)

# Assign the Cognitive Services OpenAI User role
az role assignment create \
    --role "Cognitive Services OpenAI User" \
    --assignee-object-id "$USER_OBJECT_ID" \
    --assignee-principal-type User \
    --scope "$OPENAI_RESOURCE_ID"

echo "Role assigned to $USER_EMAIL"
```

### Assign Role to an Azure AD Group

```bash
# Set variables
RESOURCE_GROUP="your-resource-group"
OPENAI_RESOURCE_NAME="your-openai-resource"
GROUP_NAME="OpenAI-Users"

# Get the group's Object ID
GROUP_OBJECT_ID=$(az ad group show --group "$GROUP_NAME" --query id --output tsv)

# Get the Azure OpenAI resource ID
OPENAI_RESOURCE_ID=$(az cognitiveservices account show \
    --name "$OPENAI_RESOURCE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id \
    --output tsv)

# Assign the Cognitive Services OpenAI User role to the group
az role assignment create \
    --role "Cognitive Services OpenAI User" \
    --assignee-object-id "$GROUP_OBJECT_ID" \
    --assignee-principal-type Group \
    --scope "$OPENAI_RESOURCE_ID"

echo "Role assigned to group $GROUP_NAME"
```

### Verify Role Assignments

```bash
# List role assignments on the Azure OpenAI resource
az role assignment list \
    --scope "$OPENAI_RESOURCE_ID" \
    --output table
```

---

## 6. Troubleshooting

### Common Errors and Solutions

#### AADSTS900144: The request body must contain the following parameter: 'client_id'

**Cause**: Environment variables are not set or not being read correctly.

**Solutions**:
1. Verify `.env.local` exists in the `web/` directory
2. Ensure the file contains `VITE_AZURE_CLIENT_ID` with a valid value
3. Restart the development server after modifying environment variables
4. Check that the variable name starts with `VITE_` (required for Vite to expose it)

```bash
# Verify your .env.local file
cat web/.env.local | grep VITE_AZURE
```

---

#### AADSTS700016: Application with identifier 'xxx' was not found

**Cause**: The Client ID is incorrect or the app registration doesn't exist.

**Solutions**:
1. Verify the `VITE_AZURE_CLIENT_ID` value matches your App Registration
2. Ensure you're using the correct tenant (check `VITE_AZURE_TENANT_ID`)
3. Confirm the App Registration exists in Azure Portal

```bash
# Verify the app exists
az ad app show --id "your-client-id"
```

---

#### AADSTS50011: The redirect URI specified in the request does not match

**Cause**: The redirect URI used by the app doesn't match any configured in the App Registration.

**Solutions**:
1. Go to Azure Portal → App Registration → Authentication
2. Add the correct redirect URI (e.g., `http://localhost:5173`)
3. Ensure it's configured as a **Single-page application** platform, not Web

```bash
# Check configured redirect URIs
az ad app show --id "your-client-id" --query "spa.redirectUris"
```

---

#### AADSTS65001: Admin Consent Required

**Cause**: The application requires API permissions (e.g., Azure Cognitive Services) that need tenant administrator approval before users can sign in. This is common in enterprise tenants with restricted consent policies.

**What You'll See**: A message stating "Need admin approval" or "AADSTS65001: The user or administrator has not consented to use the application."

**Solutions**:

**Option 1: Sign in with an admin account**
- On the consent prompt, click **"Have an admin account? Sign in with that account"**
- Sign in with a Global Administrator or Application Administrator account
- Approve the permissions for the entire tenant

**Option 2: Grant admin consent via Azure CLI**
```bash
# Replace with your Application (client) ID
az ad app permission admin-consent --id "your-client-id"
```

**Option 3: Grant admin consent via Azure Portal**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your application (e.g., `realtime-website`)
4. Click **API permissions** in the left menu
5. Click **Grant admin consent for [your tenant]**
6. Confirm by clicking **Yes**

> **Note**: Once admin consent is granted, regular users will be able to sign in without seeing this prompt again. The consent applies tenant-wide.

---

#### CORS Errors in Browser Console

**Cause**: Redirect URI mismatch or app not configured as SPA.

**Solutions**:
1. Verify the redirect URI exactly matches (including trailing slashes)
2. Ensure the platform is set to "Single-page application" not "Web"
3. Check that you're accessing the app via the exact URL configured (e.g., `http://localhost:5173` not `http://127.0.0.1:5173`)

---

#### 403 Forbidden on Azure OpenAI API Calls

**Cause**: User doesn't have the required RBAC role on the Azure OpenAI resource.

**Solutions**:
1. Assign the **Cognitive Services OpenAI User** role to the user (see [RBAC Configuration](#5-rbac-configuration))
2. Wait a few minutes for role assignment to propagate
3. Sign out and sign back in to get a new token with updated claims

```bash
# Check existing role assignments
az role assignment list \
    --assignee "user@example.com" \
    --scope "/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.CognitiveServices/accounts/{resource-name}" \
    --output table
```

---

#### Token Expired or Invalid

**Cause**: The access token has expired or was revoked.

**Solutions**:
1. Sign out and sign back in
2. Clear browser storage (localStorage and sessionStorage)
3. Check browser console for MSAL-related errors

---

### Debug Tips

#### Enable MSAL Logging

In your MSAL configuration, enable logging for debugging:

```typescript
const msalConfig = {
  // ... other config
  system: {
    loggerOptions: {
      logLevel: LogLevel.Verbose,
      loggerCallback: (level, message, containsPii) => {
        console.log(message);
      },
    },
  },
};
```

#### Check Token Claims

Decode your access token at [jwt.ms](https://jwt.ms) to verify:
- `aud` (audience) matches your resource
- `scp` (scope) includes required permissions
- `tid` (tenant ID) is correct

#### Verify API Permissions

```bash
# List API permissions for your app
az ad app show --id "your-client-id" --query "requiredResourceAccess"
```

---

## Additional Resources

- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications)
- [Azure AD App Registration](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Azure OpenAI Authentication](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/how-to/managed-identity)
- [PKCE Flow Explained](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
