# Coffee Leaf Disease Training Pipeline

Pipeline train model AI Vision cho cây cà phê — thay thế model sầu riêng cũ
(mAP 0.54 yếu).

## Kiến trúc

```
Ảnh lá cà phê
    ↓
[1] YOLOv8s Detection (5 classes)
    → bbox + class thô
    ↓ crop bbox
[2] ResNet18 Disease Classifier (7 classes)
    → tên bệnh chính xác
    ↓ (nếu là leaf_rust)
[3] ResNet18 Severity Classifier (5 levels)
    → mức độ nặng (rust_level_1..4)
```

## Datasets sử dụng (4 nguồn, ~62k ảnh)

| Dataset | Vai trò | Số ảnh |
|---------|---------|--------|
| Roboflow coffee-leaf-1jk2g v6 | YOLO detection (bbox sẵn) | 1,132 |
| Mendeley Robusta (c5yvn32dzg) | YOLO + Severity (polygon→bbox) | 1,560 |
| Kaggle JMuBEN | ResNet disease classifier | 58,549 |
| Mendeley Saposoa Arabica | Bổ sung Ojo_Gallo | 1,500 |

Class unified:
- **YOLO (5)**: healthy, leaf_rust, red_spider_mite, malnutrition, pest
- **ResNet disease (7)**: healthy, leaf_rust, cercospora, miner, phoma, red_spider_mite, ojo_gallo
- **ResNet severity (5)**: healthy, rust_level_1, rust_level_2, rust_level_3, rust_level_4

## Workflow

### Bước 1: Chuẩn bị data (đã chạy, ~5 phút)

```bash
# Convert Robusta polygon → YOLO bbox + tách severity crops
python scripts/coffee_train/01_normalize_robusta.py

# Gộp Roboflow v6 + Robusta thành dataset YOLO 5-class với split 80/10/10
python scripts/coffee_train/02_merge_yolo_detection.py

# Gộp JMuBEN + Saposoa + Robusta crops → manifest cho ResNet
python scripts/coffee_train/03_merge_classification.py
```

Output:
- `datasets_coffee/processed/yolo/` — YOLO data (2650 ảnh, data.yaml)
- `datasets_coffee/processed/cls_disease/manifest.csv` — ResNet manifest (61k items)
- `datasets_coffee/processed/cls_severity/` — Severity crops (~1400 ảnh)

### Bước 2: Train 3 models (tổng ~4-5 giờ)

```bash
# Model 1: YOLO detection (~1.5-2h trên RTX 4060)
python scripts/coffee_train/04_train_yolo.py
# Output: ai/weights/coffee_leaf_detector.pt + .json
# Target: mAP@50 ≥ 0.90

# Model 2: ResNet disease (~2-3h)
python scripts/coffee_train/05_train_resnet_disease.py
# Output: ai/weights/coffee_disease_classifier.pt + .json
# Target: top-1 accuracy ≥ 0.92

# Model 3: ResNet severity (~30-45 phút)
python scripts/coffee_train/06_train_resnet_severity.py
# Output: ai/weights/coffee_severity_classifier.pt + .json
# Target: top-1 accuracy ≥ 0.85
```

Tip: train tuần tự (GPU 4060 8GB không đủ chạy song song 2 train). Trong khi
train, mở tab khác để xem TensorBoard plot trong `ai/runs/detect/coffee_detect/`.

### Bước 3: Swap vào Farmer-aivision

```bash
python scripts/coffee_train/07_export_and_swap.py
```

Script này:
- Backup durian weights cũ vào `ai/weights/_backup_durian/`
- Cập nhật `.env` với 3 path mới (DETECTOR_MODEL_PATH, CLASSIFIER_MODEL_PATH, DETECTOR_LABELS_PATH)
- Backup `diseases.json` cũ; copy `coffee_diseases.json` → `diseases.json`

Restart FastAPI:
```bash
# Tắt uvicorn đang chạy, sau đó:
python -m app
# hoặc: uvicorn app.main:app --reload --port 8000
```

### Bước 4 (tự làm): Tích hợp Severity vào pipeline

Severity model hiện chưa được wire vào `analysis_service.py`. Để demo thesis
ấn tượng, thêm như sau:

1. Tạo `app/services/severity_service.py` (copy template từ `classifier_service.py`,
   sửa path → `coffee_severity_classifier.pt`).

2. Trong `analysis_service.py`, sau khi classifier trả về `disease_name`:
   ```python
   if disease_name == "leaf_rust":
       severity_label = severity_service.predict(crop_image)
       # severity_label ∈ {healthy, rust_level_1, ..., rust_level_4}
       analysis_result["severity"] = severity_label
   ```

3. Trong `disease_knowledge.py` hoặc khuyến nghị, mở rộng `dieu_tri` theo
   severity:
   ```
   rust_level_1: theo dõi, phun phòng ngừa Hexaconazole 3g/16L
   rust_level_2-3: phun chữa Hexaconazole 5g/16L, lặp 7 ngày
   rust_level_4: cắt tỉa lá nặng + phun 5g/16L lặp 5 ngày, bổ sung K
   ```

## Rollback (nếu cần quay lại model sầu riêng)

```bash
# Copy backup ngược về
cp ai/weights/_backup_durian/* ai/weights/
# Xóa 3 dòng DETECTOR_*/CLASSIFIER_* trong .env
# Restart service
```

## Kỳ vọng kết quả

| Metric | Sầu riêng (cũ) | Cà phê (mới — dự kiến) |
|--------|----------------|-----------------------|
| YOLO mAP@50 | 0.54 | **≥ 0.90** |
| Classifier top-1 | N/A | **≥ 0.92** |
| Severity top-1 | ❌ | **≥ 0.85** (mới có) |
| Class imbalance ratio | 1:120 (14-1691) | 1:17 (167-2784) |
| Demo feature | Detect only | Detect + Disease + Severity (3 stages) |

## Troubleshooting

- **CUDA out of memory**: giảm `--batch 16 → 8` khi train YOLO, hoặc `--batch 64 → 32` khi train ResNet.
- **Train chậm**: tăng `--workers` (mặc định 4); thử `--imgsz 512` cho YOLO.
- **Validation acc thấp**: tăng `--epochs`, hoặc kiểm tra class imbalance trong log.
- **File pretrained yolov8s.pt thiếu**: ultralytics sẽ auto-download lần đầu.
