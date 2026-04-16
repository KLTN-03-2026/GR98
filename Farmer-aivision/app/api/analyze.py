"""
Unified analysis endpoint — friendly disease info response.
Run YOLO detection → enrich with knowledge base → return DiseaseInfo.
"""
import time
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, UploadFile

from app.core.config import get_settings
from app.core.exceptions import FileTooLargeError, UnsupportedFileTypeError
from app.core.logging import get_logger
from app.schemas.analysis import AnalyzeResponse
from app.services.analysis_service import analyze

logger = get_logger(__name__)
router = APIRouter(prefix="/analyze", tags=["Phân tích"])

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
    suffix = Path(upload_file.filename or "upload").suffix.lower()
    if not suffix:
        suffix = ".jpg"
    tmp_path = settings.upload_dir / f"{time.time_ns()}{suffix}"
    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(content)
    return tmp_path


@router.post(
    "/image",
    response_model=AnalyzeResponse,
    summary="Phân tích bệnh lá sầu riêng",
    responses={
        200: {
            "description": "Thông tin bệnh được phát hiện kèm hướng điều trị",
            "content": {
                "application/json": {
                    "example": {
                        "benh": {
                            "disease": "Leaf Blight",
                            "benh": "Bệnh cháy mép lá",
                            "tac_nhan": "Phytophthora palmivora (nấm)",
                            "do_nguy_hiem": "Cao",
                            "xuc_tac": "Phytophthora palmivora, Pythium sp.",
                            "dieu_tri": "Metalaxyl 8WP (2-3 g/l), Fosetyl-Al (Aliette) 80WP (3-4 g/l), Copper-based fungicide (Bordeaux 1%). Phun 2-3 lần cách nhau 7-10 ngày.",
                            "phan_loai": "fungal",
                            "chi_tiet": "Mép lá khô nâu, lan dần vào phiến lá. Bệnh phát triển mạnh trong điều kiện ẩm ướt, mưa nhiều.",
                            "do_chinh_xac": 0.8712,
                        },
                        "thoi_gian_xu_ly_ms": 318.45,
                        "timestamp": "2026-04-07T19:45:00Z",
                    }
                }
            },
        },
    },
)
async def analyze_image(
    file: UploadFile = File(..., description="Ảnh lá sầu riêng (JPEG, PNG, WebP)"),
) -> AnalyzeResponse:
    """
    Upload ảnh lá sầu riêng → nhận về thông tin bệnh + thuốc điều trị.

    **Response gồm:**
    - `disease` — tên tiếng Anh
    - `benh` — tên tiếng Việt
    - `tac_nhan` — tác nhân gây bệnh
    - `do_nguy_hiem` — mức độ nguy hiểm
    - `xuc_tac` — chi tiết loài vi sinh
    - `dieu_tri` — thuốc + cách xử lý
    - `phan_loai` — loại bệnh (fungal / bacterial / viral / algal / healthy)
    - `chi_tiet` — mô tả triệu chứng
    - `do_chinh_xac` — độ chính xác model (0-1)
    """
    ext = Path(file.filename or "").suffix.lower()
    if file.content_type not in ALLOWED_IMAGE_TYPES and ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise UnsupportedFileTypeError(detail="Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP.")

    tmp_path = await _save_upload(file, MAX_IMAGE_SIZE_MB)
    try:
        return analyze(str(tmp_path))
    finally:
        tmp_path.unlink(missing_ok=True)
