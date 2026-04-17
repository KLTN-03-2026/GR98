FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create directories for uploads and outputs
RUN mkdir -p /tmp/uploads /tmp/outputs ai/weights

ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8000
ENV LOG_LEVEL=info
ENV DEVICE=cpu
ENV DETECTOR_MODEL_PATH=/app/ai/weights/durian_leaf_detector.pt
ENV CLASSIFIER_MODEL_PATH=/app/ai/weights/durian_leaf_classifier.pt

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
