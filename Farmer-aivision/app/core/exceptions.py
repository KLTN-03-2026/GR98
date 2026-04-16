"""Custom exceptions for the AI service."""
from fastapi import HTTPException, status


class AIServiceError(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(status_code=status_code, detail=detail)


class ModelLoadError(AIServiceError):
    def __init__(self, detail: str = "Failed to load the AI model"):
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


class UnsupportedFileTypeError(AIServiceError):
    def __init__(self, detail: str = "Unsupported file type"):
        super().__init__(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail=detail)


class FileTooLargeError(AIServiceError):
    def __init__(self, detail: str = "File size exceeds the allowed limit"):
        super().__init__(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=detail)


class InferenceError(AIServiceError):
    def __init__(self, detail: str = "Inference failed"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class DetectionError(AIServiceError):
    def __init__(self, detail: str = "Object detection failed"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
