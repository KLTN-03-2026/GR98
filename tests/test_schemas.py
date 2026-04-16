"""Unit tests for API schemas."""
import pytest
from pydantic import ValidationError

from app.schemas import (
    ClassifyImageResponse,
    HealthResponse,
    ModelInfo,
    ModelsListResponse,
)


class TestClassifyImageResponse:
    def test_valid(self):
        r = ClassifyImageResponse(
            class_key="Leaf_Algal",
            label_en="Algal leaf spot",
            label_vi="Đốm rong trên lá",
            confidence=0.91,
            model="resnet18-durian-leaf",
            device="cpu",
            inference_time_ms=12.5,
            image_width=640,
            image_height=480,
        )
        assert r.class_key == "Leaf_Algal"
        assert r.confidence == 0.91

    def test_confidence_bounds(self):
        with pytest.raises(ValidationError):
            ClassifyImageResponse(
                class_key="x",
                label_en="a",
                label_vi="b",
                confidence=1.5,
                model="m",
                device="cpu",
                inference_time_ms=1.0,
            )


class TestHealthResponse:
    def test_healthy_defaults(self):
        h = HealthResponse(
            model_loaded=False,
            model_name="resnet18-durian-leaf",
            device="cpu",
            gpu_available=False,
        )
        assert h.status == "healthy"
        assert h.version == "1.0.0"


class TestModelInfo:
    def test_valid(self):
        m = ModelInfo(name="resnet18-durian-leaf", description="classifier", size_mb=45.0)
        assert m.name == "resnet18-durian-leaf"
        assert m.size_mb == 45.0
