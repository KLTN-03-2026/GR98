"""API routes module."""
from app.api.analyze import router as analyze_router
from app.api.classify import router as classify_router
from app.api.detect import router as detect_router
from app.api.health import router as health_router

__all__ = ["analyze_router", "classify_router", "detect_router", "health_router"]
