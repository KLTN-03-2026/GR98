"""ResNet classifier service — multi-crop, lazy-loaded per crop type.

Hiện tại chỉ cà phê có classifier ResNet (coffee_disease_classifier.pt).
Sầu riêng chưa train ResNet → classify_for_crop('sau-rieng') trả về None
để analysis_service fallback dùng kết quả YOLO.
"""
from __future__ import annotations

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
from app.services.crop_registry import CropConfig, get_crop_config

logger = get_logger(__name__)


def gpu_available() -> bool:
    return torch.cuda.is_available()


class _LoadedClassifier:
    def __init__(self, model: nn.Module, class_names: list[str],
                 transform: transforms.Compose, crop_type: str):
        self.model = model
        self.class_names = class_names
        self.transform = transform
        self.crop_type = crop_type


class ClassifierService:
    """Multi-crop ResNet classifier. Một số crop không có classifier → trả None."""

    def __init__(self) -> None:
        self._models: dict[str, _LoadedClassifier] = {}
        self._settings = get_settings()

    @property
    def device(self) -> str:
        return self._settings.device

    @property
    def model_display_name(self) -> str:
        return "resnet18-multi-crop"

    def _get_or_load(self, crop_type: str) -> _LoadedClassifier | None:
        if crop_type in self._models:
            return self._models[crop_type]

        cfg: CropConfig = get_crop_config(crop_type)
        if cfg.classifier_pt is None:
            # Crop này không có classifier — return None để caller skip
            return None
        if not cfg.classifier_pt.is_file():
            raise ModelLoadError(
                detail=f"Classifier weights not found for {cfg.display_name}: {cfg.classifier_pt}"
            )

        try:
            device = torch.device(self._settings.device)
            ckpt = torch.load(cfg.classifier_pt, map_location=device, weights_only=False)
        except Exception as exc:
            raise ModelLoadError(detail=f"Failed to load classifier {cfg.display_name}: {exc}") from exc

        class_names = ckpt.get("class_names") or []
        if not class_names:
            raise ModelLoadError(detail=f"Classifier {cfg.display_name} missing class_names")

        input_size = int(ckpt.get("input_size", ckpt.get("imgsz", 224)))
        sd = ckpt.get("state_dict") or ckpt.get("model_state_dict")
        if sd is None:
            raise ModelLoadError(detail=f"Classifier {cfg.display_name} missing state_dict")

        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, len(class_names))
        model.load_state_dict(sd)
        model.eval()
        model.to(device)

        transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                  std=[0.229, 0.224, 0.225]),
        ])

        loaded = _LoadedClassifier(model=model, class_names=class_names,
                                    transform=transform, crop_type=cfg.crop_type)
        self._models[cfg.crop_type] = loaded
        logger.info(
            "Classifier loaded: crop=%s path=%s classes=%d",
            cfg.crop_type, cfg.classifier_pt, len(class_names),
        )
        return loaded

    def has_classifier(self, crop_type: str) -> bool:
        cfg = get_crop_config(crop_type)
        return cfg.classifier_pt is not None and cfg.classifier_pt.is_file()

    def classify(self, image_source: Any, crop_type: str | None = None
                 ) -> tuple[str, str, str, float, float] | None:
        """
        Return (class_key, label_en, label_vi, confidence, inference_ms).
        Return None nếu crop này không có classifier (caller phải fallback YOLO).
        """
        loaded = self._get_or_load(crop_type or "ca-phe")
        if loaded is None:
            return None

        if isinstance(image_source, (str, Path)):
            img = Image.open(image_source).convert("RGB")
        elif isinstance(image_source, Image.Image):
            img = image_source.convert("RGB")
        else:
            raise InferenceError(detail="Unsupported image type for classifier")

        device = torch.device(self._settings.device)
        try:
            t0 = time.perf_counter()
            x = loaded.transform(img).unsqueeze(0).to(device)
            with torch.no_grad():
                logits = loaded.model(x)
                probs = torch.softmax(logits, dim=1)
                conf, idx = probs.max(dim=1)
            elapsed_ms = (time.perf_counter() - t0) * 1000
            i = int(idx.item())
            confidence = float(conf.item())
            class_key = loaded.class_names[i] if i < len(loaded.class_names) else str(i)
            # en/vi labels — coffee không có sidecar label map, dùng raw key
            return class_key, class_key, class_key, confidence, elapsed_ms
        except ModelLoadError:
            raise
        except Exception as exc:
            logger.exception("Classifier inference failed for crop=%s", loaded.crop_type)
            raise InferenceError(detail=f"Inference failed: {exc}") from exc


_classifier: ClassifierService | None = None


def get_classifier_service() -> ClassifierService:
    global _classifier
    if _classifier is None:
        _classifier = ClassifierService()
    return _classifier
