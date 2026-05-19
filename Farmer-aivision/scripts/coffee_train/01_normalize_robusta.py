# -*- coding: utf-8 -*-
"""
01 — Normalize Robusta (RoCoLE) dataset.

Input  : datasets_coffee/raw/c5yvn32dzg-2/
           ├── Photos/*.jpg        (1560 ảnh)
           └── Annotations/RoCoLE-csv.csv   (polygon + classification)

Output :
  (a) YOLO detection:
      datasets_coffee/processed/_intermediate/robusta_yolo/
          ├── images/{stem}.jpg          (copy)
          └── labels/{stem}.txt          (YOLO bbox: class cx cy w h, normalized)
      Class mapping:
          healthy           → 0
          rust_level_1/2/3/4 → 1 (leaf_rust)
          red_spider_mite   → 2

  (b) Severity classification:
      datasets_coffee/processed/cls_severity/
          ├── healthy/{stem}.jpg
          ├── rust_level_1/{stem}.jpg
          ├── rust_level_2/{stem}.jpg
          ├── rust_level_3/{stem}.jpg
          └── rust_level_4/{stem}.jpg
      (Mỗi ảnh được crop theo bbox của polygon — chỉ giữ vùng lá, bỏ background)
"""
from __future__ import annotations

import ast
import csv
import json
import shutil
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "datasets_coffee" / "raw" / "c5yvn32dzg-2"
PHOTOS_DIR = RAW_DIR / "Photos"
CSV_PATH = RAW_DIR / "Annotations" / "RoCoLE-csv.csv"

OUT_YOLO = ROOT / "datasets_coffee" / "processed" / "_intermediate" / "robusta_yolo"
OUT_SEV = ROOT / "datasets_coffee" / "processed" / "cls_severity"

# Mapping classification → YOLO class id
RUST_LEVELS = {"rust_level_1", "rust_level_2", "rust_level_3", "rust_level_4"}
YOLO_CLASS_MAP = {
    "healthy": 0,
    "leaf_rust": 1,        # gộp 4 mức rust thành 1 class duy nhất cho YOLO
    "red_spider_mite": 2,
}


def classification_to_yolo_class(label: str) -> int | None:
    """Map classification label trong CSV → YOLO class id (hoặc None nếu bỏ)."""
    if label == "healthy":
        return YOLO_CLASS_MAP["healthy"]
    if label in RUST_LEVELS:
        return YOLO_CLASS_MAP["leaf_rust"]
    if label == "red_spider_mite":
        return YOLO_CLASS_MAP["red_spider_mite"]
    return None


def polygon_to_bbox(points: list[dict]) -> tuple[int, int, int, int]:
    """Polygon [{x,y},...] → (xmin, ymin, xmax, ymax)."""
    xs = [p["x"] for p in points]
    ys = [p["y"] for p in points]
    return min(xs), min(ys), max(xs), max(ys)


def parse_label_field(label_str: str) -> tuple[list[dict] | None, str | None]:
    """
    Cột Label trong CSV là JSON dạng:
      {"Leaf":[{"state":"healthy","geometry":[{x,y},...]}],"classification":"healthy"}
    Trả về (geometry, classification_label).
    """
    try:
        data = json.loads(label_str)
    except json.JSONDecodeError:
        # Một số dòng dùng quote khác, thử ast
        try:
            data = ast.literal_eval(label_str)
        except Exception:
            return None, None

    classification = data.get("classification")
    leaves = data.get("Leaf") or data.get("leaf") or []
    if not leaves:
        return None, classification
    # Lấy polygon đầu tiên (thường mỗi ảnh chỉ có 1 lá chính)
    geom = leaves[0].get("geometry")
    return geom, classification


def main() -> None:
    if not CSV_PATH.exists():
        print(f"[ERROR] Không tìm thấy CSV: {CSV_PATH}", file=sys.stderr)
        sys.exit(1)

    OUT_YOLO_IMG = OUT_YOLO / "images"
    OUT_YOLO_LBL = OUT_YOLO / "labels"
    OUT_YOLO_IMG.mkdir(parents=True, exist_ok=True)
    OUT_YOLO_LBL.mkdir(parents=True, exist_ok=True)
    for cls in ["healthy", "rust_level_1", "rust_level_2",
                "rust_level_3", "rust_level_4"]:
        (OUT_SEV / cls).mkdir(parents=True, exist_ok=True)

    stats = {
        "total": 0, "ok_yolo": 0, "ok_severity": 0,
        "skip_no_polygon": 0, "skip_unknown_class": 0,
        "skip_image_missing": 0, "skip_invalid_bbox": 0,
    }
    per_class_yolo: dict[int, int] = {}
    per_class_sev: dict[str, int] = {}

    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            stats["total"] += 1
            external_id = row.get("External ID", "").strip()
            label_str = row.get("Label", "").strip()
            if not external_id or not label_str:
                continue

            polygon, classification = parse_label_field(label_str)
            if classification is None:
                stats["skip_unknown_class"] += 1
                continue

            img_path = PHOTOS_DIR / external_id
            if not img_path.exists():
                stats["skip_image_missing"] += 1
                continue

            # Mở ảnh để biết kích thước
            try:
                with Image.open(img_path) as im:
                    W, H = im.size
            except Exception:
                stats["skip_image_missing"] += 1
                continue

            # === (a) YOLO detection ===
            yolo_cls = classification_to_yolo_class(classification)
            if yolo_cls is not None and polygon:
                xmin, ymin, xmax, ymax = polygon_to_bbox(polygon)
                # Clamp về biên ảnh
                xmin = max(0, min(W - 1, xmin))
                xmax = max(0, min(W - 1, xmax))
                ymin = max(0, min(H - 1, ymin))
                ymax = max(0, min(H - 1, ymax))
                bw = xmax - xmin
                bh = ymax - ymin
                if bw < 10 or bh < 10:
                    stats["skip_invalid_bbox"] += 1
                else:
                    cx = (xmin + xmax) / 2 / W
                    cy = (ymin + ymax) / 2 / H
                    nw = bw / W
                    nh = bh / H
                    stem = Path(external_id).stem
                    # Copy ảnh
                    shutil.copy2(img_path, OUT_YOLO_IMG / external_id)
                    # Ghi label
                    (OUT_YOLO_LBL / f"{stem}.txt").write_text(
                        f"{yolo_cls} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}\n",
                        encoding="utf-8",
                    )
                    stats["ok_yolo"] += 1
                    per_class_yolo[yolo_cls] = per_class_yolo.get(yolo_cls, 0) + 1
            elif yolo_cls is None:
                stats["skip_unknown_class"] += 1
            else:
                stats["skip_no_polygon"] += 1

            # === (b) Severity classification ===
            # Chỉ lấy healthy + rust_level_1..4 (bỏ red_spider_mite cho severity model)
            if classification in {"healthy", *RUST_LEVELS} and polygon:
                xmin, ymin, xmax, ymax = polygon_to_bbox(polygon)
                xmin = max(0, min(W - 1, xmin))
                xmax = max(0, min(W - 1, xmax))
                ymin = max(0, min(H - 1, ymin))
                ymax = max(0, min(H - 1, ymax))
                if (xmax - xmin) >= 20 and (ymax - ymin) >= 20:
                    try:
                        with Image.open(img_path) as im:
                            crop = im.crop((xmin, ymin, xmax, ymax))
                            crop.save(OUT_SEV / classification / external_id,
                                      quality=92)
                        stats["ok_severity"] += 1
                        per_class_sev[classification] = (
                            per_class_sev.get(classification, 0) + 1
                        )
                    except Exception as e:
                        print(f"[warn] crop fail {external_id}: {e}", file=sys.stderr)

    print("\n=== Robusta normalization done ===")
    for k, v in stats.items():
        print(f"  {k:24s} {v}")
    print("\n  YOLO per-class:")
    yolo_names = {v: k for k, v in YOLO_CLASS_MAP.items()}
    for cid, cnt in sorted(per_class_yolo.items()):
        print(f"    [{cid}] {yolo_names[cid]:18s} {cnt}")
    print("\n  Severity per-class:")
    for cls, cnt in sorted(per_class_sev.items()):
        print(f"    {cls:18s} {cnt}")
    print(f"\n  Output YOLO: {OUT_YOLO}")
    print(f"  Output Severity: {OUT_SEV}")


if __name__ == "__main__":
    main()
