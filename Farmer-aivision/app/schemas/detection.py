"""Schemas for YOLO object detection responses."""
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    """Normalized bounding box coordinates (0-1 range)."""

    x_min: float = Field(..., ge=0.0, le=1.0, description="Left edge")
    y_min: float = Field(..., ge=0.0, le=1.0, description="Top edge")
    x_max: float = Field(..., ge=0.0, le=1.0, description="Right edge")
    y_max: float = Field(..., ge=0.0, le=1.0, description="Bottom edge")

    @property
    def width(self) -> float:
        return self.x_max - self.x_min

    @property
    def height(self) -> float:
        return self.y_max - self.y_min

    @property
    def area_normalized(self) -> float:
        return self.width * self.height


class DetectionResult(BaseModel):
    """Single detected object."""

    class_id: int = Field(..., description="Internal class index")
    class_key: str = Field(..., description="Class name/key (e.g. Leaf_Blight)")
    label_en: str = Field(..., description="Disease name in English")
    label_vi: str = Field(..., description="Tên bệnh tiếng Việt")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bbox: BoundingBox = Field(..., description="Normalized bounding box (0-1 range)")
    bbox_pixel: dict[str, int] = Field(
        ..., description="Bounding box in absolute pixels (x1, y1, x2, y2)"
    )


class DetectImageResponse(BaseModel):
    """Full detection result for a single image."""

    detections: list[DetectionResult] = Field(
        ..., description="List of detected objects (empty if none found)"
    )
    count: int = Field(..., ge=0, description="Number of detections in this image")
    model: str = Field(..., description="Detector identifier (yolov8n-durian-leaf)")
    device: str = Field(..., description="cpu / cuda / mps")
    inference_time_ms: float = Field(..., ge=0, description="Inference time in milliseconds")
    image_width: int | None = Field(None, description="Image width in pixels")
    image_height: int | None = Field(None, description="Image height in pixels")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
