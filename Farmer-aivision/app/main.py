"""FastAPI application entry point — wires together all routes, middleware, and lifecycle."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analyze_router, classify_router, detect_router, health_router
from app.core import get_settings, setup_logging


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: setup on startup, cleanup on shutdown."""
    setup_logging()
    settings = get_settings()

    # Ensure directories exist
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    settings.classifier_model_path.parent.mkdir(parents=True, exist_ok=True)

    yield

    # (Cleanup temporary files here if desired)


settings = get_settings()

app = FastAPI(
    title="Agri Integrator — Plant Disease AI Service",
    description=(
        "ResNet image classification and YOLOv8 object detection for durian leaf diseases "
        "(EN + VI labels + confidence). Integrates with the Agri Integrator backend."
    ),
    version="1.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────────────

app.include_router(health_router)
app.include_router(analyze_router)


@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    return {
        "service": "Agri Integrator AI Service",
        "version": "1.1.0",
        "docs": "/docs",
    }
