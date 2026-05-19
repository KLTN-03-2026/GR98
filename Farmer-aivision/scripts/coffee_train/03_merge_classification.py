# -*- coding: utf-8 -*-
"""
03 — Merge classification dataset (cho ResNet disease classifier).

Input  :
  (a) JMuBEN (Kaggle, 58k ảnh, 5 folders)
      datasets_coffee/raw/archive/JMuBEN/{Cerscospora, Healthy, Leaf rust, Miner, Phoma}/
  (b) Saposoa (Mendeley, 3 folders)
      datasets_coffee/raw/Coffee leaf dataset by phytosanitary class/
        Coffee leaf dataset by phytosanitary class/coffee_leaves/
        {Ojo_Gallo, Roya, Sanas}/
  (c) Robusta YOLO crops (sau script 01 + crop bbox lúc chạy)
      datasets_coffee/processed/_intermediate/robusta_yolo/{images,labels}/

Output : datasets_coffee/processed/cls_disease/
         ├── manifest.csv   (path, class_id, split, source)
         └── crops/         (chỉ chứa crops từ Robusta — JMuBEN/Saposoa giữ nguyên path gốc)

7 unified classes:
  0=healthy, 1=leaf_rust, 2=cercospora, 3=miner,
  4=phoma, 5=red_spider_mite, 6=ojo_gallo

Note:
- KHÔNG copy 60k JMuBEN ảnh — chỉ ghi manifest trỏ tới ảnh gốc (tiết kiệm 2GB disk).
- Robusta thì cần crop theo bbox để chỉ giữ vùng lá → save vào crops/.
- Split 80/10/10 random theo class (stratified).
"""
from __future__ import annotations

import csv
import random
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "datasets_coffee" / "raw"

# Sources
JMUBEN_DIR = RAW_DIR / "archive" / "JMuBEN"
SAPOSOA_DIR = (
    RAW_DIR / "Coffee leaf dataset by phytosanitary class"
    / "Coffee leaf dataset by phytosanitary class" / "coffee_leaves"
)
ROBUSTA_IMG = ROOT / "datasets_coffee" / "processed" / "_intermediate" / "robusta_yolo" / "images"
ROBUSTA_LBL = ROOT / "datasets_coffee" / "processed" / "_intermediate" / "robusta_yolo" / "labels"

OUT_DIR = ROOT / "datasets_coffee" / "processed" / "cls_disease"
OUT_CROPS = OUT_DIR / "crops"

UNIFIED_NAMES = [
    "healthy", "leaf_rust", "cercospora", "miner",
    "phoma", "red_spider_mite", "ojo_gallo",
]
NAME_TO_ID = {n: i for i, n in enumerate(UNIFIED_NAMES)}

# Map folder name → unified class
JMUBEN_MAP = {
    "Healthy": "healthy",
    "Leaf rust": "leaf_rust",
    "Cerscospora": "cercospora",
    "Miner": "miner",
    "Phoma": "phoma",
}
SAPOSOA_MAP = {
    "Sanas": "healthy",
    "Roya": "leaf_rust",
    "Ojo_Gallo": "ojo_gallo",
}
# Robusta YOLO class id → unified class
ROBUSTA_YOLO_MAP = {0: "healthy", 1: "leaf_rust", 2: "red_spider_mite"}

SEED = 42
SPLIT_RATIOS = {"train": 0.8, "valid": 0.1, "test": 0.1}


def gather_jmuben() -> list[tuple[Path, str, str]]:
    """Return list of (path, unified_class_name, source)."""
    items = []
    for folder, cname in JMUBEN_MAP.items():
        d = JMUBEN_DIR / folder
        if not d.is_dir():
            print(f"[warn] JMuBEN folder missing: {d}")
            continue
        for p in d.iterdir():
            if p.suffix.lower() in (".jpg", ".jpeg", ".png"):
                items.append((p, cname, "jmuben"))
    return items


def gather_saposoa() -> list[tuple[Path, str, str]]:
    items = []
    for folder, cname in SAPOSOA_MAP.items():
        d = SAPOSOA_DIR / folder
        if not d.is_dir():
            print(f"[warn] Saposoa folder missing: {d}")
            continue
        for p in d.iterdir():
            if p.suffix.lower() in (".jpg", ".jpeg", ".png"):
                items.append((p, cname, "saposoa"))
    return items


def crop_robusta() -> list[tuple[Path, str, str]]:
    """
    Crop Robusta ảnh theo YOLO bbox (vùng lá) → save vào crops/.
    Return list (crop_path, class_name, "robusta").
    """
    if not ROBUSTA_IMG.is_dir():
        print(f"[warn] Robusta intermediate missing — chạy script 01 trước.")
        return []
    OUT_CROPS.mkdir(parents=True, exist_ok=True)
    items = []
    for img_path in ROBUSTA_IMG.iterdir():
        if img_path.suffix.lower() not in (".jpg", ".jpeg", ".png"):
            continue
        lbl_path = ROBUSTA_LBL / (img_path.stem + ".txt")
        if not lbl_path.exists():
            continue
        line = lbl_path.read_text(encoding="utf-8").strip().splitlines()[0]
        parts = line.split()
        if len(parts) < 5:
            continue
        try:
            cid = int(parts[0])
            cx, cy, nw, nh = map(float, parts[1:5])
        except ValueError:
            continue
        cname = ROBUSTA_YOLO_MAP.get(cid)
        if cname is None:
            continue
        # Crop
        try:
            with Image.open(img_path) as im:
                W, H = im.size
                xmin = max(0, int((cx - nw / 2) * W))
                ymin = max(0, int((cy - nh / 2) * H))
                xmax = min(W, int((cx + nw / 2) * W))
                ymax = min(H, int((cy + nh / 2) * H))
                if xmax - xmin < 20 or ymax - ymin < 20:
                    continue
                crop = im.crop((xmin, ymin, xmax, ymax))
                out_path = OUT_CROPS / f"robusta_{img_path.stem}.jpg"
                crop.convert("RGB").save(out_path, quality=92)
                items.append((out_path, cname, "robusta"))
        except Exception as e:
            print(f"[warn] crop fail {img_path.name}: {e}")
    return items


def stratified_split(items_by_class: dict[str, list]) -> list[tuple[Path, str, str, str]]:
    """Return list (path, cname, source, split)."""
    out = []
    random.seed(SEED)
    for cname, items in items_by_class.items():
        random.shuffle(items)
        n = len(items)
        n_train = int(n * SPLIT_RATIOS["train"])
        n_valid = int(n * SPLIT_RATIOS["valid"])
        for i, (p, cn, src) in enumerate(items):
            if i < n_train:
                split = "train"
            elif i < n_train + n_valid:
                split = "valid"
            else:
                split = "test"
            out.append((p, cn, src, split))
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("[1/4] Gathering JMuBEN...")
    items_jmuben = gather_jmuben()
    print(f"      {len(items_jmuben)} items")

    print("[2/4] Gathering Saposoa...")
    items_saposoa = gather_saposoa()
    print(f"      {len(items_saposoa)} items")

    print("[3/4] Cropping Robusta...")
    items_robusta = crop_robusta()
    print(f"      {len(items_robusta)} items")

    # Group by class
    by_class: dict[str, list] = {n: [] for n in UNIFIED_NAMES}
    for src_list in (items_jmuben, items_saposoa, items_robusta):
        for p, cname, src in src_list:
            if cname in by_class:
                by_class[cname].append((p, cname, src))

    print("\n[4/4] Stratified split + write manifest...")
    all_items = stratified_split(by_class)

    manifest_path = OUT_DIR / "manifest.csv"
    with manifest_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["path", "class_id", "class_name", "source", "split"])
        for path, cname, src, split in all_items:
            writer.writerow([str(path), NAME_TO_ID[cname], cname, src, split])

    # Stats
    print("\n=== Classification merge done ===")
    print(f"  Total: {len(all_items)}")
    print("\n  Per-class distribution:")
    for cname in UNIFIED_NAMES:
        items = by_class[cname]
        n_total = len(items)
        sources = {}
        for _, _, src in items:
            sources[src] = sources.get(src, 0) + 1
        src_str = ", ".join(f"{k}={v}" for k, v in sources.items())
        print(f"    [{NAME_TO_ID[cname]}] {cname:18s} {n_total:6d}  ({src_str})")

    print("\n  Per-split distribution:")
    split_count: dict[str, int] = {}
    for _, _, _, split in all_items:
        split_count[split] = split_count.get(split, 0) + 1
    for split in ("train", "valid", "test"):
        print(f"    {split:8s} {split_count.get(split, 0)}")

    print(f"\n  Manifest: {manifest_path}")
    print(f"  Robusta crops: {OUT_CROPS}")


if __name__ == "__main__":
    main()
