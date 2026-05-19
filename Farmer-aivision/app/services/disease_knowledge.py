"""Disease KB — multi-crop. Load đúng file diseases JSON theo crop_type."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.core.logging import get_logger
from app.services.crop_registry import get_crop_config

logger = get_logger(__name__)


# Default KB (durian legacy — fallback nếu JSON load fail)
_DURIAN_DEFAULTS: dict[str, dict[str, Any]] = {
    "Healthy_leaf": {
        "disease": "Healthy Leaf",
        "benh": "Lá khỏe mạnh",
        "tac_nhan": "Không có",
        "do_nguy_hiem": "Không",
        "xuc_tac": "Không có",
        "dieu_tri": "Không cần xử lý. Tiếp tục chăm sóc bình thường.",
        "phan_loai": "healthy",
        "chi_tiet": "Cây không có dấu hiệu bệnh. Lá xanh tốt, không có đốm hay tổn thương.",
    },
}

# Fallback chung khi không tìm được class_key
_GENERIC_UNKNOWN = {
    "disease": "Unknown",
    "benh": "Không xác định",
    "tac_nhan": "Không xác định",
    "do_nguy_hiem": "Không rõ",
    "xuc_tac": "Không rõ",
    "dieu_tri": "Liên hệ chuyên gia bảo vệ thực vật để được tư vấn.",
    "phan_loai": "unknown",
    "chi_tiet": "Loại bệnh chưa có thông tin trong cơ sở dữ liệu.",
}


def _load_kb_for_crop(crop_type: str) -> dict[str, dict[str, Any]]:
    cfg = get_crop_config(crop_type)
    path: Path = cfg.diseases_json
    if path.is_file():
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(raw, dict) and raw:
                logger.info("KB loaded for crop=%s from %s (%d entries)",
                            crop_type, path, len(raw))
                return raw
        except Exception as exc:
            logger.warning("Could not parse %s: %s — using defaults", path, exc)
    return dict(_DURIAN_DEFAULTS) if crop_type == "sau-rieng" else {}


# Cache KB per crop type
_KB_CACHE: dict[str, dict[str, dict[str, Any]]] = {}


def _get_kb(crop_type: str) -> dict[str, dict[str, Any]]:
    if crop_type not in _KB_CACHE:
        _KB_CACHE[crop_type] = _load_kb_for_crop(crop_type)
    return _KB_CACHE[crop_type]


def get_disease_info(class_key: str, crop_type: str | None = None) -> dict[str, Any]:
    """
    Lookup disease info trong KB của crop_type.
    Fallback: defaults → generic unknown nếu cả 2 đều miss.
    """
    crop = crop_type or "ca-phe"
    kb = _get_kb(crop)
    info = kb.get(class_key)
    if info:
        return info
    # Try lowercase / capitalize variant
    for k in (class_key.lower(), class_key.capitalize()):
        if k in kb:
            return kb[k]
    # Fallback to durian defaults if durian
    if crop == "sau-rieng" and class_key in _DURIAN_DEFAULTS:
        return _DURIAN_DEFAULTS[class_key]
    # Generic unknown
    result = dict(_GENERIC_UNKNOWN)
    result["chi_tiet"] = f"Loại bệnh '{class_key}' chưa có thông tin trong KB cho {crop}."
    return result


def get_all_class_keys(crop_type: str | None = None) -> list[str]:
    return list(_get_kb(crop_type or "ca-phe").keys())
