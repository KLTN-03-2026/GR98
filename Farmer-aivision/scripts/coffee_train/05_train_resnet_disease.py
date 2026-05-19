# -*- coding: utf-8 -*-
"""
05 — Train ResNet18 classification cho cà phê (7 disease classes).

Input  : datasets_coffee/processed/cls_disease/manifest.csv (sau script 03)
Output : ai/weights/coffee_disease_classifier.pt + .json

Pipeline khi inference:
  YOLO detect leaf → crop bbox → ResNet phân loại bệnh chi tiết.

Đặc điểm:
  - 7 class: healthy, leaf_rust, cercospora, miner, phoma, red_spider_mite, ojo_gallo
  - Class imbalance lớn (red_spider_mite=167, healthy=20274) → WeightedRandomSampler
  - Pretrained ImageNet → finetune
  - Augmentation: random resize crop, flip, color jitter
  - Mixed precision training

Run:
  python scripts/coffee_train/05_train_resnet_disease.py
  (mặc định 30 epochs, batch 64, ~2h trên RTX 4060)
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torchvision import models, transforms

ROOT = Path(__file__).resolve().parents[2]

CLASS_NAMES = [
    "healthy", "leaf_rust", "cercospora", "miner",
    "phoma", "red_spider_mite", "ojo_gallo",
]


class ManifestDataset(Dataset):
    def __init__(self, manifest_path: Path, split: str, transform=None):
        self.items = []
        with manifest_path.open(encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row["split"] == split:
                    self.items.append((Path(row["path"]), int(row["class_id"])))
        self.transform = transform

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, idx: int):
        path, label = self.items[idx]
        try:
            img = Image.open(path).convert("RGB")
        except Exception:
            # Fallback: image of class mean (gray)
            img = Image.new("RGB", (224, 224), (128, 128, 128))
        if self.transform:
            img = self.transform(img)
        return img, label

    def class_labels(self) -> list[int]:
        return [lbl for _, lbl in self.items]


def make_transforms():
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    eval_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    return train_tf, eval_tf


def make_weighted_sampler(dataset: ManifestDataset) -> WeightedRandomSampler:
    labels = dataset.class_labels()
    class_count = [0] * len(CLASS_NAMES)
    for lbl in labels:
        class_count[lbl] += 1
    class_weight = [
        1.0 / c if c > 0 else 0.0 for c in class_count
    ]
    sample_weights = [class_weight[lbl] for lbl in labels]
    return WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(labels),
        replacement=True,
    )


def build_model(num_classes: int) -> nn.Module:
    m = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    in_features = m.fc.in_features
    m.fc = nn.Linear(in_features, num_classes)
    return m


def evaluate(model, loader, device) -> tuple[float, float, list[int], list[int]]:
    model.eval()
    correct = 0
    total = 0
    loss_sum = 0.0
    criterion = nn.CrossEntropyLoss()
    all_preds = []
    all_labels = []
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            out = model(x)
            loss = criterion(out, y)
            loss_sum += loss.item() * x.size(0)
            preds = out.argmax(1)
            correct += (preds == y).sum().item()
            total += y.size(0)
            all_preds.extend(preds.cpu().tolist())
            all_labels.extend(y.cpu().tolist())
    return correct / total, loss_sum / total, all_preds, all_labels


def per_class_acc(preds: list[int], labels: list[int], num_classes: int) -> dict[str, float]:
    correct = [0] * num_classes
    total = [0] * num_classes
    for p, l in zip(preds, labels):
        total[l] += 1
        if p == l:
            correct[l] += 1
    return {
        CLASS_NAMES[i]: (correct[i] / total[i] if total[i] > 0 else 0.0)
        for i in range(num_classes)
    }


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--manifest", type=Path,
                   default=ROOT / "datasets_coffee" / "processed" / "cls_disease" / "manifest.csv")
    p.add_argument("--epochs", type=int, default=30)
    p.add_argument("--batch", type=int, default=64)
    p.add_argument("--lr", type=float, default=1e-3)
    p.add_argument("--workers", type=int, default=4)
    p.add_argument("--out", type=Path,
                   default=ROOT / "ai" / "weights" / "coffee_disease_classifier.pt")
    return p.parse_args()


def main() -> None:
    args = parse_args()
    if not args.manifest.exists():
        print(f"[ERROR] Manifest không tồn tại: {args.manifest}\n"
              f"Chạy scripts/coffee_train/03_merge_classification.py trước.")
        sys.exit(1)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"=== Train ResNet18 — Coffee Disease (7 classes) ===")
    print(f"  Device: {device}")
    if device == "cuda":
        print(f"  GPU   : {torch.cuda.get_device_name(0)}")
    print(f"  Epochs: {args.epochs}  |  Batch: {args.batch}  |  LR: {args.lr}")

    train_tf, eval_tf = make_transforms()
    train_ds = ManifestDataset(args.manifest, "train", train_tf)
    valid_ds = ManifestDataset(args.manifest, "valid", eval_tf)
    test_ds = ManifestDataset(args.manifest, "test", eval_tf)

    print(f"  Train: {len(train_ds)} | Valid: {len(valid_ds)} | Test: {len(test_ds)}")

    sampler = make_weighted_sampler(train_ds)
    train_loader = DataLoader(train_ds, batch_size=args.batch, sampler=sampler,
                              num_workers=args.workers, pin_memory=True)
    valid_loader = DataLoader(valid_ds, batch_size=args.batch, shuffle=False,
                              num_workers=args.workers, pin_memory=True)
    test_loader = DataLoader(test_ds, batch_size=args.batch, shuffle=False,
                             num_workers=args.workers, pin_memory=True)

    model = build_model(len(CLASS_NAMES)).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    scaler = torch.amp.GradScaler("cuda", enabled=(device == "cuda"))

    best_val_acc = 0.0
    history = []
    args.out.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        model.train()
        running_loss = 0.0
        running_correct = 0
        running_total = 0
        for batch_idx, (x, y) in enumerate(train_loader):
            x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
            optimizer.zero_grad()
            with torch.amp.autocast("cuda", enabled=(device == "cuda")):
                out = model(x)
                loss = criterion(out, y)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            running_loss += loss.item() * x.size(0)
            preds = out.argmax(1)
            running_correct += (preds == y).sum().item()
            running_total += y.size(0)
            if batch_idx % 50 == 0:
                cur_acc = running_correct / running_total
                print(f"  ep{epoch:02d} [{batch_idx:4d}/{len(train_loader)}] "
                      f"loss={loss.item():.4f} acc={cur_acc:.4f}")
        scheduler.step()
        train_acc = running_correct / running_total
        train_loss = running_loss / running_total

        val_acc, val_loss, _, _ = evaluate(model, valid_loader, device)
        print(f"[ep{epoch:02d}] train_loss={train_loss:.4f} train_acc={train_acc:.4f}"
              f" | val_loss={val_loss:.4f} val_acc={val_acc:.4f}")
        history.append({
            "epoch": epoch,
            "train_loss": train_loss, "train_acc": train_acc,
            "val_loss": val_loss, "val_acc": val_acc,
        })

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "state_dict": model.state_dict(),
                "class_names": CLASS_NAMES,
                "arch": "resnet18",
                "input_size": 224,
                "val_acc": val_acc,
            }, args.out)
            print(f"   [save] new best val_acc={val_acc:.4f} → {args.out}")

    # Final test evaluation với best weights
    print("\n=== Test evaluation with best weights ===")
    ckpt = torch.load(args.out, map_location=device, weights_only=False)
    model.load_state_dict(ckpt["state_dict"])
    test_acc, test_loss, preds, labels = evaluate(model, test_loader, device)
    per_cls = per_class_acc(preds, labels, len(CLASS_NAMES))
    print(f"  Test acc: {test_acc:.4f} | loss: {test_loss:.4f}")
    print("  Per-class accuracy:")
    for cname, acc in per_cls.items():
        print(f"    {cname:18s} {acc:.4f}")

    meta = {
        "weights_file": str(args.out.relative_to(ROOT)),
        "task": "classification",
        "arch": "resnet18",
        "num_classes": len(CLASS_NAMES),
        "class_names": CLASS_NAMES,
        "input_size": 224,
        "best_val_acc": best_val_acc,
        "test_acc": test_acc,
        "per_class_test_acc": per_cls,
        "history": history,
    }
    meta_path = args.out.with_suffix(".json")
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False),
                          encoding="utf-8")
    print(f"\n[OK] Metadata → {meta_path}")


if __name__ == "__main__":
    main()
