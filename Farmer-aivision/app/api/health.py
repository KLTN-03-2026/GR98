"""Health check and model listing endpoints."""
from pathlib import Path

from fastapi import APIRouter

from app.core.config import get_settings
from app.core.logging import get_logger
from app.schemas import HealthResponse, ModelInfo, ModelsListResponse
from app.services import get_classifier_service, gpu_available

logger = get_logger(__name__)
router = APIRouter(tags=["System"])

CLASSIFIER_MODELS: list[ModelInfo] = [
    ModelInfo(
        name="resnet18-durian-leaf",
        description="ResNet18 fine-tuned on folder-organized durian leaf images (6-class classification).",
        size_mb=45.0,
    ),
]
DETECTOR_MODELS: list[ModelInfo] = [
    ModelInfo(
        name="yolov8n-durian-leaf",
        description="YOLOv8nano fine-tuned on durian leaf diseases (9-class detection with bounding boxes).",
        size_mb=6.3,
    ),
]
ALL_MODELS = CLASSIFIER_MODELS + DETECTOR_MODELS


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Return service health; weights files present => models can be loaded on first inference."""
    settings = get_settings()
    clf = get_classifier_service()
    weights_ok = Path(settings.classifier_model_path).is_file()
    return HealthResponse(
        status="healthy",
        model_loaded=weights_ok,
        model_name=clf.model_display_name,
        device=clf.device,
        gpu_available=gpu_available(),
        version="1.1.0",
    )


@router.get("/models", response_model=ModelsListResponse)
async def list_models() -> ModelsListResponse:
    """List all models available in the service."""
    return ModelsListResponse(models=ALL_MODELS)
