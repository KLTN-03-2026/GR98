"""Unified analysis — multi-crop support.

Pipeline phân nhánh theo crop_type:

  sau-rieng (Sầu riêng):
    - Chỉ có YOLO detector → predict class trực tiếp từ YOLO.
    - Không có severity.

  ca-phe (Cà phê) — HYBRID:
    - YOLO detect → optional crop bbox
    - ResNet disease classifier (TRUST cho leaf_rust nếu conf >= 0.30)
    - Sliding window cho các class khác (fix domain shift)
    - Severity classifier khi predict = leaf_rust
"""
from __future__ import annotations

import time
from collections import defaultdict
from pathlib import Path
from typing import Optional

from PIL import Image

from app.core.logging import get_logger
from app.schemas.analysis import AnalyzeResponse, DiseaseInfo, SeverityInfo
from app.services.classifier_service import get_classifier_service
from app.services.crop_registry import get_crop_config
from app.services.detector_service import get_detector_service
from app.services.disease_knowledge import get_disease_info
from app.services.severity_service import get_severity_service

logger = get_logger(__name__)

# YOLO threshold (chỉ dùng để optional localize)
_DETECT_MIN_CONF = 0.20

# Coffee — TRUST full-image cho leaf_rust khi conf >= 0.30
_LEAF_RUST_FULL_IMAGE_TRUST = 0.30

# Coffee per-class threshold cho sliding window
_COFFEE_PER_CLASS_THRESHOLD = {
    "red_spider_mite": 0.95,  # 167 ảnh, test 44% → strict
    "ojo_gallo": 0.80,
    "leaf_rust": 0.30,
    "healthy": 0.60,
    "cercospora": 0.55,
    "miner": 0.55,
    "phoma": 0.55,
    "malnutrition": 0.60,
    "pest": 0.60,
}
_COFFEE_DEFAULT_THRESHOLD = 0.50

# Sliding window config
_SW_CROP_SIZE_RATIOS = [0.5, 0.7, 1.0]
_SW_GRID = 3

# Severity mapping (chỉ cho coffee)
_SEVERITY_VI = {
    "healthy": "Khỏe mạnh / không có triệu chứng rust",
    "rust_level_1": "Nhẹ (đốm nhỏ, <5% diện tích lá)",
    "rust_level_2": "Trung bình (5-15% diện tích, lan rộng)",
    "rust_level_3": "Nặng (15-30%, nhiều đốm liên kết)",
    "rust_level_4": "Rất nặng (>30%, lá vàng, sắp rụng)",
}
_SEVERITY_INDEX = {
    "healthy": 0, "rust_level_1": 1, "rust_level_2": 2,
    "rust_level_3": 3, "rust_level_4": 4,
}


# ── Common helpers ──────────────────────────────────────────────────────────

def _yolo_best_detection(image_path: str | Path, crop_type: str) -> Optional[dict]:
    """Lấy detection có confidence cao nhất từ YOLO."""
    try:
        det = get_detector_service()
        detections, _ = det.detect_timed(str(image_path), crop_type=crop_type)
    except Exception as exc:
        logger.warning("YOLO detect lỗi: %s", exc)
        return None
    above = [d for d in detections if d.get("confidence", 0) >= _DETECT_MIN_CONF]
    if not above:
        return None
    return max(above, key=lambda d: d["confidence"])


def _crop_from_detection(img: Image.Image, det: dict) -> Optional[Image.Image]:
    """Crop ảnh theo bbox của detection."""
    x1 = int(max(0, det.get("x1", 0)))
    y1 = int(max(0, det.get("y1", 0)))
    x2 = int(min(img.width, det.get("x2", img.width)))
    y2 = int(min(img.height, det.get("y2", img.height)))
    if x2 - x1 < 20 or y2 - y1 < 20:
        return None
    return img.crop((x1, y1, x2, y2))


# ── Coffee-specific: sliding window ─────────────────────────────────────────

def _generate_sliding_windows(img: Image.Image) -> list[Image.Image]:
    crops = [img]
    W, H = img.size
    short = min(W, H)
    for ratio in _SW_CROP_SIZE_RATIOS:
        cs = int(short * ratio)
        if cs < 50:
            continue
        if ratio >= 1.0:
            x = (W - cs) // 2
            y = (H - cs) // 2
            crops.append(img.crop((x, y, x + cs, y + cs)))
            continue
        max_x = W - cs
        max_y = H - cs
        for i in range(_SW_GRID):
            for j in range(_SW_GRID):
                x = int(max_x * i / max(1, _SW_GRID - 1)) if _SW_GRID > 1 else max_x // 2
                y = int(max_y * j / max(1, _SW_GRID - 1)) if _SW_GRID > 1 else max_y // 2
                crops.append(img.crop((x, y, x + cs, y + cs)))
    return crops


def _coffee_sliding_window_classify(img: Image.Image) -> tuple[str, float]:
    """Sliding window for coffee. Return (best_class, conf)."""
    clf = get_classifier_service()
    crops = _generate_sliding_windows(img)
    per_class_confs: dict[str, list[float]] = defaultdict(list)
    for c in crops:
        try:
            result = clf.classify(c, crop_type="ca-phe")
            if result is None:
                continue
            cname, _, _, conf, _ = result
            per_class_confs[cname].append(conf)
        except Exception as exc:
            logger.warning("Coffee sliding window classify lỗi: %s", exc)

    scored = {}
    for cname, confs in per_class_confs.items():
        thr = _COFFEE_PER_CLASS_THRESHOLD.get(cname, _COFFEE_DEFAULT_THRESHOLD)
        max_conf = max(confs)
        if max_conf < thr:
            continue
        scored[cname] = {"max_conf": max_conf, "vote_count": len(confs)}

    if not scored:
        return "healthy", 0.5

    diseases = {k: v for k, v in scored.items() if k != "healthy"}
    if diseases:
        best = max(diseases, key=lambda k: diseases[k]["max_conf"])
        return best, diseases[best]["max_conf"]
    return "healthy", scored["healthy"]["max_conf"]


# ── Crop-specific analyze paths ─────────────────────────────────────────────

def _analyze_durian(image_path: str | Path) -> tuple[str, float, Optional[SeverityInfo]]:
    """Durian = chỉ YOLO. Return (class_key, confidence, severity=None)."""
    det = _yolo_best_detection(image_path, crop_type="sau-rieng")
    if det is None:
        logger.info("Durian: không có detection → mặc định Healthy_leaf")
        return "Healthy_leaf", 0.5, None
    return det["class_key"], det["confidence"], None


def _analyze_coffee(image_path: str | Path) -> tuple[str, float, Optional[SeverityInfo]]:
    """Coffee hybrid pipeline với sliding window + severity."""
    img = Image.open(image_path).convert("RGB")

    # YOLO optional crop
    det = _yolo_best_detection(image_path, crop_type="ca-phe")
    base_img = img
    if det is not None:
        cropped = _crop_from_detection(img, det)
        if cropped is not None:
            base_img = cropped
            logger.info("Coffee: YOLO crop %s", cropped.size)

    class_key = "healthy"
    confidence = 0.0

    clf = get_classifier_service()
    full_result = clf.classify(base_img, crop_type="ca-phe")
    if full_result is None:
        # Shouldn't happen — coffee always has classifier
        if det is not None:
            return det["class_key"], det["confidence"], None
        return "healthy", 0.5, None

    c1_name, _, _, c1_conf, _ = full_result
    logger.info("Coffee full-image: %s (%.3f)", c1_name, c1_conf)

    # Trust leaf_rust full-image
    if c1_name == "leaf_rust" and c1_conf >= _LEAF_RUST_FULL_IMAGE_TRUST:
        class_key = c1_name
        confidence = c1_conf
    else:
        sw_name, sw_conf = _coffee_sliding_window_classify(base_img)
        logger.info("Coffee sliding window: %s (%.3f)", sw_name, sw_conf)

        if sw_name == c1_name and sw_name != "healthy":
            class_key, confidence = sw_name, max(sw_conf, c1_conf)
        elif sw_name == "healthy" and c1_name == "healthy":
            class_key, confidence = "healthy", max(sw_conf, c1_conf)
        elif c1_name == "leaf_rust" and c1_conf >= 0.20:
            class_key, confidence = "leaf_rust", c1_conf
        else:
            class_key, confidence = sw_name, sw_conf

    # Severity (chỉ cho leaf_rust)
    severity_info = None
    if class_key == "leaf_rust":
        try:
            sev_svc = get_severity_service()
            sev_result = sev_svc.predict(base_img, crop_type="ca-phe")
            if sev_result is not None:
                sev_name, sev_conf, _ = sev_result
                severity_info = SeverityInfo(
                    level=sev_name,
                    level_index=_SEVERITY_INDEX.get(sev_name, 0),
                    label_vi=_SEVERITY_VI.get(sev_name, sev_name),
                    do_chinh_xac=round(sev_conf, 4),
                )
                logger.info("Coffee severity: %s (%.3f)", sev_name, sev_conf)
        except Exception as exc:
            logger.warning("Severity lỗi: %s", exc)

    return class_key, confidence, severity_info


# ── Main entry point ────────────────────────────────────────────────────────

def analyze(image_path: str | Path, crop_type: str | None = None) -> AnalyzeResponse:
    """
    Phân tích ảnh lá theo crop_type.

    Parameters
    ----------
    image_path: đường dẫn ảnh tạm trên server
    crop_type:  'sau-rieng' | 'ca-phe' (default: 'ca-phe')
    """
    t0 = time.perf_counter()
    crop = crop_type if crop_type in ("sau-rieng", "ca-phe") else "ca-phe"
    cfg = get_crop_config(crop)
    logger.info("Analyze start: crop=%s display=%s", crop, cfg.display_name)

    try:
        if crop == "sau-rieng":
            class_key, confidence, severity = _analyze_durian(image_path)
        else:
            class_key, confidence, severity = _analyze_coffee(image_path)
    except Exception as exc:
        logger.exception("Analyze pipeline lỗi: %s", exc)
        class_key, confidence, severity = ("healthy" if crop == "ca-phe" else "Healthy_leaf"), 0.0, None

    info = get_disease_info(class_key, crop_type=crop)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    return AnalyzeResponse(
        benh=DiseaseInfo(
            disease=info.get("disease", class_key),
            benh=info.get("benh", class_key),
            tac_nhan=info.get("tac_nhan", "Không xác định"),
            do_nguy_hiem=info.get("do_nguy_hiem", "Không rõ"),
            xuc_tac=info.get("xuc_tac", ""),
            dieu_tri=info.get("dieu_tri", ""),
            phan_loai=info.get("phan_loai", "unknown"),
            chi_tiet=info.get("chi_tiet", ""),
            do_chinh_xac=round(confidence, 4),
        ),
        muc_do_nang=severity,
        thoi_gian_xu_ly_ms=round(elapsed_ms, 2),
    )
