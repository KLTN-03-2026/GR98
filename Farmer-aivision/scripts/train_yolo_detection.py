# -*- coding: utf-8 -*-
"""
Train YOLOv8 detection model trên merged dataset.

Dataset  : dataset dowload/merged_yolo/data.yaml
Output    : ai/weights/durian_leaf_detector.pt
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from app.core.logging import get_logger, setup_logging  # noqa: E402

logger = get_logger(__name__)

# ──────────────────────────────────────────────────────────────────
import argparse
import json
import random
import re
import numpy as np
import torch
from ultralytics import YOLO

# ── hotfix: numpy 2.x removed np.trapz (deprecated alias) ──
if not hasattr(np, "trapz"):
    np.trapz = np.trapezoid

# ──────────────────────────────────────────────────────────────────
# Class weight (nghịch đảo tần suất, normalized)
# Từ thống kê merged dataset train:
CLASS_INSTANCES = {
    0: 343,    # Healthy_leaf
    1: 381,    # Leaf_Blight
    2: 22,     # Leaf_Phytophthora
    3: 1691,   # Leaf_Spot
    4: 106,    # leaf_blight_anthracnose
    5: 125,    # leaf_blight_phyllosticta
    6: 68,     # leaf_blight_rhizoctonia
    7: 1267,   # leaf_spot_algal
    8: 14,     # leaf_spot_pseudocercospora
}
NAMES = [
    "Healthy_leaf",
    "Leaf_Blight",
    "Leaf_Phytophthora",
    "Leaf_Spot",
    "leaf_blight_anthracnose",
    "leaf_blight_phyllosticta",
    "leaf_blight_rhizoctonia",
    "leaf_spot_algal",
    "leaf_spot_pseudocercospora",
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Train YOLOv8 detection trên merged durian dataset")
    p.add_argument(
        "--data", type=Path,
        default=ROOT / "dataset dowload" / "merged_yolo" / "data.yaml",
        help="Đường dẫn data.yaml"
    )
    p.add_argument(
        "--epochs", type=int, default=100,
        help="Số epochs (default: 100)"
    )
    p.add_argument(
        "--batch", type=int, default=16,
        help="Batch size (default: 16)"
    )
    p.add_argument(
        "--imgsz", type=int, default=640,
        help="Kích thước ảnh train (default: 640)"
    )
    p.add_argument(
        "--model", type=str, default="yolov8n.pt",
        help="Base model: yolov8n.pt | yolov8s.pt | yolov8m.pt (default: yolov8n.pt)"
    )
    p.add_argument(
        "--device", type=str, default="",
        help="cuda | cpu (default: auto)"
    )
    p.add_argument(
        "--project", type=Path,
        default=ROOT / "ai" / "runs" / "detect",
        help="Thư mục lưu kết quả train"
    )
    p.add_argument(
        "--name", type=str, default="durian_detect",
        help="Tên experiment"
    )
    p.add_argument(
        "--resume", action="store_true",
        help="Tiếp tục train từ checkpoint cuối"
    )
    return p.parse_args()


def split_train_val(data_yaml: Path, val_ratio: float = 0.1, seed: int = 42):
    """
    Tách train/ thành train/ + val/ (10%) vì merged dataset chỉ có train.
    Cập nhật data.yaml tại chỗ để trỏ đúng train/val mới.
    Trả về đường dẫn data.yaml đã sửa.
    """
    data_dir = data_yaml.parent
    train_img_dir = data_dir / "train" / "images"
    train_lbl_dir = data_dir / "train" / "labels"

    # Lấy toàn bộ ảnh train
    all_images = sorted([
        f for f in train_img_dir.rglob("*")
        if f.suffix.lower() in (".jpg", ".jpeg", ".png")
    ])
    n = len(all_images)
    n_val = max(1, int(n * val_ratio))
    n_train = n - n_val

    random.seed(seed)
    indices = list(range(n))
    random.shuffle(indices)
    val_indices = set(indices[:n_val])
    train_indices = set(indices[n_val:])

    val_img_dir = data_dir / "valid" / "images"
    val_lbl_dir = data_dir / "valid" / "labels"
    val_img_dir.mkdir(parents=True, exist_ok=True)
    val_lbl_dir.mkdir(parents=True, exist_ok=True)

    moved = 0
    for idx in val_indices:
        img_path = all_images[idx]
        stem = img_path.stem
        lbl_path = train_lbl_dir / (stem + ".txt")

        dst_img = val_img_dir / img_path.name
        dst_lbl = val_lbl_dir / (stem + ".txt")

        shutil.move(str(img_path), str(dst_img))
        if lbl_path.exists():
            shutil.move(str(lbl_path), str(dst_lbl))
        moved += 1

    logger.info(
        "Đã tách %d/%d ảnh thành valid (%.0f%%), còn %d cho train.",
        moved, n, val_ratio * 100, n - moved
    )

    # Cập nhật data.yaml
    new_yaml_content = f"""\
train: train/images
val: valid/images
test:

nc: {len(NAMES)}
names: {NAMES}
"""
    data_yaml.write_text(new_yaml_content, encoding="utf-8")
    logger.info("Đã cập nhật data.yaml với train/valid split")
    return data_yaml


def _device_str(args: argparse.Namespace) -> str:
    if args.device:
        return args.device
    return "0" if torch.cuda.is_available() else "cpu"


def resolve_pretrained_weights_path(model_arg: str) -> str:
    """
    Ưu tiên file .pt có sẵn trong ROOT (vd. ./yolov8n.pt) để load local, tránh tải lại từ hub.
    """
    raw = Path(model_arg)
    if raw.is_file():
        return str(raw.resolve())
    if not raw.is_absolute() and raw.suffix.lower() == ".pt":
        local = ROOT / raw.name
        if local.is_file():
            return str(local.resolve())
    return model_arg


def patch_amp_check_use_weights(amp_probe_weights: str) -> None:
    """
    Trainer gọi ultralytics.utils.checks.check_amp(), bên trong mặc định load YOLO('yolo11n.pt')
    (hoặc yolo26n ở bản 8.4+) chỉ để test AMP — không liên quan model bạn train.
    Patch: dùng cùng file pretrained đã chọn (vd. yolov8n.pt) để không tải thêm weights khác.
    """
    import ultralytics.utils.checks as uc
    from ultralytics.utils import ASSETS, LOGGER
    from ultralytics.utils.checks import colorstr
    from ultralytics.utils.torch_utils import autocast

    def check_amp(model):
        device = next(model.parameters()).device
        prefix = colorstr("AMP: ")
        if device.type in {"cpu", "mps"}:
            return False
        pattern = re.compile(
            r"(nvidia|geforce|quadro|tesla).*?(1660|1650|1630|t400|t550|t600|t1000|t1200|t2000|k40m)",
            re.IGNORECASE,
        )
        gpu = torch.cuda.get_device_name(device)
        if bool(pattern.search(gpu)):
            LOGGER.warning(
                f"{prefix}checks failed ❌. AMP training on {gpu} GPU may cause "
                f"NaN losses or zero-mAP results, so AMP will be disabled during training."
            )
            return False

        def amp_allclose(m, im):
            batch = [im] * 8
            imgsz = max(256, int(model.stride.max() * 4))
            a = m(batch, imgsz=imgsz, device=device, verbose=False)[0].boxes.data
            with autocast(enabled=True):
                b = m(batch, imgsz=imgsz, device=device, verbose=False)[0].boxes.data
            del m
            return a.shape == b.shape and torch.allclose(a, b.float(), atol=0.5)

        im = ASSETS / "bus.jpg"
        LOGGER.info(f"{prefix}running Automatic Mixed Precision (AMP) checks...")
        warning_msg = (
            "Setting 'amp=True'. If you experience zero-mAP or NaN losses you can disable AMP with amp=False."
        )
        try:
            assert amp_allclose(YOLO(amp_probe_weights), im)
            LOGGER.info(f"{prefix}checks passed ✅")
        except ConnectionError:
            LOGGER.warning(
                f"{prefix}checks skipped ⚠️. Offline and unable to download weights for AMP checks. {warning_msg}"
            )
        except (AttributeError, ModuleNotFoundError):
            LOGGER.warning(
                f"{prefix}checks skipped ⚠️. "
                f"Unable to load weights for AMP checks due to possible Ultralytics package modifications. {warning_msg}"
            )
        except AssertionError:
            LOGGER.warning(
                f"{prefix}checks failed ❌. Anomalies were detected with AMP on your system that may lead to "
                f"NaN losses or zero-mAP results, so AMP will be disabled during training."
            )
            return False
        return True

    uc.check_amp = check_amp


def _extract_map(results: object) -> float | None:
    if results is None:
        return None
    rd = getattr(results, "results_dict", None)
    if not isinstance(rd, dict):
        return None
    for key in ("metrics/mAP50(B)", "metrics/mAP50-95(B)", "metrics/mAP50"):
        if key in rd and rd[key] is not None:
            try:
                return float(rd[key])
            except (TypeError, ValueError):
                continue
    return None


def main() -> None:
    args = parse_args()
    setup_logging()

    logger.info("=== Train YOLO Detection — Durian Leaf Disease ===")
    weights_path = resolve_pretrained_weights_path(args.model)
    logger.info("Base model  : %s (resolved: %s)", args.model, weights_path)
    logger.info("Dataset     : %s", args.data)
    logger.info("Epochs      : %s", args.epochs)
    logger.info("Batch size  : %s", args.batch)
    logger.info("Image size  : %s", args.imgsz)

    # 1. Tách train/val
    if not (args.data.parent / "valid" / "images").exists():
        data_yaml = split_train_val(args.data, val_ratio=0.1, seed=42)
    else:
        data_yaml = args.data
        logger.info("Valid folder đã tồn tại, bỏ qua split.")

    # 2. Train — data= phải là data.yaml của dataset (không phải file config tự chế)
    device = _device_str(args)
    logger.info("Device: %s", device)
    logger.info("Bắt đầu train...")
    patch_amp_check_use_weights(weights_path)
    model = YOLO(weights_path)

    results = model.train(
        data=str(data_yaml.resolve()),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=device,
        workers=2,
        project=str(args.project.resolve()),
        name=args.name,
        exist_ok=True,
        resume=args.resume,
        plots=True,
        save=True,
        verbose=True,
        amp=False,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        warmup_epochs=3.0,
        mosaic=1.0,
        mixup=0.1,
        fliplr=0.5,
        degrees=15.0,
    )

    # 3. Best weight
    best_pt = args.project / args.name / "weights" / "best.pt"
    out_pt  = ROOT / "ai" / "weights" / "durian_leaf_detector.pt"
    if best_pt.exists():
        shutil.copy2(best_pt, out_pt)
        logger.info("Đã copy best.pt → %s", out_pt)

        meta_path = out_pt.with_suffix(".json")
        meta = {
            "weights_file": str(out_pt.relative_to(ROOT)),
            "task": "detect",
            "model": weights_path,
            "nc": len(NAMES),
            "names": NAMES,
            "class_instances": {str(k): v for k, v in CLASS_INSTANCES.items()},
            "data_yaml": str(data_yaml.resolve()),
            "best_map": _extract_map(results),
        }
        meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
        logger.info("Metadata → %s", meta_path)
    else:
        logger.warning("Không tìm thấy best.pt, thử last.pt")
        last_pt = args.project / args.name / "weights" / "last.pt"
        if last_pt.exists():
            shutil.copy2(last_pt, out_pt)
            logger.info("Đã copy last.pt → %s", out_pt)

    logger.info("Train hoàn tất!")
    logger.info("Run folder: %s/%s", args.project, args.name)


if __name__ == "__main__":
    main()
