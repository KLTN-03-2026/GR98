"""ResNet severity classifier — multi-crop. Hiện tại chỉ cà phê có.

Sầu riêng chưa train severity → predict() trả về None để caller skip.
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


class _LoadedSeverity:
    def __init__(self, model: nn.Module, class_names: list[str],
                 transform: transforms.Compose, crop_type: str):
        self.model = model
        self.class_names = class_names
        self.transform = transform
        self.crop_type = crop_type


class SeverityService:
    """Multi-crop severity. Crop nào không có weights → return None."""

    def __init__(self) -> None:
        self._models: dict[str, _LoadedSeverity] = {}
        self._settings = get_settings()

    def has_severity(self, crop_type: str) -> bool:
        cfg = get_crop_config(crop_type)
        return cfg.severity_pt is not None and cfg.severity_pt.is_file()

    def _get_or_load(self, crop_type: str) -> _LoadedSeverity | None:
        if crop_type in self._models:
            return self._models[crop_type]

        cfg: CropConfig = get_crop_config(crop_type)
        if cfg.severity_pt is None:
            return None
        if not cfg.severity_pt.is_file():
            return None

        try:
            device = torch.device(self._settings.device)
            ckpt = torch.load(cfg.severity_pt, map_location=device, weights_only=False)
        except Exception as exc:
            raise ModelLoadError(detail=f"Failed to load severity {cfg.display_name}: {exc}") from exc

        class_names = ckpt.get("class_names") or [
            "healthy", "rust_level_1", "rust_level_2", "rust_level_3", "rust_level_4",
        ]
        input_size = int(ckpt.get("input_size", ckpt.get("imgsz", 224)))
        sd = ckpt.get("state_dict") or ckpt.get("model_state_dict")
        if sd is None:
            raise ModelLoadError(detail=f"Severity {cfg.display_name} missing state_dict")

        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, len(class_names))
        model.load_state_dict(sd)
        model.eval()
        model.to(device)

        transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(input_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                  std=[0.229, 0.224, 0.225]),
        ])

        loaded = _LoadedSeverity(model=model, class_names=class_names,
                                  transform=transform, crop_type=cfg.crop_type)
        self._models[cfg.crop_type] = loaded
        logger.info("Severity loaded: crop=%s classes=%s", cfg.crop_type, class_names)
        return loaded

    def predict(self, image_source: Any, crop_type: str | None = None
                ) -> tuple[str, float, float] | None:
        """
        Return (class_name, confidence, inference_ms) hoặc None nếu crop không support.
        """
        loaded = self._get_or_load(crop_type or "ca-phe")
        if loaded is None:
            return None

        if isinstance(image_source, (str, Path)):
            img = Image.open(image_source).convert("RGB")
        elif isinstance(image_source, Image.Image):
            img = image_source.convert("RGB")
        else:
            raise InferenceError(detail="Unsupported image type for severity")

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
            return loaded.class_names[i], float(conf.item()), elapsed_ms
        except Exception as exc:
            logger.exception("Severity inference failed for crop=%s", loaded.crop_type)
            raise InferenceError(detail=f"Severity inference failed: {exc}") from exc


_severity: SeverityService | None = None


def get_severity_service() -> SeverityService:
    global _severity
    if _severity is None:
        _severity = SeverityService()
    return _severity
