"""Unit tests for core: config, logging, exceptions."""

from pathlib import Path

from app.core.config import Settings
from app.core.exceptions import (
    AIServiceError,
    FileTooLargeError,
    InferenceError,
    ModelLoadError,
    UnsupportedFileTypeError,
)


class TestSettings:
    def test_defaults(self):
        s = Settings()
        assert s.device == "cpu"
        assert s.log_level == "info"
        assert s.classifier_model_path.name == "durian_leaf_classifier.pt"
        assert "plant_disease" in str(s.classifier_labels_path)

    def test_cors_list_property(self):
        s = Settings(cors_origins="http://localhost:3000, http://localhost:5173")
        assert s.cors_list == ["http://localhost:3000", "http://localhost:5173"]

    def test_classifier_paths_custom(self, monkeypatch, tmp_path):
        w = tmp_path / "m.pt"
        w.write_bytes(b"x")
        j = tmp_path / "l.json"
        j.write_text("{}")
        monkeypatch.setenv("CLASSIFIER_MODEL_PATH", str(w))
        monkeypatch.setenv("CLASSIFIER_LABELS_PATH", str(j))
        s = Settings()
        assert s.classifier_model_path == Path(w)
        assert s.classifier_labels_path == Path(j)


class TestExceptions:
    def test_aiservice_error_status(self):
        exc = AIServiceError(detail="test", status_code=500)
        assert exc.status_code == 500
        assert exc.detail == "test"

    def test_model_load_error(self):
        exc = ModelLoadError()
        assert exc.status_code == 503
        assert "load" in exc.detail.lower()

    def test_unsupported_file_type_error(self):
        exc = UnsupportedFileTypeError()
        assert exc.status_code == 415

    def test_file_too_large_error(self):
        exc = FileTooLargeError()
        assert exc.status_code == 413

    def test_inference_error(self):
        exc = InferenceError()
        assert exc.status_code == 500
