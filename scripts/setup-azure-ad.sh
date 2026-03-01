#!/usr/bin/env bash
#
# Azure RBAC Setup Script for Realtime Website
#
# Assigns the "Cognitive Services OpenAI User" role to a user, group, or managed identity
# on an Azure OpenAI resource. This is the only Azure AD configuration required because
# the backend uses DefaultAzureCredential (az login / managed identity) for authentication.
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

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Azure OpenAI RBAC Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "This script assigns the 'Cognitive Services OpenAI User' role to an identity"
echo "on your Azure OpenAI resource. Run this for:"
echo "  - Your own account (local development with az login)"
echo "  - A managed identity (production deployments)"
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

# Prompt for Azure OpenAI resource details
read -rp "Enter the resource group of your Azure OpenAI resource: " RESOURCE_GROUP
read -rp "Enter the name of your Azure OpenAI resource: " OPENAI_RESOURCE_NAME

# Get the Azure OpenAI resource ID
echo -e "${YELLOW}Looking up Azure OpenAI resource...${NC}"
OPENAI_RESOURCE_ID=$(az cognitiveservices account show \
    --name "$OPENAI_RESOURCE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query id \
    --output tsv)

if [[ -z "$OPENAI_RESOURCE_ID" ]]; then
    echo -e "${RED}Error: Could not find Azure OpenAI resource '${OPENAI_RESOURCE_NAME}' in resource group '${RESOURCE_GROUP}'${NC}"
    exit 1
fi

echo -e "${GREEN}Found resource: ${OPENAI_RESOURCE_ID}${NC}"
echo ""

# Select assignee type
echo "Who should be granted access?"
echo "  1) My current Azure CLI user account (local development)"
echo "  2) A specific user by email"
echo "  3) A managed identity (production deployment)"
read -rp "Enter choice [1]: " ASSIGNEE_CHOICE
ASSIGNEE_CHOICE="${ASSIGNEE_CHOICE:-1}"

case "$ASSIGNEE_CHOICE" in
    1)
        ASSIGNEE=$(az account show --query user.name --output tsv)
        PRINCIPAL_TYPE="User"
        echo -e "${GREEN}Assigning role to current user: ${ASSIGNEE}${NC}"
        az role assignment create \
            --role "Cognitive Services OpenAI User" \
            --assignee "$ASSIGNEE" \
            --scope "$OPENAI_RESOURCE_ID"
        ;;
    2)
        read -rp "Enter user email: " USER_EMAIL
        ASSIGNEE="$USER_EMAIL"
        PRINCIPAL_TYPE="User"
        echo -e "${GREEN}Assigning role to user: ${ASSIGNEE}${NC}"
        az role assignment create \
            --role "Cognitive Services OpenAI User" \
            --assignee "$ASSIGNEE" \
            --scope "$OPENAI_RESOURCE_ID"
        ;;
    3)
        read -rp "Enter the principal ID of the managed identity: " PRINCIPAL_ID
        PRINCIPAL_TYPE="ServicePrincipal"
        echo -e "${GREEN}Assigning role to managed identity: ${PRINCIPAL_ID}${NC}"
        az role assignment create \
            --role "Cognitive Services OpenAI User" \
            --assignee-object-id "$PRINCIPAL_ID" \
            --assignee-principal-type "$PRINCIPAL_TYPE" \
            --scope "$OPENAI_RESOURCE_ID"
        ;;
    *)
        echo -e "${RED}Invalid choice.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RBAC Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Create a .env file in the repository root:"
echo ""
echo -e "   ${GREEN}AZURE_OPENAI_ENDPOINT=https://${OPENAI_RESOURCE_NAME}.openai.azure.com${NC}"
echo -e "   ${GREEN}AZURE_OPENAI_DEPLOYMENT=your-deployment-name${NC}"
echo ""
echo "2. Start the backend server:"
echo -e "   ${GREEN}uv run python src/server.py${NC}"
echo ""
echo "3. Start the frontend:"
echo -e "   ${GREEN}cd web && npm run dev${NC}"
echo ""
echo -e "${BLUE}Note:${NC} Role assignments may take a few minutes to propagate."
echo "If you see 403 errors, wait a moment and retry."
echo ""
