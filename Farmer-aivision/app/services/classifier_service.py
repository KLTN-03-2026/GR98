"""ResNet image classifier for durian leaf disease — lazy-loaded."""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms

from app.core.config import get_settings
from app.core.exceptions import InferenceError, ModelLoadError
from app.core.logging import get_logger

logger = get_logger(__name__)


def gpu_available() -> bool:
    return torch.cuda.is_available()


class ClassifierService:
    """Loads checkpoint from train_classification.py and runs inference."""

    def __init__(self) -> None:
        self._model: nn.Module | None = None
        self._class_names: list[str] = []
        self._label_map: dict[str, dict[str, str]] = {}
        self._transform: transforms.Compose | None = None
        self._imgsz: int = 224
        self._settings = get_settings()

    def _ensure_loaded(self) -> None:
        if self._model is not None:
            return

        path = Path(self._settings.classifier_model_path)
        if not path.is_file():
            raise ModelLoadError(
                detail=f"Classifier weights not found: {path}. Run scripts/train_classification.py first."
            )

        labels_path = Path(self._settings.classifier_labels_path)
        if labels_path.is_file():
            self._label_map = json.loads(labels_path.read_text(encoding="utf-8"))
        else:
            logger.warning("class_labels.json missing at %s — using folder names only", labels_path)

        try:
            device = torch.device(self._settings.device)
            ckpt = torch.load(path, map_location=device, weights_only=False)
        except Exception as exc:
            raise ModelLoadError(detail=f"Failed to load checkpoint: {exc}") from exc

        self._class_names = ckpt.get("class_names") or []
        self._imgsz = int(ckpt.get("imgsz", 224))
        num_classes = len(self._class_names)
        if num_classes < 1:
            raise ModelLoadError(detail="Checkpoint has no class_names")

        weights = models.ResNet18_Weights.IMAGENET1K_V1
        model = models.resnet18(weights=weights)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
        model.load_state_dict(ckpt["model_state_dict"])
        model.eval()
        model.to(device)
        self._model = model

        self._transform = transforms.Compose(
            [
                transforms.Resize((self._imgsz, self._imgsz)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )

        logger.info(
            "Classifier loaded: path=%s classes=%d device=%s",
            path,
            num_classes,
            self._settings.device,
        )

    @property
    def is_loaded(self) -> bool:
        return self._model is not None

    @property
    def device(self) -> str:
        return self._settings.device

    @property
    def model_display_name(self) -> str:
        return "resnet18-durian-leaf"

    def _resolve_names(self, class_key: str) -> tuple[str, str]:
        entry = self._label_map.get(class_key, {})
        en = entry.get("en") or class_key
        vi = entry.get("vi") or class_key
        return en, vi

    def classify(self, image_source: Any) -> tuple[str, str, str, float, float]:
        """Return (class_key, label_en, label_vi, confidence, inference_ms)."""
        self._ensure_loaded()
        assert self._model is not None and self._transform is not None

        if isinstance(image_source, (str, Path)):
            img = Image.open(image_source).convert("RGB")
        elif isinstance(image_source, Image.Image):
            img = image_source.convert("RGB")
        else:
            raise InferenceError(detail="Unsupported image type for classifier")

        device = torch.device(self._settings.device)
        try:
            t0 = time.perf_counter()
            x = self._transform(img).unsqueeze(0).to(device)
            with torch.no_grad():
                logits = self._model(x)
                probs = torch.softmax(logits, dim=1)
                conf, idx = probs.max(dim=1)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            i = int(idx.item())
            confidence = float(conf.item())
            class_key = self._class_names[i] if i < len(self._class_names) else str(i)
            en, vi = self._resolve_names(class_key)
            return class_key, en, vi, confidence, elapsed_ms
        except ModelLoadError:
            raise
        except Exception as exc:
            logger.exception("Classifier inference failed")
            raise InferenceError(detail=f"Inference failed: {exc}") from exc


_classifier: ClassifierService | None = None


def get_classifier_service() -> ClassifierService:
    global _classifier
    if _classifier is None:
        _classifier = ClassifierService()
    return _classifier
