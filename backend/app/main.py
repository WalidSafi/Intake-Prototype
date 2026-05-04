"""Application entry point for the FastAPI backend skeleton.

This file intentionally exposes only a health check while the backend
architecture is still being decided.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings


def create_app() -> FastAPI:
    """Build and configure the FastAPI application instance."""
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version=settings.api_version)

    # Allow the Vite frontend to call this API during local development.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        """Simple uptime/version check for local testing and future deploys."""
        return {"status": "ok", "version": settings.api_version}

    return app


# Uvicorn imports this object when running `uvicorn app.main:app`.
app = create_app()
