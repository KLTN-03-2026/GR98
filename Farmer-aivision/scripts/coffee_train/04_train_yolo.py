# -*- coding: utf-8 -*-
"""
04 — Train YOLOv8s detection cho cà phê (5 classes).

Input  : datasets_coffee/processed/yolo/data.yaml (sau script 02)
Output : ai/weights/coffee_leaf_detector.pt + .json metadata

Mạnh hơn model sầu riêng cũ (yolov8n, mAP 0.54) vì:
  - Dùng yolov8s (size hơn n, depth/width gấp ~2x) — vẫn chạy được RTX 3050 4GB inference
  - 5 class thay vì 9, ít confusion hơn
  - 2650 ảnh phân bố tốt hơn (min 167 vs max 2784, ratio 1:17 vs durian 1:120)
  - Augmentation mạnh: mosaic + mixup + copy_paste

Run:
  python scripts/coffee_train/04_train_yolo.py
  (mặc định 150 epochs, batch 16, imgsz 640, RTX 4060 ~1.5-2h)
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import torch
from ultralytics import YOLO

# Fix numpy 2.x compat
if not hasattr(np, "trapz"):
    np.trapz = np.trapezoid  # type: ignore

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))


CLASS_NAMES = ["healthy", "leaf_rust", "red_spider_mite", "malnutrition", "pest"]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--data", type=Path,
                   default=ROOT / "datasets_coffee" / "processed" / "yolo" / "data.yaml")
    p.add_argument("--epochs", type=int, default=150)
    p.add_argument("--batch", type=int, default=16)
    p.add_argument("--imgsz", type=int, default=640)
    p.add_argument("--model", type=str, default="yolov8s.pt",
                   help="yolov8n.pt | yolov8s.pt (recommended) | yolov8m.pt")
    p.add_argument("--device", type=str, default="")
    p.add_argument("--project", type=Path,
                   default=ROOT / "ai" / "runs" / "detect")
    p.add_argument("--name", type=str, default="coffee_detect")
    p.add_argument("--resume", action="store_true")
    p.add_argument("--patience", type=int, default=30,
                   help="Early stop nếu val mAP không improve sau N epoch")
    return p.parse_args()


def _device(args) -> str:
    if args.device:
        return args.device
    return "0" if torch.cuda.is_available() else "cpu"


def _extract_map(results) -> float | None:
    if results is None:
        return None
    rd = getattr(results, "results_dict", None)
    if not isinstance(rd, dict):
        return None
    for k in ("metrics/mAP50(B)", "metrics/mAP50-95(B)", "metrics/mAP50"):
        if k in rd:
            try:
                return float(rd[k])
            except (TypeError, ValueError):
                pass
    return None


def main() -> None:
    args = parse_args()

    if not args.data.exists():
        print(f"[ERROR] data.yaml không tồn tại: {args.data}\n"
              f"Hãy chạy scripts/coffee_train/02_merge_yolo_detection.py trước.")
        sys.exit(1)

    device = _device(args)
    print(f"=== Train YOLOv8 — Coffee Leaf Detection (5 classes) ===")
    print(f"  Data    : {args.data}")
    print(f"  Model   : {args.model}")
    print(f"  Epochs  : {args.epochs}  |  Batch: {args.batch}  |  Imgsz: {args.imgsz}")
    print(f"  Device  : {device}")
    if torch.cuda.is_available():
        print(f"  GPU     : {torch.cuda.get_device_name(0)}")

    model = YOLO(args.model)
    results = model.train(
        data=str(args.data.resolve()),
        epochs=args.epochs,
        batch=args.batch,
        imgsz=args.imgsz,
        device=device,
        workers=4,
        project=str(args.project.resolve()),
        name=args.name,
        exist_ok=True,
        resume=args.resume,
        plots=True,
        save=True,
        verbose=True,
        # Optimizer
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        warmup_epochs=3.0,
        # Augmentation mạnh để cover ảnh thực tế (lá ngoài vườn, ánh sáng đa dạng)
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=15.0,
        translate=0.1,
        scale=0.5,
        shear=2.0,
        perspective=0.0005,
        flipud=0.1,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.15,
        copy_paste=0.1,
        # Early stop
        patience=args.patience,
        amp=True,
    )

    # Copy best.pt
    best_pt = args.project / args.name / "weights" / "best.pt"
    out_pt = ROOT / "ai" / "weights" / "coffee_leaf_detector.pt"
    out_pt.parent.mkdir(parents=True, exist_ok=True)

    if best_pt.exists():
        shutil.copy2(best_pt, out_pt)
        print(f"\n[OK] Copied best.pt → {out_pt}")

        meta = {
            "weights_file": str(out_pt.relative_to(ROOT)),
            "task": "detect",
            "base_model": args.model,
            "nc": len(CLASS_NAMES),
            "names": CLASS_NAMES,
            "data_yaml": str(args.data.resolve()),
            "epochs": args.epochs,
            "batch": args.batch,
            "imgsz": args.imgsz,
            "best_map": _extract_map(results),
            "run_dir": str((args.project / args.name).resolve()),
        }
        meta_path = out_pt.with_suffix(".json")
        meta_path.write_text(
            json.dumps(meta, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        print(f"[OK] Metadata → {meta_path}")
        if meta["best_map"] is not None:
            print(f"\n  >>> Best mAP@50: {meta['best_map']:.4f}")
    else:
        print(f"[ERROR] Không tìm thấy best.pt tại {best_pt}")


if __name__ == "__main__":
    main()
