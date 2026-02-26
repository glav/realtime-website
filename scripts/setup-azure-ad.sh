#!/usr/bin/env bash
#
# Azure AD App Registration Setup Script
# Creates and configures an Azure AD App Registration for the realtime-website
#
# Usage: ./scripts/setup-azure-ad.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEFAULT_APP_NAME="realtime-website"
DEFAULT_DEV_REDIRECT="http://localhost:5173"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Azure AD App Registration Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed.${NC}"
    echo "Please install it from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
echo -e "${YELLOW}Checking Azure CLI authentication...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Azure. Initiating login...${NC}"
    az login
fi

# Display current account
CURRENT_ACCOUNT=$(az account show --query name --output tsv)
CURRENT_TENANT=$(az account show --query tenantId --output tsv)
echo -e "${GREEN}Logged in to: ${CURRENT_ACCOUNT}${NC}"
echo -e "${GREEN}Tenant ID: ${CURRENT_TENANT}${NC}"
echo ""

# Prompt for app name
read -rp "Enter App Registration name [${DEFAULT_APP_NAME}]: " APP_NAME
APP_NAME="${APP_NAME:-$DEFAULT_APP_NAME}"

# Prompt for development redirect URI
read -rp "Enter development redirect URI [${DEFAULT_DEV_REDIRECT}]: " DEV_REDIRECT
DEV_REDIRECT="${DEV_REDIRECT:-$DEFAULT_DEV_REDIRECT}"

# Prompt for production redirect URI
read -rp "Enter production redirect URI (leave blank to skip): " PROD_REDIRECT

# Prompt for sign-in audience
echo ""
echo "Select supported account types:"
echo "  1) Single tenant - Accounts in this organizational directory only (default)"
echo "  2) Multi-tenant - Accounts in any organizational directory"
read -rp "Enter choice [1]: " AUDIENCE_CHOICE
AUDIENCE_CHOICE="${AUDIENCE_CHOICE:-1}"

case "$AUDIENCE_CHOICE" in
    1)
        SIGN_IN_AUDIENCE="AzureADMyOrg"
        ;;
    2)
        SIGN_IN_AUDIENCE="AzureADMultipleOrgs"
        ;;
    *)
        echo -e "${RED}Invalid choice. Using single tenant.${NC}"
        SIGN_IN_AUDIENCE="AzureADMyOrg"
        ;;
esac

echo ""
echo -e "${YELLOW}Creating App Registration: ${APP_NAME}${NC}"

# Build redirect URIs array
if [[ -n "$PROD_REDIRECT" ]]; then
    REDIRECT_URIS="[\"${DEV_REDIRECT}\",\"${PROD_REDIRECT}\"]"
else
    REDIRECT_URIS="[\"${DEV_REDIRECT}\"]"
fi

# Create the App Registration
APP_ID=$(az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience "$SIGN_IN_AUDIENCE" \
    --query appId \
    --output tsv)

if [[ -z "$APP_ID" ]]; then
    echo -e "${RED}Error: Failed to create App Registration${NC}"
    exit 1
fi

echo -e "${GREEN}Created App Registration with Client ID: ${APP_ID}${NC}"

# Configure SPA redirect URIs using Graph API (handles empty spa object on new apps)
echo -e "${YELLOW}Configuring SPA redirect URIs...${NC}"
OBJECT_ID=$(az ad app show --id "$APP_ID" --query id -o tsv)
az rest --method PATCH \
    --uri "https://graph.microsoft.com/v1.0/applications/${OBJECT_ID}" \
    --headers "Content-Type=application/json" \
    --body "{\"spa\":{\"redirectUris\":${REDIRECT_URIS}}}"

echo -e "${GREEN}Configured redirect URIs: ${REDIRECT_URIS}${NC}"

# Add Azure Cognitive Services API permission
echo -e "${YELLOW}Adding Azure Cognitive Services API permission...${NC}"

# Azure Cognitive Services API ID: 7d312290-28c8-473c-a0ed-8e53749b6d6d
# user_impersonation permission ID: 5f1e8914-a52b-429f-9324-91b92b81adaf
az ad app permission add \
    --id "$APP_ID" \
    --api "7d312290-28c8-473c-a0ed-8e53749b6d6d" \
    --api-permissions "5f1e8914-a52b-429f-9324-91b92b81adaf=Scope" \
    2>/dev/null || echo -e "${YELLOW}Note: API permission may already exist${NC}"

# Create service principal for the app (required for consent flow)
echo -e "${YELLOW}Creating service principal...${NC}"
az ad sp create --id "$APP_ID" 2>/dev/null || echo -e "${YELLOW}Note: Service principal may already exist${NC}"

echo -e "${GREEN}Added Azure Cognitive Services user_impersonation permission${NC}"

# Get Tenant ID
TENANT_ID=$(az account show --query tenantId --output tsv)

# Output summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}App Registration Details:${NC}"
echo -e "  Name:       ${APP_NAME}"
echo -e "  Client ID:  ${APP_ID}"
echo -e "  Tenant ID:  ${TENANT_ID}"
echo -e "  Audience:   ${SIGN_IN_AUDIENCE}"
echo ""
echo -e "${BLUE}Configured Redirect URIs:${NC}"
echo -e "  Development: ${DEV_REDIRECT}"
if [[ -n "$PROD_REDIRECT" ]]; then
    echo -e "  Production:  ${PROD_REDIRECT}"
fi
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Copy web/.env.example to web/.env.local:"
echo -e "   ${GREEN}cp web/.env.example web/.env.local${NC}"
echo ""
echo "2. Update web/.env.local with these values:"
echo ""
echo -e "   ${GREEN}VITE_AZURE_CLIENT_ID=${APP_ID}${NC}"
echo -e "   ${GREEN}VITE_AZURE_TENANT_ID=${TENANT_ID}${NC}"
echo ""
echo "3. Grant admin consent (if you have admin rights):"
echo -e "   ${GREEN}az ad app permission admin-consent --id ${APP_ID}${NC}"
echo ""
echo "4. Assign RBAC role to users for Azure OpenAI access:"
echo -e "   ${GREEN}az role assignment create \\${NC}"
echo -e "   ${GREEN}    --role \"Cognitive Services OpenAI User\" \\${NC}"
echo -e "   ${GREEN}    --assignee \"user@example.com\" \\${NC}"
echo -e "   ${GREEN}    --scope \"/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.CognitiveServices/accounts/{resource}\"${NC}"
echo ""
echo -e "${BLUE}Azure Portal Link:${NC}"
echo "  https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/Overview/appId/${APP_ID}"
echo ""
