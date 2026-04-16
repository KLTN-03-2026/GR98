"""Application configuration loaded from environment variables."""
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Classifier (ResNet18, train_classification.py) ─────────────────
    device: str = "cpu"
    classifier_model_path: Path = _PROJECT_ROOT / "ai" / "weights" / "durian_leaf_classifier.pt"
    classifier_labels_path: Path = (
        _PROJECT_ROOT / "ai" / "datasets" / "plant_disease" / "class_labels.json"
    )

    # ── Detector (YOLOv8, train_yolo_detection.py) ─────────────────────
    detector_model_path: Path = _PROJECT_ROOT / "ai" / "weights" / "durian_leaf_detector.pt"
    detector_labels_path: Path = _PROJECT_ROOT / "ai" / "weights" / "durian_leaf_detector.json"

    # ── Server ────────────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 1
    log_level: str = "info"

    # ── Paths ─────────────────────────────────────────────────────────
    upload_dir: Path = Path("/tmp/uploads")
    output_dir: Path = Path("/tmp/outputs")

    # ── CORS ──────────────────────────────────────────────────────────
    cors_origins: str = (
        "http://localhost:3000,http://localhost:5173,"
        "https://localhost:5173,http://192.168.1.6:5173,https://192.168.1.6:5173"
    )

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
