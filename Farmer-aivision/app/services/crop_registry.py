"""Central config cho dual-crop AI Vision.

Mỗi crop type (sầu riêng / cà phê) có bộ weights + KB riêng. Các service
dùng registry này để biết phải load file nào cho crop nào.

Crop type values KHỚP với plot.cropType từ Farmer-BE:
  - 'sau-rieng' = Sầu riêng (only YOLO, KHÔNG có ResNet/Severity)
  - 'ca-phe'    = Cà phê (YOLO + ResNet disease + ResNet severity)

Default fallback nếu không biết crop type → coffee (vì model coffee mạnh hơn).
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

_ROOT = Path(__file__).resolve().parents[2]
_WEIGHTS = _ROOT / "ai" / "weights"


@dataclass(frozen=True)
class CropConfig:
    crop_type: str
    display_name: str

    # Required
    detector_pt: Path
    detector_json: Path
    diseases_json: Path

    # Optional — nếu None thì pipeline bỏ qua bước đó
    classifier_pt: Optional[Path] = None
    severity_pt: Optional[Path] = None


# ── Registry ─────────────────────────────────────────────────────────────────

_REGISTRY: dict[str, CropConfig] = {
    "sau-rieng": CropConfig(
        crop_type="sau-rieng",
        display_name="Sầu riêng",
        detector_pt=_WEIGHTS / "durian_leaf_detector.pt",
        detector_json=_WEIGHTS / "durian_leaf_detector.json",
        diseases_json=_WEIGHTS / "diseases_durian_backup.json",
        classifier_pt=None,   # chưa train ResNet riêng cho sầu riêng
        severity_pt=None,     # không áp dụng
    ),
    "ca-phe": CropConfig(
        crop_type="ca-phe",
        display_name="Cà phê",
        detector_pt=_WEIGHTS / "coffee_leaf_detector.pt",
        detector_json=_WEIGHTS / "coffee_leaf_detector.json",
        diseases_json=_WEIGHTS / "coffee_diseases.json",
        classifier_pt=_WEIGHTS / "coffee_disease_classifier.pt",
        severity_pt=_WEIGHTS / "coffee_severity_classifier.pt",
    ),
}

DEFAULT_CROP_TYPE = "ca-phe"


def get_crop_config(crop_type: Optional[str]) -> CropConfig:
    """
    Trả về config cho crop_type. Nếu None hoặc không hợp lệ → dùng default (cà phê).
    """
    if crop_type and crop_type in _REGISTRY:
        return _REGISTRY[crop_type]
    return _REGISTRY[DEFAULT_CROP_TYPE]


def list_supported_crops() -> list[str]:
    return list(_REGISTRY.keys())
