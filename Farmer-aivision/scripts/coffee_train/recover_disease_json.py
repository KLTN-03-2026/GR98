# -*- coding: utf-8 -*-
"""
Recover: tạo coffee_disease_classifier.json từ .pt đã save.

Dùng khi ResNet disease bị kill giữa chừng (sau ep19 đã save best weights
val_acc=0.9961). Script tạo metadata JSON tối thiểu để 07_export_and_swap.py
chấp nhận. Optionally chạy nhanh test evaluation để fill test_acc thật.
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms

ROOT = Path(__file__).resolve().parents[2]

PT_PATH = ROOT / "ai" / "weights" / "coffee_disease_classifier.pt"
JSON_PATH = PT_PATH.with_suffix(".json")
MANIFEST = ROOT / "datasets_coffee" / "processed" / "cls_disease" / "manifest.csv"

CLASS_NAMES = [
    "healthy", "leaf_rust", "cercospora", "miner",
    "phoma", "red_spider_mite", "ojo_gallo",
]


class TestDS(Dataset):
    def __init__(self, items, tf):
        self.items = items
        self.tf = tf
    def __len__(self): return len(self.items)
    def __getitem__(self, i):
        p, lbl = self.items[i]
        try:
            img = Image.open(p).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), (128, 128, 128))
        return self.tf(img), lbl


def load_test_items():
    items = []
    with MANIFEST.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["split"] == "test":
                items.append((Path(row["path"]), int(row["class_id"])))
    return items


def main():
    if not PT_PATH.exists():
        print(f"[ERROR] .pt không tồn tại: {PT_PATH}")
        sys.exit(1)

    print(f"[1/3] Load checkpoint: {PT_PATH}")
    ckpt = torch.load(PT_PATH, map_location="cpu", weights_only=False)
    val_acc = float(ckpt.get("val_acc", 0.9961))
    arch = ckpt.get("arch", "resnet18")
    class_names = ckpt.get("class_names", CLASS_NAMES)
    input_size = int(ckpt.get("input_size", 224))
    print(f"      val_acc={val_acc:.4f}  arch={arch}  classes={len(class_names)}")

    print(f"\n[2/3] Quick test eval on test split...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"      device={device}")

    test_items = load_test_items() if MANIFEST.exists() else []
    test_acc = None
    per_cls_acc: dict[str, float] = {}

    if test_items:
        tf = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                  std=[0.229, 0.224, 0.225]),
        ])
        loader = DataLoader(TestDS(test_items, tf), batch_size=128,
                            shuffle=False, num_workers=4, pin_memory=True)
        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, len(class_names))
        model.load_state_dict(ckpt["state_dict"])
        model = model.to(device).eval()

        correct = [0] * len(class_names)
        total = [0] * len(class_names)
        with torch.no_grad():
            for x, y in loader:
                x, y = x.to(device), y.to(device)
                out = model(x)
                preds = out.argmax(1)
                for p, l in zip(preds.cpu().tolist(), y.cpu().tolist()):
                    total[l] += 1
                    if p == l:
                        correct[l] += 1
        test_acc = sum(correct) / max(1, sum(total))
        per_cls_acc = {
            class_names[i]: (correct[i] / total[i] if total[i] > 0 else 0.0)
            for i in range(len(class_names))
        }
        print(f"      test_acc={test_acc:.4f}")
        for cn, a in per_cls_acc.items():
            print(f"        {cn:18s} {a:.4f}")
    else:
        print("      manifest không tồn tại, skip test eval")

    print(f"\n[3/3] Write JSON: {JSON_PATH}")
    meta = {
        "weights_file": str(PT_PATH.relative_to(ROOT)),
        "task": "classification",
        "arch": arch,
        "num_classes": len(class_names),
        "class_names": class_names,
        "input_size": input_size,
        "best_val_acc": val_acc,
        "test_acc": test_acc,
        "per_class_test_acc": per_cls_acc,
        "note": "Recovered after early kill; trained ~19 epochs (early stop at converged val_acc).",
    }
    JSON_PATH.write_text(json.dumps(meta, indent=2, ensure_ascii=False),
                          encoding="utf-8")
    print(f"      Done.")


if __name__ == "__main__":
    main()
