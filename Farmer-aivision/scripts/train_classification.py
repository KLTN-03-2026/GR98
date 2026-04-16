"""Train a ResNet-based image classifier on folder-organized plant disease images.

Dataset layout (classification — mỗi thư mục con = một lớp):
    ai/datasets/plant_disease/images/train/Leaf_Algal/*.jpg
    ai/datasets/plant_disease/images/train/Leaf_Blight/*.jpg
    ...

Optional validation:
    ai/datasets/plant_disease/images/val/<same class folder names>/

Nếu `val` trống hoặc không có ảnh, script tự chia một phần `train` làm validation.

API dùng bản dịch EN/VI: chỉnh `ai/datasets/plant_disease/class_labels.json` (key = tên folder, ví dụ Leaf_Algal).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset, random_split
from torchvision import datasets, models, transforms

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from app.core.logging import get_logger, setup_logging  # noqa: E402

logger = get_logger(__name__)

DEFAULT_DATA_ROOT = ROOT / "ai" / "datasets" / "plant_disease" / "images"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Train ResNet18 classifier (folder = class label)")
    p.add_argument("--data-root", type=Path, default=DEFAULT_DATA_ROOT, help="Path to .../images")
    p.add_argument("--epochs", type=int, default=30)
    p.add_argument("--batch", type=int, default=32)
    p.add_argument("--lr", type=float, default=1e-4)
    p.add_argument("--imgsz", type=int, default=224)
    p.add_argument("--val-ratio", type=float, default=0.2, help="Used only when val/ has no usable images")
    p.add_argument("--device", default=None, help="cpu | cuda (default: auto)")
    p.add_argument(
        "--out",
        type=Path,
        default=ROOT / "ai" / "weights" / "durian_leaf_classifier.pt",
        help="Output .pt (weights + meta in sidecar .json)",
    )
    return p.parse_args()


def _count_images(folder: Path) -> int:
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    return sum(1 for f in folder.rglob("*") if f.suffix.lower() in exts)


def build_loaders(
    data_root: Path,
    imgsz: int,
    batch: int,
    val_ratio: float,
) -> tuple[DataLoader, DataLoader, list[str]]:
    train_dir = data_root / "train"
    val_dir = data_root / "val"
    if not train_dir.is_dir():
        raise FileNotFoundError(f"Missing train folder: {train_dir}")

    train_tf = transforms.Compose(
        [
            transforms.Resize((imgsz, imgsz)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )
    val_tf = transforms.Compose(
        [
            transforms.Resize((imgsz, imgsz)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )

    full_train = datasets.ImageFolder(train_dir, transform=train_tf)
    class_names = full_train.classes

    use_separate_val = val_dir.is_dir() and any(
        (val_dir / c).is_dir() and _count_images(val_dir / c) > 0 for c in class_names
    )

    if use_separate_val:
        # Chỉ dùng các lớp có trong train; ImageFolder trên val với cùng class mapping
        val_ds = datasets.ImageFolder(val_dir, transform=val_tf)
        if val_ds.classes != full_train.classes:
            logger.warning(
                "val class folders differ from train. train=%s val=%s",
                full_train.classes,
                val_ds.classes,
            )
        train_loader = DataLoader(
            full_train, batch_size=batch, shuffle=True, num_workers=0, pin_memory=torch.cuda.is_available()
        )
        val_loader = DataLoader(
            val_ds, batch_size=batch, shuffle=False, num_workers=0, pin_memory=torch.cuda.is_available()
        )
        return train_loader, val_loader, class_names

    # Split train
    n = len(full_train)
    if n == 0:
        raise RuntimeError(f"No images under {train_dir}")
    n_val = max(1, int(n * val_ratio))
    n_train = n - n_val
    if n_train < 1:
        n_train, n_val = n - 1, 1
    g = torch.Generator().manual_seed(42)
    train_subset, val_subset = random_split(full_train, [n_train, n_val], generator=g)

    # Validation cần transform không augment — tạo bản val với val_tf
    val_indices = val_subset.indices
    val_ds_no_aug = Subset(
        datasets.ImageFolder(train_dir, transform=val_tf),
        val_indices,
    )
    train_loader = DataLoader(
        train_subset, batch_size=batch, shuffle=True, num_workers=0, pin_memory=torch.cuda.is_available()
    )
    val_loader = DataLoader(
        val_ds_no_aug, batch_size=batch, shuffle=False, num_workers=0, pin_memory=torch.cuda.is_available()
    )
    logger.info("No usable val/ — split train into train=%d val=%d", n_train, n_val)
    return train_loader, val_loader, class_names


def main() -> None:
    args = parse_args()
    setup_logging()
    device = torch.device(args.device or ("cuda" if torch.cuda.is_available() else "cpu"))
    logger.info("Device: %s", device)

    train_loader, val_loader, class_names = build_loaders(
        args.data_root, args.imgsz, args.batch, args.val_ratio
    )
    num_classes = len(class_names)
    logger.info("Classes (%d): %s", num_classes, class_names)

    weights = models.ResNet18_Weights.IMAGENET1K_V1
    model = models.resnet18(weights=weights)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr)

    best_acc = 0.0
    args.out.parent.mkdir(parents=True, exist_ok=True)

    for epoch in range(1, args.epochs + 1):
        model.train()
        running = 0.0
        n_seen = 0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()
            running += loss.item() * x.size(0)
            n_seen += x.size(0)
        train_loss = running / max(n_seen, 1)

        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                pred = model(x).argmax(dim=1)
                correct += (pred == y).sum().item()
                total += y.size(0)
        val_acc = correct / max(total, 1)

        logger.info("Epoch %d/%d  train_loss=%.4f  val_acc=%.4f", epoch, args.epochs, train_loss, val_acc)

        if val_acc >= best_acc:
            best_acc = val_acc
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "num_classes": num_classes,
                    "class_names": class_names,
                    "arch": "resnet18",
                    "imgsz": args.imgsz,
                },
                args.out,
            )
            logger.info("Saved best checkpoint -> %s (val_acc=%.4f)", args.out, best_acc)

    meta_path = args.out.with_suffix(".json")
    meta = {
        "weights_file": str(args.out.relative_to(ROOT)),
        "class_names": class_names,
        "class_to_idx": {name: i for i, name in enumerate(class_names)},
        "note": "ImageFolder sorts folders alphabetically; indices match training order.",
    }
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    logger.info("Wrote class map -> %s", meta_path)
    logger.info("Done. Best val_acc=%.4f", best_acc)


if __name__ == "__main__":
    main()
