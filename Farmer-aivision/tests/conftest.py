"""pytest configuration and fixtures."""
import sys
from pathlib import Path

import pytest

# Ensure app is importable from the project root
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


@pytest.fixture(scope="session")
def sample_image_bytes() -> bytes:
    """Return minimal 1x1 white PNG bytes for smoke tests."""
    import base64

    png_b64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8Dw"
        "HwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
    )
    return base64.b64decode(png_b64)


@pytest.fixture(scope="session")
def sample_image_path(tmp_path_factory, sample_image_bytes) -> Path:
    """Write sample image to a temp file and return its path."""
    path = tmp_path_factory.mktemp("images") / "test_plant.png"
    path.write_bytes(sample_image_bytes)
    return path


@pytest.fixture
def mock_settings(monkeypatch):
    """Override settings for testing without .env."""
    monkeypatch.setenv("DEVICE", "cpu")
    monkeypatch.setenv("LOG_LEVEL", "debug")
