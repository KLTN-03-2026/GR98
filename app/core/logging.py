"""Structured logging with configurable levels."""
import logging
import sys
from typing import Any

from app.core.config import get_settings


def _make_serializable(record: logging.LogRecord) -> dict[str, Any]:
    return {
        "timestamp": record.created,
        "level": record.levelname,
        "logger": record.name,
        "message": record.getMessage(),
        "module": record.module,
        "function": record.funcName,
        "line": record.lineno,
    }


def setup_logging() -> None:
    settings = get_settings()

    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    for logger_name in ("uvicorn", "uvicorn.access", "fastapi"):
        logging.getLogger(logger_name).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
