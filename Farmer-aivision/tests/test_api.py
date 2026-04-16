"""Integration tests for FastAPI routes using TestClient."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(mock_settings):
    """Create a TestClient with mocked settings."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_classifier(monkeypatch):
    """Avoid loading real weights during /classify tests."""

    class _MockClf:
        model_display_name = "resnet18-durian-leaf"
        device = "cpu"

        def classify(self, path):
            return (
                "Leaf_Healthy",
                "Healthy leaf",
                "Lá khỏe",
                0.987654,
                5.2,
            )

    import app.api.classify as classify_mod

    monkeypatch.setattr(classify_mod, "get_classifier_service", lambda: _MockClf())


class TestRoot:
    def test_root_returns_service_info(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["service"] == "Agri Integrator AI Service"
        assert r.json()["docs"] == "/docs"


class TestHealth:
    def test_health_returns_status(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert "model_name" in data
        assert "device" in data
        assert "gpu_available" in data

    def test_models_list(self, client):
        r = client.get("/models")
        assert r.status_code == 200
        models = r.json()["models"]
        names = [m["name"] for m in models]
        assert "resnet18-durian-leaf" in names


class TestClassifyImage:
    def test_unsupported_media_type(self, client):
        r = client.post("/classify/image", files={"file": ("x.txt", b"hello", "text/plain")})
        assert r.status_code == 415

    def test_missing_file(self, client):
        r = client.post("/classify/image")
        assert r.status_code == 422

    def test_classify_ok(self, client, mock_classifier, sample_image_bytes):
        r = client.post(
            "/classify/image",
            files={"file": ("plant.jpg", sample_image_bytes, "image/jpeg")},
        )
        assert r.status_code == 200
        d = r.json()
        assert d["class_key"] == "Leaf_Healthy"
        assert d["label_en"] == "Healthy leaf"
        assert d["label_vi"] == "Lá khỏe"
        assert d["confidence"] > 0.9
        assert d["model"] == "resnet18-durian-leaf"
