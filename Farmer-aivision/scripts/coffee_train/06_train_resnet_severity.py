# -*- coding: utf-8 -*-
"""
06 — Train ResNet18 severity classifier cho rust (5 levels).

Input  : datasets_coffee/processed/cls_severity/{healthy, rust_level_1..4}/
         (sau script 01)
Output : ai/weights/coffee_severity_classifier.pt + .json

Chỉ kích hoạt khi disease classifier xác định leaf_rust. Output 1 trong 5 mức:
  0=healthy, 1=rust_lvl1, 2=rust_lvl2, 3=rust_lvl3, 4=rust_lvl4

Imbalance: healthy=791, rust_lvl4=30 → cần WeightedRandomSampler + heavy aug.

Run:
  python scripts/coffee_train/06_train_resnet_severity.py
  (mặc định 50 epochs, batch 32, ~30-45 phút trên RTX 4060)
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

import torch
import torch.nn as nn
import torch.optim as optim
from PIL import Image
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torchvision import models, transforms

ROOT = Path(__file__).resolve().parents[2]

CLASS_NAMES = ["healthy", "rust_level_1", "rust_level_2", "rust_level_3", "rust_level_4"]
NAME_TO_ID = {n: i for i, n in enumerate(CLASS_NAMES)}


class SeverityDataset(Dataset):
    def __init__(self, items: list[tuple[Path, int]], transform=None):
        self.items = items
        self.transform = transform

    def __len__(self) -> int:
        return len(self.items)

    def __getitem__(self, idx: int):
        path, label = self.items[idx]
        try:
            img = Image.open(path).convert("RGB")
        except Exception:
            img = Image.new("RGB", (224, 224), (128, 128, 128))
        if self.transform:
            img = self.transform(img)
        return img, label

    def class_labels(self) -> list[int]:
        return [lbl for _, lbl in self.items]


def gather_severity(src: Path) -> list[tuple[Path, int]]:
    items: list[tuple[Path, int]] = []
    for cname, cid in NAME_TO_ID.items():
        d = src / cname
        if not d.is_dir():
            print(f"[warn] missing severity folder: {d}")
            continue
        for p in d.iterdir():
            if p.suffix.lower() in (".jpg", ".jpeg", ".png"):
                items.append((p, cid))
    return items


def split_items(items: list[tuple[Path, int]], seed: int = 42):
    """Stratified 80/10/10 per class."""
    random.seed(seed)
    by_class: dict[int, list] = {}
    for p, cid in items:
        by_class.setdefault(cid, []).append((p, cid))
    train, valid, test = [], [], []
    for cid, lst in by_class.items():
        random.shuffle(lst)
        n = len(lst)
        n_train = int(n * 0.8)
        n_valid = int(n * 0.1)
        train.extend(lst[:n_train])
        valid.extend(lst[n_train:n_train + n_valid])
        test.extend(lst[n_train + n_valid:])
    return train, valid, test


def make_transforms():
    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.6, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(30),
        transforms.ColorJitter(brightness=0.25, contrast=0.25, saturation=0.25, hue=0.05),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1), shear=5),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.1)),
    ])
    eval_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    return train_tf, eval_tf


def make_sampler(ds: SeverityDataset) -> WeightedRandomSampler:
    labels = ds.class_labels()
    count = [0] * len(CLASS_NAMES)
    for l in labels:
        count[l] += 1
    weight = [1.0 / c if c > 0 else 0.0 for c in count]
    sw = [weight[l] for l in labels]
    return WeightedRandomSampler(sw, num_samples=len(labels), replacement=True)


def build_model(num_classes: int) -> nn.Module:
    m = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    m.fc = nn.Linear(m.fc.in_features, num_classes)
    return m


def evaluate(model, loader, device):
    model.eval()
    correct, total, loss_sum = 0, 0, 0.0
    criterion = nn.CrossEntropyLoss()
    all_preds, all_labels = [], []
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


def per_class_acc(preds, labels, num_classes) -> dict[str, float]:
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
    p.add_argument("--src", type=Path,
                   default=ROOT / "datasets_coffee" / "processed" / "cls_severity")
    p.add_argument("--epochs", type=int, default=50)
    p.add_argument("--batch", type=int, default=32)
    p.add_argument("--lr", type=float, default=5e-4)
    p.add_argument("--workers", type=int, default=4)
    p.add_argument("--out", type=Path,
                   default=ROOT / "ai" / "weights" / "coffee_severity_classifier.pt")
    return p.parse_args()


def main():
    args = parse_args()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    items = gather_severity(args.src)
    if not items:
        print(f"[ERROR] Không có ảnh severity tại {args.src}.\n"
              f"Chạy scripts/coffee_train/01_normalize_robusta.py trước.")
        sys.exit(1)

    train_items, valid_items, test_items = split_items(items)
    train_tf, eval_tf = make_transforms()
    train_ds = SeverityDataset(train_items, train_tf)
    valid_ds = SeverityDataset(valid_items, eval_tf)
    test_ds = SeverityDataset(test_items, eval_tf)

    print(f"=== Train ResNet18 — Coffee Rust Severity (5 levels) ===")
    print(f"  Device: {device}")
    if device == "cuda":
        print(f"  GPU   : {torch.cuda.get_device_name(0)}")
    print(f"  Epochs: {args.epochs}  |  Batch: {args.batch}  |  LR: {args.lr}")
    print(f"  Train: {len(train_ds)} | Valid: {len(valid_ds)} | Test: {len(test_ds)}")
    cnt = [0] * len(CLASS_NAMES)
    for _, l in train_items:
        cnt[l] += 1
    print(f"  Train per-class: " + ", ".join(
        f"{CLASS_NAMES[i]}={cnt[i]}" for i in range(len(cnt))
    ))

    sampler = make_sampler(train_ds)
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
        for x, y in train_loader:
            x, y = x.to(device, non_blocking=True), y.to(device, non_blocking=True)
            optimizer.zero_grad()
            with torch.amp.autocast("cuda", enabled=(device == "cuda")):
                out = model(x)
                loss = criterion(out, y)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
            running_loss += loss.item() * x.size(0)
            running_correct += (out.argmax(1) == y).sum().item()
            running_total += y.size(0)
        scheduler.step()
        train_acc = running_correct / running_total
        train_loss = running_loss / running_total

        val_acc, val_loss, _, _ = evaluate(model, valid_loader, device)
        print(f"[ep{epoch:02d}] train_loss={train_loss:.4f} acc={train_acc:.4f}"
              f" | val_loss={val_loss:.4f} acc={val_acc:.4f}")
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
            print(f"   [save] val_acc={val_acc:.4f} → {args.out}")

    # Final test
    print("\n=== Test with best weights ===")
    ckpt = torch.load(args.out, map_location=device, weights_only=False)
    model.load_state_dict(ckpt["state_dict"])
    test_acc, test_loss, preds, labels = evaluate(model, test_loader, device)
    per_cls = per_class_acc(preds, labels, len(CLASS_NAMES))
    print(f"  Test acc: {test_acc:.4f} | loss: {test_loss:.4f}")
    for c, a in per_cls.items():
        print(f"    {c:16s} {a:.4f}")

    meta = {
        "weights_file": str(args.out.relative_to(ROOT)),
        "task": "severity_classification",
        "arch": "resnet18",
        "num_classes": len(CLASS_NAMES),
        "class_names": CLASS_NAMES,
        "input_size": 224,
        "best_val_acc": best_val_acc,
        "test_acc": test_acc,
        "per_class_test_acc": per_cls,
        "history": history,
    }
    args.out.with_suffix(".json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"\n[OK] Metadata → {args.out.with_suffix('.json')}")


if __name__ == "__main__":
    main()
