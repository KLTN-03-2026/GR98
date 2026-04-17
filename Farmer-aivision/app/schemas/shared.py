"""Shared API schemas (health, models, errors)."""
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    model_loaded: bool = Field(..., description="Whether classifier weights file exists")
    model_name: str = Field(..., description="Classifier identifier")
    device: str = Field(..., description="Inference device")
    gpu_available: bool = Field(..., description="Whether GPU is available")
    version: str = Field("1.1.0", description="Service version")


class ModelInfo(BaseModel):
    name: str = Field(..., description="Model display name")
    description: str = Field(..., description="Model description")
    size_mb: float | None = Field(None, description="Approximate size in MB")


class ModelsListResponse(BaseModel):
    models: list[ModelInfo] = Field(..., description="Available models")


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Error message")
    error_code: str | None = Field(None, description="Machine-readable error code")
