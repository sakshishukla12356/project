"""
main.py
FastAPI application entry point for the Multi-Cloud Dashboard.
"""
from dotenv import load_dotenv
load_dotenv()

import logging
import sys
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.responses import JSONResponse

from config.settings import get_settings
from database.base import init_db
from routers import auth, aws, azure, gcp, carbon, dashboard, chatbot, cloud_actions, cloud_account, security, energy_efficiency, sustainability, telemetry, optimization, realtime
from middleware.security_monitor import SecurityMonitorMiddleware
from middleware.rate_limit import RateLimitMiddleware



structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)
logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logger = structlog.get_logger()

settings = get_settings()




@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", message="Initialising database …")
    await init_db()
    logger.info("startup", message="Database ready.")
    yield
    logger.info("shutdown", message="Goodbye.")




app = FastAPI(
    title="Multi-Cloud Dashboard API",
    description=(
        "Production-ready REST API for multi-cloud cost, resource usage, "
        "and carbon emission tracking across AWS, Azure, and GCP."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── Transport Security & CORS ───────────────────────────────────────────────

if settings.REQUIRE_HTTPS:
    app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=[h.strip() for h in settings.ALLOWED_HOSTS.split(",")]
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL.rstrip("/"),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://localhost:3000",
        "https://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Security & Rate Limiting ────────────────────────────────────────────────

app.add_middleware(SecurityMonitorMiddleware)
app.add_middleware(RateLimitMiddleware)



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )




app.include_router(auth.router)
app.include_router(aws.router)
app.include_router(azure.router)
app.include_router(gcp.router)
app.include_router(carbon.router)
app.include_router(dashboard.router)


# AI Chatbot router
app.include_router(chatbot.router, prefix="/ai", tags=["AI Chatbot"])
app.include_router(cloud_actions.router, prefix="/cloud", tags=["Cloud Actions"])
app.include_router(cloud_account.router, prefix="/cloud-account", tags=["Cloud Account"])
app.include_router(security.router, prefix="/security", tags=["Security Dashboard"])
app.include_router(energy_efficiency.router, prefix="/api", tags=["Energy Efficiency"])
app.include_router(sustainability.router, prefix="/api", tags=["Sustainability"])
app.include_router(telemetry.router)
app.include_router(optimization.router)
app.include_router(realtime.router)




@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "1.0.0", "environment": settings.APP_ENV}


@app.get("/", tags=["Health"])
async def root():
    return {
        "message": "Multi-Cloud Dashboard API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "ai_chat": "/ai/chat",
    }

