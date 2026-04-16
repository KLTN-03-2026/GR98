"""Detection API — single image → bounding-box disease detections (YOLOv8)."""
import time
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, UploadFile
from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import FileTooLargeError, UnsupportedFileTypeError
from app.core.logging import get_logger
from app.schemas.detection import (
    BoundingBox,
    DetectImageResponse,
    DetectionResult,
)
from app.services import get_detector_service

logger = get_logger(__name__)
router = APIRouter(prefix="/detect", tags=["Detection"])

MAX_IMAGE_SIZE_MB = 20
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _save_upload(upload_file: UploadFile, max_size_mb: int) -> Path:
    settings = get_settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    content = await upload_file.read()
    size_mb = len(content) / (1024 * 1024)

    if size_mb > max_size_mb:
        raise FileTooLargeError(
            detail=f"File size ({size_mb:.1f} MB) exceeds {max_size_mb} MB limit"
        )

    suffix = Path(upload_file.filename or "upload").suffix
    tmp_path = settings.upload_dir / f"{time.time_ns()}{suffix}"

    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(content)

    return tmp_path


def _validate_image(content_type: str | None, filename: str | None) -> None:
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        ext = Path(filename or "").suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
            raise UnsupportedFileTypeError(
                detail=(
                    f"Content-Type '{content_type}' is not supported. "
                    "Use JPEG, PNG, or WebP."
                )
            )


@router.post("/image", response_model=DetectImageResponse)
async def detect_image(
    file: UploadFile = File(..., description="Leaf image (JPEG, PNG, WebP)"),
) -> DetectImageResponse:
    """
    Detect disease regions with bounding-boxes in a single leaf image.

    Uses YOLOv8 fine-tuned on durian leaf diseases (9 classes).
    Returns normalized (0-1) and absolute-pixel bounding-box coordinates.
    """
    _validate_image(file.content_type, file.filename)

    tmp_path = await _save_upload(file, MAX_IMAGE_SIZE_MB)

    try:
        with Image.open(tmp_path) as image:
            img_w, img_h = image.width, image.height

        detector = get_detector_service()
        detections_raw, inference_ms = detector.detect_timed(str(tmp_path))

        detection_results: list[DetectionResult] = []
        for d in detections_raw:
            detection_results.append(
                DetectionResult(
                    class_id=d["class_id"],
                    class_key=d["class_key"],
                    label_en=d["label_en"],
                    label_vi=d["label_vi"],
                    confidence=round(d["confidence"], 6),
                    bbox=BoundingBox(
                        x_min=round(d["x_min"], 6),
                        y_min=round(d["y_min"], 6),
                        x_max=round(d["x_max"], 6),
                        y_max=round(d["y_max"], 6),
                    ),
                    bbox_pixel={
                        "x1": d["x1"],
                        "y1": d["y1"],
                        "x2": d["x2"],
                        "y2": d["y2"],
                    },
                )
            )

        return DetectImageResponse(
            detections=detection_results,
            count=len(detection_results),
            model=detector.model_display_name,
            device=detector.device,
            inference_time_ms=round(inference_ms, 2),
            image_width=img_w,
            image_height=img_h,
        )
    finally:
        tmp_path.unlink(missing_ok=True)
