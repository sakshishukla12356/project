"""
main.py
FastAPI application entry point for the Multi-Cloud Dashboard.
"""
import logging
import sys
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.settings import get_settings
from database.base import init_db
from routers import auth, aws, azure, gcp, carbon, dashboard

# ─── Logging ─────────────────────────────────────────────────────────────────

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


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("startup", message="Initialising database …")
    await init_db()
    logger.info("startup", message="Database ready.")
    yield
    logger.info("shutdown", message="Goodbye.")


# ─── App ─────────────────────────────────────────────────────────────────────

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

# ─── CORS ────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.APP_ENV == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global exception handler ────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


# ─── Routers ─────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(aws.router)
app.include_router(azure.router)
app.include_router(gcp.router)
app.include_router(carbon.router)
app.include_router(dashboard.router)


# ─── Health check ────────────────────────────────────────────────────────────

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
    }