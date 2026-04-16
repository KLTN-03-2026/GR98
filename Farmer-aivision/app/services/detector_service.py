"""YOLOv8 detection service — lazy-loaded singleton."""
from __future__ import annotations

import json
import time
from pathlib import Path

from ultralytics import YOLO

from app.core.config import get_settings
from app.core.exceptions import DetectionError, ModelLoadError
from app.core.logging import get_logger

logger = get_logger(__name__)

# ── label map: detection class_key → {en, vi} ────────────────────────────────
_DETECTION_LABELS: dict[str, dict[str, str]] = {
    "Healthy_leaf": {
        "en": "Healthy leaf",
        "vi": "Lá khỏe mạnh",
    },
    "Leaf_Blight": {
        "en": "Leaf blight",
        "vi": "Bệnh cháy mép lá",
    },
    "Leaf_Phytophthora": {
        "en": "Phytophthora leaf disease",
        "vi": "Bệnh Phytophthora trên lá",
    },
    "Leaf_Spot": {
        "en": "Leaf spot",
        "vi": "Bệnh đốm lá",
    },
    "leaf_blight_anthracnose": {
        "en": "Anthracnose (leaf blight)",
        "vi": "Bệnh thán thư (cháy lá)",
    },
    "leaf_blight_phyllosticta": {
        "en": "Phyllosticta leaf blight",
        "vi": "Bệnh cháy lá do nấm Phyllosticta",
    },
    "leaf_blight_rhizoctonia": {
        "en": "Rhizoctonia leaf blight",
        "vi": "Bệnh cháy lá do nấm Rhizoctonia",
    },
    "leaf_spot_algal": {
        "en": "Algal leaf spot",
        "vi": "Bệnh đốm rong trên lá",
    },
    "leaf_spot_pseudocercospora": {
        "en": "Pseudocercospora leaf spot",
        "vi": "Bệnh đốm lá do nấm Pseudocercospora",
    },
}


class DetectorService:
    """Lazy-loaded YOLOv8 detector. Thread-safe via singleton."""

    def __init__(self) -> None:
        self._model: YOLO | None = None
        self._class_names: list[str] = []
        self._device: str = "cpu"
        self._settings = get_settings()

    # ── public ────────────────────────────────────────────────────────────────

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def device(self) -> str:
        return self._device

    @property
    def model_display_name(self) -> str:
        return "yolov8n-durian-leaf"

    @property
    def class_names(self) -> list[str]:
        return list(self._class_names)

    # ── internal ──────────────────────────────────────────────────────────────

    def _ensure_loaded(self) -> None:
        if self._model is not None:
            return

        settings = self._settings
        model_path = Path(settings.detector_model_path)
        meta_path = Path(settings.detector_labels_path)

        if not model_path.is_file():
            raise ModelLoadError(
                detail=(
                    f"YOLO detector weights not found at {model_path}. "
                    "Run scripts/train_yolo_detection.py first."
                )
            )

        # Load class names from sidecar JSON if available, else use default
        if meta_path.is_file():
            try:
                meta = json.loads(meta_path.read_text(encoding="utf-8"))
                self._class_names = meta.get("names", [])
            except Exception as exc:
                logger.warning("Could not parse %s: %s — using default names", meta_path, exc)
                self._class_names = list(_DETECTION_LABELS.keys())
        else:
            self._class_names = list(_DETECTION_LABELS.keys())

        if not self._class_names:
            raise ModelLoadError("Detector has no class names in metadata.")

        self._device = settings.device
        device_arg = self._device

        try:
            self._model = YOLO(str(model_path))
            if device_arg == "cpu" or not _gpu_available():
                self._model.to("cpu")
            else:
                self._model.to(device_arg)
            logger.info(
                "Detector loaded: path=%s classes=%d device=%s",
                model_path,
                len(self._class_names),
                device_arg,
            )
        except Exception as exc:
            raise ModelLoadError(detail=f"Failed to load YOLO model: {exc}") from exc

    def _resolve_label(self, class_key: str) -> tuple[str, str]:
        entry = _DETECTION_LABELS.get(class_key, {})
        return entry.get("en", class_key), entry.get("vi", class_key)

    # ── inference ─────────────────────────────────────────────────────────────

    def detect(self, image_path: str | Path):
        """
        Run detection on an image file.

        Returns
        -------
        list[dict]
            Each dict has keys: class_id, class_key, label_en, label_vi,
            confidence, x_min, y_min, x_max, y_max, x1, y1, x2, y2
        """
        self._ensure_loaded()
        assert self._model is not None

        try:
            results = self._model.predict(
                str(image_path),
                verbose=False,
                imgsz=640,
                conf=0.25,
                iou=0.45,
            )
        except Exception as exc:
            logger.exception("YOLO predict failed")
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

            # xyxy in pixels
            x1, y1, x2, y2 = box.xyxy[0].tolist()

            class_key = self._class_names[cls_id] if cls_id < len(self._class_names) else str(cls_id)
            label_en, label_vi = self._resolve_label(class_key)

            detections.append({
                "class_id": cls_id,
                "class_key": class_key,
                "label_en": label_en,
                "label_vi": label_vi,
                "confidence": conf,
                # normalized bbox (0-1)
                "x_min": x1 / img_w,
                "y_min": y1 / img_h,
                "x_max": x2 / img_w,
                "y_max": y2 / img_h,
                # absolute pixel bbox
                "x1": int(round(x1)),
                "y1": int(round(y1)),
                "x2": int(round(x2)),
                "y2": int(round(y2)),
                # original image dimensions
                "_img_w": int(img_w),
                "_img_h": int(img_h),
            })

        return detections

    def detect_timed(self, image_path: str | Path):
        """Like detect() but returns (detections, elapsed_ms)."""
        t0 = time.perf_counter()
        dets = self.detect(image_path)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return dets, elapsed_ms


# ── module-level singleton ────────────────────────────────────────────────────

_detector: DetectorService | None = None


def get_detector_service() -> DetectorService:
    global _detector
    if _detector is None:
        _detector = DetectorService()
    return _detector


def _gpu_available() -> bool:
    import torch
    return torch.cuda.is_available()
