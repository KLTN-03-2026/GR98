# -*- coding: utf-8 -*-
"""
02 — Merge YOLO detection dataset.

Input  :
  (a) Roboflow v6 (train/valid/test sẵn): datasets_coffee/raw/coffee leaf.v6i.yolov8/
      Class order: 0=Leaf Rust, 1=Malnutrition, 2=Pest, 3=healthy
  (b) Robusta YOLO (sau script 01): datasets_coffee/processed/_intermediate/robusta_yolo/
      Class order: 0=healthy, 1=leaf_rust, 2=red_spider_mite

Output : datasets_coffee/processed/yolo/
         ├── train/{images,labels}/
         ├── valid/{images,labels}/
         ├── test/{images,labels}/
         └── data.yaml
Unified 5 classes:
  0=healthy, 1=leaf_rust, 2=red_spider_mite, 3=malnutrition, 4=pest

Robusta được random split 80/10/10. Roboflow giữ nguyên split sẵn.
"""
from __future__ import annotations

import random
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Đường dẫn input
ROBOFLOW_DIR = ROOT / "datasets_coffee" / "raw" / "coffee leaf.v6i.yolov8"
ROBUSTA_DIR = ROOT / "datasets_coffee" / "processed" / "_intermediate" / "robusta_yolo"

# Đường dẫn output
OUT_DIR = ROOT / "datasets_coffee" / "processed" / "yolo"

# Unified class
UNIFIED_NAMES = ["healthy", "leaf_rust", "red_spider_mite", "malnutrition", "pest"]

# Roboflow → unified id
ROBOFLOW_REMAP = {
    0: 1,  # Leaf Rust    → leaf_rust
    1: 3,  # Malnutrition → malnutrition
    2: 4,  # Pest         → pest
    3: 0,  # healthy      → healthy
}
# Robusta → unified id (cùng thứ tự sẵn từ script 01)
ROBUSTA_REMAP = {
    0: 0,  # healthy         → healthy
    1: 1,  # leaf_rust       → leaf_rust
    2: 2,  # red_spider_mite → red_spider_mite
}

SEED = 42
SPLIT_RATIOS = {"train": 0.8, "valid": 0.1, "test": 0.1}


def setup_output_dirs() -> None:
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    for split in SPLIT_RATIOS:
        (OUT_DIR / split / "images").mkdir(parents=True, exist_ok=True)
        (OUT_DIR / split / "labels").mkdir(parents=True, exist_ok=True)


def remap_label_file(src_lbl: Path, dst_lbl: Path,
                     remap: dict[int, int]) -> int:
    """Đọc file label YOLO, remap class id, ghi sang dst. Return số dòng kept."""
    lines_out = []
    for line in src_lbl.read_text(encoding="utf-8").strip().splitlines():
        parts = line.strip().split()
        if len(parts) < 5:
            continue
        try:
            cid = int(parts[0])
        except ValueError:
            continue
        new_cid = remap.get(cid)
        if new_cid is None:
            continue
        lines_out.append(f"{new_cid} " + " ".join(parts[1:]))
    if lines_out:
        dst_lbl.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
    return len(lines_out)


def copy_image(src_img: Path, dst_img: Path) -> None:
    shutil.copy2(src_img, dst_img)


def process_roboflow(stats: dict) -> None:
    """Roboflow đã có train/valid/test sẵn — giữ nguyên split."""
    print("\n[Roboflow v6] processing...")
    for split in ("train", "valid", "test"):
        src_img_dir = ROBOFLOW_DIR / split / "images"
        src_lbl_dir = ROBOFLOW_DIR / split / "labels"
        if not src_img_dir.exists():
            continue
        for img_path in src_img_dir.iterdir():
            if img_path.suffix.lower() not in (".jpg", ".jpeg", ".png"):
                continue
            lbl_path = src_lbl_dir / (img_path.stem + ".txt")
            if not lbl_path.exists():
                continue
            new_stem = f"rf_{img_path.stem}"
            dst_img = OUT_DIR / split / "images" / f"{new_stem}{img_path.suffix}"
            dst_lbl = OUT_DIR / split / "labels" / f"{new_stem}.txt"
            kept = remap_label_file(lbl_path, dst_lbl, ROBOFLOW_REMAP)
            if kept > 0:
                copy_image(img_path, dst_img)
                stats[f"roboflow_{split}"] = stats.get(f"roboflow_{split}", 0) + 1


def process_robusta(stats: dict) -> None:
    """Robusta chưa có split — random 80/10/10."""
    print("[Robusta] processing...")
    src_img_dir = ROBUSTA_DIR / "images"
    src_lbl_dir = ROBUSTA_DIR / "labels"
    images = sorted([
        p for p in src_img_dir.iterdir()
        if p.suffix.lower() in (".jpg", ".jpeg", ".png")
    ])
    random.seed(SEED)
    random.shuffle(images)
    n = len(images)
    n_train = int(n * SPLIT_RATIOS["train"])
    n_valid = int(n * SPLIT_RATIOS["valid"])
    splits = (
        [("train", img) for img in images[:n_train]]
        + [("valid", img) for img in images[n_train:n_train + n_valid]]
        + [("test", img) for img in images[n_train + n_valid:]]
    )
    for split, img_path in splits:
        lbl_path = src_lbl_dir / (img_path.stem + ".txt")
        if not lbl_path.exists():
            continue
        new_stem = f"rb_{img_path.stem}"
        dst_img = OUT_DIR / split / "images" / f"{new_stem}{img_path.suffix}"
        dst_lbl = OUT_DIR / split / "labels" / f"{new_stem}.txt"
        kept = remap_label_file(lbl_path, dst_lbl, ROBUSTA_REMAP)
        if kept > 0:
            copy_image(img_path, dst_img)
            stats[f"robusta_{split}"] = stats.get(f"robusta_{split}", 0) + 1


def write_data_yaml() -> None:
    yaml_str = (
        "train: train/images\n"
        "val: valid/images\n"
        "test: test/images\n\n"
        f"nc: {len(UNIFIED_NAMES)}\n"
        f"names: {UNIFIED_NAMES}\n"
    )
    (OUT_DIR / "data.yaml").write_text(yaml_str, encoding="utf-8")


def count_per_class() -> dict[int, int]:
    per_class: dict[int, int] = {}
    for split in SPLIT_RATIOS:
        lbl_dir = OUT_DIR / split / "labels"
        for lbl in lbl_dir.iterdir():
            for line in lbl.read_text(encoding="utf-8").splitlines():
                parts = line.strip().split()
                if not parts:
                    continue
                try:
                    cid = int(parts[0])
                    per_class[cid] = per_class.get(cid, 0) + 1
                except ValueError:
                    pass
    return per_class


def main() -> None:
    setup_output_dirs()
    stats: dict[str, int] = {}
    process_roboflow(stats)
    process_robusta(stats)
    write_data_yaml()

    print("\n=== Merge YOLO done ===")
    for k in sorted(stats.keys()):
        print(f"  {k:25s} {stats[k]}")

    print("\n  Per-class instances (across all splits):")
    per_class = count_per_class()
    for cid in sorted(per_class):
        print(f"    [{cid}] {UNIFIED_NAMES[cid]:18s} {per_class[cid]}")

    total = sum(stats.values())
    print(f"\n  Total images: {total}")
    print(f"  Output: {OUT_DIR}")
    print(f"  data.yaml: {OUT_DIR / 'data.yaml'}")


if __name__ == "__main__":
    main()
