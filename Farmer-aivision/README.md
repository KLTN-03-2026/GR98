# Plant Disease AI Service

FastAPI microservice: **upload ảnh lá** → **tên bệnh (tiếng Anh + tiếng Việt)**, **bounding box**, **độ tin cậy** (YOLOv8 + ResNet18). Thuộc bộ Agri Integrator.

## Quick start

```bash
pip install -r requirements.txt
cp .env.example .env
python scripts/train_yolo_detection.py   # train YOLO detector (optional)
make dev      # uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> **Tip:** Dùng `make run` để chạy không reload, hoặc `make -C . help` xem các lệnh khác.

## Docker

```bash
# Build
docker build -t agri-ai-service .

# Run
docker run -d -p 8000:8000 --name agri-ai agri-ai-service
```

API chạy ở `http://localhost:8000/docs`.

## API

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/health` | Trạng thái service |
| POST | `/analyze/image` | Upload ảnh → phân tích bệnh + gợi ý điều trị |

### Ví dụ

```bash
curl -X POST "http://localhost:8000/analyze/image" -F "file=@leaf.jpg"
```

### Response

```json
{
  "success": true,
  "message": "Phân tích hoàn tất",
  "data": {
    "disease": "Leaf_Phytophthora",
    "benh": "Bệnh Phytophthora trên lá",
    "do_chinh_xac": 0.87,
    "meo_tri": "Phun thuốc diệt nấm chứa hoạt chất Metalaxyl hoặc Mancozeb theo hướng dẫn trên bao bì. Thu hoạch và tiêu hủy lá bệnh nặng để ngăn lây lan.",
    "nguyen_nhan": "Nấm Phytophthora palmivora lây qua đất ẩm, nước tưới và mưa. Phát triển mạnh trong điều kiện ẩm ướt kéo dài."
  },
  "thoi_gian_xu_ly_ms": 1234.5,
  "timestamp": "2026-04-08T00:00:00"
}
```

## Biến môi trường

Xem `.env.example` (`DEVICE`, `DETECTOR_MODEL_PATH`, `CLASSIFIER_MODEL_PATH`, …).
