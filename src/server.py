"""
Backend server with WebSocket proxy to Azure OpenAI Realtime API.

Uses DefaultAzureCredential for authentication, which supports:
- Azure CLI credentials (az login) for local development
- Managed Identity for Azure deployments
- Environment variables, VS Code credentials, etc.

Run with: uv run python src/server.py
"""

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Optional

import aiohttp
from aiohttp import web, WSMsgType
from azure.identity.aio import DefaultAzureCredential

# Add src to path for imports when running from repo root
sys.path.insert(0, str(Path(__file__).parent))
from load_env import load_env

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Azure OpenAI configuration
AZURE_OPENAI_ENDPOINT: Optional[str] = None
AZURE_OPENAI_DEPLOYMENT: Optional[str] = None
CREDENTIAL: Optional[DefaultAzureCredential] = None

# API version for Azure OpenAI Realtime
API_VERSION = "2024-10-01-preview"


async def get_access_token() -> str:
    """Get an access token for Azure Cognitive Services using DefaultAzureCredential."""
    if CREDENTIAL is None:
        raise RuntimeError("Credential not initialized")
    
    token = await CREDENTIAL.get_token("https://cognitiveservices.azure.com/.default")
    return token.token


def get_realtime_url() -> str:
    """Construct the Azure OpenAI Realtime WebSocket URL."""
    if not AZURE_OPENAI_ENDPOINT or not AZURE_OPENAI_DEPLOYMENT:
        raise RuntimeError("Azure OpenAI endpoint and deployment must be configured")
    
    # Remove trailing slash if present
    endpoint = AZURE_OPENAI_ENDPOINT.rstrip("/")
    # Remove https:// prefix for WebSocket URL
    host = endpoint.replace("https://", "").replace("http://", "")
    
    return f"wss://{host}/openai/realtime?api-version={API_VERSION}&deployment={AZURE_OPENAI_DEPLOYMENT}"


async def health_handler(request: web.Request) -> web.Response:
    """Health check endpoint."""
    health_status = {
        "status": "healthy",
        "azure_openai_endpoint": AZURE_OPENAI_ENDPOINT is not None,
        "azure_openai_deployment": AZURE_OPENAI_DEPLOYMENT is not None,
        "credential_initialized": CREDENTIAL is not None,
    }
    
    # Try to verify credentials work
    try:
        if CREDENTIAL:
            await get_access_token()
            health_status["credential_valid"] = True
    except Exception as e:
        health_status["credential_valid"] = False
        health_status["credential_error"] = str(e)
    
    status_code = 200 if health_status.get("credential_valid") else 503
    return web.json_response(health_status, status=status_code)


async def realtime_websocket_handler(request: web.Request) -> web.WebSocketResponse:
    """
    WebSocket proxy handler for Azure OpenAI Realtime API.
    
    Proxies WebSocket messages between the client and Azure OpenAI,
    handling authentication via DefaultAzureCredential.
    """
    ws_client = web.WebSocketResponse()
    await ws_client.prepare(request)
    
    logger.info("Client WebSocket connection established")
    
    try:
        # Get access token
        access_token = await get_access_token()
        realtime_url = get_realtime_url()
        
        logger.info(f"Connecting to Azure OpenAI Realtime: {realtime_url}")
        
        # Connect to Azure OpenAI
        async with aiohttp.ClientSession() as session:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            async with session.ws_connect(realtime_url, headers=headers) as ws_azure:
                logger.info("Connected to Azure OpenAI Realtime API")
                
                # Create tasks for bidirectional message passing
                async def forward_to_azure():
                    """Forward messages from client to Azure OpenAI."""
                    try:
                        async for msg in ws_client:
                            if msg.type == WSMsgType.TEXT:
                                logger.info(f"Client -> Azure: {msg.data[:200]}...")
                                await ws_azure.send_str(msg.data)
                            elif msg.type == WSMsgType.BINARY:
                                logger.info(f"Client -> Azure: [binary {len(msg.data)} bytes]")
                                await ws_azure.send_bytes(msg.data)
                            elif msg.type == WSMsgType.CLOSE:
                                logger.info("Client sent CLOSE")
                                await ws_azure.close()
                                break
                            elif msg.type == WSMsgType.ERROR:
                                logger.error(f"Client WebSocket error: {ws_client.exception()}")
                                break
                    except Exception as e:
                        logger.error(f"Error forwarding to Azure: {e}")
                
                async def forward_to_client():
                    """Forward messages from Azure OpenAI to client."""
                    try:
                        async for msg in ws_azure:
                            if msg.type == WSMsgType.TEXT:
                                logger.info(f"Azure -> Client: {msg.data[:200]}...")
                                await ws_client.send_str(msg.data)
                            elif msg.type == WSMsgType.BINARY:
                                logger.info(f"Azure -> Client: [binary {len(msg.data)} bytes]")
                                await ws_client.send_bytes(msg.data)
                            elif msg.type == WSMsgType.CLOSE:
                                logger.info(f"Azure sent CLOSE: code={msg.data}, extra={msg.extra}")
                                await ws_client.close()
                                break
                            elif msg.type == WSMsgType.ERROR:
                                logger.error(f"Azure WebSocket error: {ws_azure.exception()}")
                                break
                    except Exception as e:
                        logger.error(f"Error forwarding to client: {e}")
                
                # Run both forwarding tasks concurrently
                await asyncio.gather(
                    forward_to_azure(),
                    forward_to_client(),
                    return_exceptions=True
                )
    
    except aiohttp.ClientError as e:
        logger.error(f"Failed to connect to Azure OpenAI: {e}")
        await ws_client.close(code=1011, message=b"Failed to connect to Azure OpenAI")
    except Exception as e:
        logger.error(f"WebSocket proxy error: {e}")
        await ws_client.close(code=1011, message=str(e).encode())
    finally:
        logger.info("Client WebSocket connection closed")
    
    return ws_client


async def cors_middleware(app: web.Application, handler):
    """CORS middleware for development."""
    async def middleware_handler(request: web.Request) -> web.StreamResponse:
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = web.Response()
        else:
            response = await handler(request)
        
        # Add CORS headers
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        
        return response
    
    return middleware_handler


async def on_startup(app: web.Application):
    """Initialize resources on startup."""
    global CREDENTIAL, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT
    
    # Load environment variables
    load_env()
    
    AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    
    if not AZURE_OPENAI_ENDPOINT:
        logger.warning("AZURE_OPENAI_ENDPOINT not set - /api/realtime will not work")
    if not AZURE_OPENAI_DEPLOYMENT:
        logger.warning("AZURE_OPENAI_DEPLOYMENT not set - /api/realtime will not work")
    
    # Initialize credential
    CREDENTIAL = DefaultAzureCredential()
    logger.info("DefaultAzureCredential initialized")
    
    # Log configuration
    logger.info(f"Azure OpenAI Endpoint: {AZURE_OPENAI_ENDPOINT}")
    logger.info(f"Azure OpenAI Deployment: {AZURE_OPENAI_DEPLOYMENT}")


async def on_cleanup(app: web.Application):
    """Cleanup resources on shutdown."""
    global CREDENTIAL
    if CREDENTIAL:
        await CREDENTIAL.close()
        CREDENTIAL = None


def create_app() -> web.Application:
    """Create and configure the aiohttp application."""
    app = web.Application(middlewares=[cors_middleware])
    
    # Register lifecycle handlers
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    
    # Register routes
    app.router.add_get("/api/health", health_handler)
    app.router.add_get("/api/realtime", realtime_websocket_handler)
    
    return app


def main():
    """Run the server."""
    port = int(os.getenv("PORT", "8000"))
    app = create_app()
    
    logger.info(f"Starting server on http://0.0.0.0:{port}")
    logger.info("Endpoints:")
    logger.info(f"  - Health check: http://localhost:{port}/api/health")
    logger.info(f"  - WebSocket proxy: ws://localhost:{port}/api/realtime")
    
    web.run_app(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
