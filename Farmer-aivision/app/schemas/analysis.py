"""Schemas for the unified /analyze endpoint."""
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


class SeverityInfo(BaseModel):
    """Mức độ nặng cho bệnh rust (chỉ trả khi disease == leaf_rust)."""
    level: str = Field(..., description="healthy | rust_level_1..4")
    level_index: int = Field(..., ge=0, le=4, description="0=healthy, 1-4=mức độ nặng")
    label_vi: str = Field(..., description="Mô tả tiếng Việt mức độ")
    do_chinh_xac: float = Field(..., ge=0.0, le=1.0)


class DiseaseInfo(BaseModel):
    """
    Thông tin bệnh thân thiện cho người dùng.
    Được ghép từ kết quả detection + knowledge base (diseases.json).
    """

    disease: str = Field(..., description="Tên bệnh tiếng Anh")
    benh: str = Field(..., description="Tên bệnh tiếng Việt")
    tac_nhan: str = Field(..., description="Tác nhân gây bệnh (vi khuẩn / nấm / virus / tảo)")
    do_nguy_hiem: str = Field(..., description="Mức độ nguy hiểm: Thấp / Trung bình / Cao / Rất cao")
    xuc_tac: str = Field(..., description="Chi tiết loài/công thức vi sinh gây bệnh")
    dieu_tri: str = Field(
        ...,
        description="Hướng dẫn thuốc và cách xử lý cụ thể",
    )
    phan_loai: str = Field(..., description="Phân loại: fungal / bacterial / viral / algal / healthy")
    chi_tiet: str = Field(..., description="Mô tả triệu chứng và điều kiện phát triển")
    do_chinh_xac: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Độ chính xác của model khi phát hiện bệnh này (0.0 - 1.0)",
    )


class AnalyzeResponse(BaseModel):
    """
    Response thân thiện cho người dùng — không có region/bounding box hay metadata.
    """

    benh: DiseaseInfo = Field(..., description="Thông tin bệnh được phát hiện")
    muc_do_nang: Optional[SeverityInfo] = Field(
        None,
        description="Mức độ nặng (chỉ áp dụng cho bệnh rỉ sắt). Null nếu bệnh khác.",
    )
    thoi_gian_xu_ly_ms: float = Field(
        ...,
        ge=0,
        description="Tổng thời gian xử lý (milliseconds)",
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
