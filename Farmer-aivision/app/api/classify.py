"""Classification API — single image → disease label (EN + VI) + confidence."""
import time
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, UploadFile
from PIL import Image

from app.core.config import get_settings
from app.core.exceptions import FileTooLargeError, UnsupportedFileTypeError
from app.core.logging import get_logger
from app.schemas.classification import ClassifyImageResponse
from app.services import get_classifier_service

logger = get_logger(__name__)
router = APIRouter(prefix="/classify", tags=["Classification"])

MAX_IMAGE_SIZE_MB = 20
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}


async def _save_upload(upload_file: UploadFile, max_size_mb: int) -> Path:
    settings = get_settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)

    content = await upload_file.read()
    size_mb = len(content) / (1024 * 1024)

    if size_mb > max_size_mb:
        raise FileTooLargeError(detail=f"File size ({size_mb:.1f} MB) exceeds {max_size_mb} MB limit")

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
                detail=f"Content-Type '{content_type}' is not supported. Use JPEG, PNG, or WebP."
            )


@router.post("/image", response_model=ClassifyImageResponse)
async def classify_image(
    file: UploadFile = File(..., description="Leaf image (JPEG, PNG, WebP)"),
) -> ClassifyImageResponse:
    """
    Classify a single leaf image into one disease class.

    Returns English and Vietnamese labels plus softmax confidence.
    """
    _validate_image(file.content_type, file.filename)

    tmp_path = await _save_upload(file, MAX_IMAGE_SIZE_MB)

    try:
        with Image.open(tmp_path) as image:
            w, h = image.width, image.height
        clf = get_classifier_service()
        class_key, label_en, label_vi, confidence, inference_ms = clf.classify(str(tmp_path))

        return ClassifyImageResponse(
            class_key=class_key,
            label_en=label_en,
            label_vi=label_vi,
            confidence=round(confidence, 6),
            model=clf.model_display_name,
            device=clf.device,
            inference_time_ms=round(inference_ms, 2),
            image_width=w,
            image_height=h,
        )
    finally:
        tmp_path.unlink(missing_ok=True)
