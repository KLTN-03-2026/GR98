"""Unified analysis: detection → knowledge base → friendly response."""
from __future__ import annotations

import time
from pathlib import Path

from PIL import Image

from app.core.logging import get_logger
from app.schemas.analysis import AnalyzeResponse, DiseaseInfo
from app.services.disease_knowledge import get_disease_info
from app.services.detector_service import get_detector_service

logger = get_logger(__name__)

# Confidence threshold: ignore boxes below this
_MIN_CONFIDENCE = 0.25


def analyze(image_path: str | Path) -> AnalyzeResponse:
    """
    Full pipeline:
      1. Run YOLO detection on the image
      2. Pick the highest-confidence detection above _MIN_CONFIDENCE
      3. Enrich with knowledge base (disease name VI/EN, pathogen, treatment…)
      4. Return friendly DiseaseInfo
    """
    t0 = time.perf_counter()
    img_path = Path(image_path)
    img = Image.open(img_path).convert("RGB")

    class_key: str = "Healthy_leaf"
    confidence: float = 0.0

    try:
        det = get_detector_service()
        detections, _ = det.detect_timed(str(img_path))

        # Keep only boxes above confidence threshold
        above_thresh = [d for d in detections if d["confidence"] >= _MIN_CONFIDENCE]
        if above_thresh:
            best = max(above_thresh, key=lambda d: d["confidence"])
            class_key = best["class_key"]
            confidence = best["confidence"]
        else:
            logger.info("No detections above confidence %.2f — marking as healthy", _MIN_CONFIDENCE)

    except Exception as exc:
        logger.warning("Detection failed: %s — marking as healthy", exc)

    info = get_disease_info(class_key)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    return AnalyzeResponse(
        benh=DiseaseInfo(
            disease=info["disease"],
            benh=info["benh"],
            tac_nhan=info["tac_nhan"],
            do_nguy_hiem=info["do_nguy_hiem"],
            xuc_tac=info["xuc_tac"],
            dieu_tri=info["dieu_tri"],
            phan_loai=info["phan_loai"],
            chi_tiet=info["chi_tiet"],
            do_chinh_xac=round(confidence, 4),
        ),
        thoi_gian_xu_ly_ms=round(elapsed_ms, 2),
    )
