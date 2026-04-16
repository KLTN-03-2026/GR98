"""Schemas for image classification responses."""
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class ClassifyImageResponse(BaseModel):
    """Single-image disease classification result."""

    class_key: str = Field(..., description="Dataset folder name (e.g. Leaf_Algal)")
    label_en: str = Field(..., description="Disease name in English")
    label_vi: str = Field(..., description="Tên bệnh tiếng Việt")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Softmax confidence for predicted class")
    model: str = Field(..., description="Classifier architecture label")
    device: str = Field(..., description="cpu / cuda / mps")
    inference_time_ms: float = Field(..., ge=0, description="Inference time in milliseconds")
    image_width: int | None = Field(None, description="Image width in pixels")
    image_height: int | None = Field(None, description="Image height in pixels")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
