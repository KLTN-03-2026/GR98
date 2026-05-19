"""YOLOv8 detection service — multi-crop, lazy-loaded per crop type."""
from __future__ import annotations

import json
import time
from pathlib import Path

from ultralytics import YOLO

from app.core.config import get_settings
from app.core.exceptions import DetectionError, ModelLoadError
from app.core.logging import get_logger
from app.services.crop_registry import CropConfig, get_crop_config

logger = get_logger(__name__)


# Label map mặc định cho durian (legacy). Coffee dùng class names raw từ JSON.
_DURIAN_LABELS: dict[str, dict[str, str]] = {
    "Healthy_leaf":              {"en": "Healthy leaf", "vi": "Lá khỏe mạnh"},
    "Leaf_Blight":               {"en": "Leaf blight", "vi": "Bệnh cháy mép lá"},
    "Leaf_Phytophthora":         {"en": "Phytophthora leaf disease", "vi": "Bệnh Phytophthora trên lá"},
    "Leaf_Spot":                 {"en": "Leaf spot", "vi": "Bệnh đốm lá"},
    "leaf_blight_anthracnose":   {"en": "Anthracnose (leaf blight)", "vi": "Bệnh thán thư (cháy lá)"},
    "leaf_blight_phyllosticta":  {"en": "Phyllosticta leaf blight", "vi": "Bệnh cháy lá do nấm Phyllosticta"},
    "leaf_blight_rhizoctonia":   {"en": "Rhizoctonia leaf blight", "vi": "Bệnh cháy lá do nấm Rhizoctonia"},
    "leaf_spot_algal":           {"en": "Algal leaf spot", "vi": "Bệnh đốm rong trên lá"},
    "leaf_spot_pseudocercospora": {"en": "Pseudocercospora leaf spot", "vi": "Bệnh đốm lá do nấm Pseudocercospora"},
}

_COFFEE_LABELS: dict[str, dict[str, str]] = {
    "healthy":          {"en": "Healthy", "vi": "Lá khỏe mạnh"},
    "leaf_rust":        {"en": "Coffee Leaf Rust", "vi": "Bệnh rỉ sắt"},
    "red_spider_mite":  {"en": "Red Spider Mite", "vi": "Nhện đỏ"},
    "malnutrition":     {"en": "Malnutrition", "vi": "Thiếu dinh dưỡng"},
    "pest":             {"en": "Pest damage", "vi": "Sâu hại"},
}


class _LoadedDetector:
    """Một instance YOLO đã load + class names cho 1 crop cụ thể."""
    def __init__(self, model: YOLO, class_names: list[str], crop_type: str):
        self.model = model
        self.class_names = class_names
        self.crop_type = crop_type


class DetectorService:
    """Quản lý nhiều YOLO model — mỗi crop type 1 model. Lazy-load per crop."""

    def __init__(self) -> None:
        self._models: dict[str, _LoadedDetector] = {}
        self._settings = get_settings()

    @property
    def device(self) -> str:
        return self._settings.device

    @property
    def model_display_name(self) -> str:
        return "yolov8-multi-crop"

    def _resolve_label(self, crop_type: str, class_key: str) -> tuple[str, str]:
        if crop_type == "sau-rieng":
            entry = _DURIAN_LABELS.get(class_key, {})
        else:
            entry = _COFFEE_LABELS.get(class_key, {})
        return entry.get("en", class_key), entry.get("vi", class_key)

    def _get_or_load(self, crop_type: str) -> _LoadedDetector:
        if crop_type in self._models:
            return self._models[crop_type]

        cfg: CropConfig = get_crop_config(crop_type)
        if not cfg.detector_pt.is_file():
            raise ModelLoadError(
                detail=f"YOLO weights not found for {cfg.display_name}: {cfg.detector_pt}"
            )

        # Load class names from metadata JSON
        class_names: list[str] = []
        if cfg.detector_json.is_file():
            try:
                meta = json.loads(cfg.detector_json.read_text(encoding="utf-8"))
                class_names = meta.get("names", [])
            except Exception as exc:
                logger.warning("Could not parse %s: %s", cfg.detector_json, exc)
        if not class_names:
            # Fallback to predefined labels
            if crop_type == "sau-rieng":
                class_names = list(_DURIAN_LABELS.keys())
            else:
                class_names = list(_COFFEE_LABELS.keys())

        device_arg = self._settings.device
        try:
            model = YOLO(str(cfg.detector_pt))
            if device_arg == "cpu" or not _gpu_available():
                model.to("cpu")
            else:
                model.to(device_arg)
            logger.info(
                "Detector loaded: crop=%s path=%s classes=%d device=%s",
                cfg.crop_type, cfg.detector_pt, len(class_names), device_arg,
            )
        except Exception as exc:
            raise ModelLoadError(detail=f"Failed to load YOLO for {cfg.display_name}: {exc}") from exc

        loaded = _LoadedDetector(model=model, class_names=class_names, crop_type=cfg.crop_type)
        self._models[cfg.crop_type] = loaded
        return loaded

    def detect(self, image_path: str | Path, crop_type: str | None = None):
        """
        Run detection. crop_type chọn model phù hợp.
        Returns list[dict] each with class_id, class_key, label_en, label_vi,
        confidence, x_min, y_min, x_max, y_max, x1..y2.
        """
        loaded = self._get_or_load(crop_type or "ca-phe")

        try:
            results = loaded.model.predict(
                str(image_path),
                verbose=False,
                imgsz=640,
                conf=0.25,
                iou=0.45,
            )
        except Exception as exc:
            logger.exception("YOLO predict failed for crop=%s", loaded.crop_type)
            raise DetectionError(detail=f"Detection inference failed: {exc}") from exc

        if not results:
            return []
        result = results[0]
        boxes = result.boxes
        if boxes is None or len(boxes) == 0:
            return []

        img_w = float(result.orig_shape[1])
        img_h = float(result.orig_shape[0])

        detections = []
        for box in boxes:
            cls_id = int(box.cls.item())
            conf = float(box.conf.item())
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            class_key = (
                loaded.class_names[cls_id]
                if cls_id < len(loaded.class_names)
                else str(cls_id)
            )
            label_en, label_vi = self._resolve_label(loaded.crop_type, class_key)

            detections.append({
                "class_id": cls_id,
                "class_key": class_key,
                "label_en": label_en,
                "label_vi": label_vi,
                "confidence": conf,
                "x_min": x1 / img_w,
                "y_min": y1 / img_h,
                "x_max": x2 / img_w,
                "y_max": y2 / img_h,
                "x1": int(round(x1)),
                "y1": int(round(y1)),
                "x2": int(round(x2)),
                "y2": int(round(y2)),
                "_img_w": int(img_w),
                "_img_h": int(img_h),
            })

        return detections

    def detect_timed(self, image_path: str | Path, crop_type: str | None = None):
        """Like detect() but returns (detections, elapsed_ms)."""
        t0 = time.perf_counter()
        dets = self.detect(image_path, crop_type=crop_type)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return dets, elapsed_ms


_detector: DetectorService | None = None


def get_detector_service() -> DetectorService:
    global _detector
    if _detector is None:
        _detector = DetectorService()
    return _detector


def _gpu_available() -> bool:
    import torch
    return torch.cuda.is_available()
