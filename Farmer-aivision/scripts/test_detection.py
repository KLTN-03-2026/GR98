# -*- coding: utf-8 -*-
"""
Test inference: YOLO detection (bounding box) + ResNet classification (whole-image)
trên tập valid của merged_yolo dataset.

Dùng label filenames để lấy ground-truth class → so sánh với prediction của cả 2 model.
Output: bảng per-class accuracy + confusion summary.
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from collections import defaultdict

import torch
import torch.nn as nn
from PIL import Image
from torchvision import models, transforms
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent

# ── detector metadata ──────────────────────────────────────────────────────
DETECTOR_META = ROOT / "ai" / "weights" / "durian_leaf_detector.json"
# ── classifier metadata + weights ───────────────────────────────────────────
CLASSIFIER_PT = ROOT / "ai" / "weights" / "durian_leaf_classifier.pt"
CLASSIFIER_META_PATH = ROOT / "ai" / "weights" / "durian_leaf_classifier.json"
# ── dataset ─────────────────────────────────────────────────────────────────
VALID_IMG_DIR = ROOT / "dataset dowload" / "merged_yolo" / "valid" / "images"
VALID_LBL_DIR = ROOT / "dataset dowload" / "merged_yolo" / "valid" / "labels"

# 9 detection classes (index → name)
DETECTOR_NAMES = [
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

# 6 classification classes (folder-sorted alphabetically)
CLASSIFIER_CLASSES = [
    "Leaf_Algal",
    "Leaf_Blight",
    "Leaf_Colletotrichum",
    "Leaf_Healthy",
    "Leaf_Phomopsis",
    "Leaf_Rhizoctonia",
]

# Map detection class → nearest classification class (heuristic)
DET_TO_CLASS = {
    "Healthy_leaf":        "Leaf_Healthy",
    "Leaf_Blight":        "Leaf_Blight",
    "Leaf_Phytophthora":   "Leaf_Blight",   # closest proxy
    "Leaf_Spot":          "Leaf_Algal",     # closest proxy
    "leaf_blight_anthracnose":  "Leaf_Colletotrichum",
    "leaf_blight_phyllosticta": "Leaf_Colletotrichum",
    "leaf_blight_rhizoctonia":  "Leaf_Rhizoctonia",
    "leaf_spot_algal":          "Leaf_Algal",
    "leaf_spot_pseudocercospora": "Leaf_Colletotrichum",
}

# ── helpers ─────────────────────────────────────────────────────────────────

def _classify_by_filename(fname: str) -> str | None:
    """Extract ground-truth detection class from label filename prefix."""
    name = Path(fname).stem  # e.g. "_LeafBlight103_jpg.rf.xxx"
    # strip YOLO suffix
    for sep in ("_jpg", ".jpg", "_jpeg", ".jpeg", "_png", ".png"):
        idx = name.find(sep)
        if idx >= 0:
            name = name[:idx]
            break
    # remove leading underscore
    name = name.lstrip("_")
    return name


def _guess_det_class(label_path: Path) -> str | None:
    """Read label file, return class name if single-class."""
    if not label_path.exists():
        return None
    lines = label_path.read_text(encoding="utf-8").strip().splitlines()
    if not lines:
        return None
    first = lines[0].strip()
    if not first:
        return None
    try:
        cls_id = int(float(first.split()[0]))
        return DETECTOR_NAMES[cls_id]
    except (ValueError, IndexError):
        return None


def _build_classifier(device: torch.device):
    """Build + load ResNet18 classifier."""
    ckpt = torch.load(CLASSIFIER_PT, map_location=device, weights_only=False)
    class_names = ckpt.get("class_names", CLASSIFIER_CLASSES)
    num_classes = len(class_names)
    imgsz = int(ckpt.get("imgsz", 224))
    m = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    m.fc = nn.Linear(m.fc.in_features, num_classes)
    m.load_state_dict(ckpt["model_state_dict"])
    m.eval()
    m.to(device)
    tfm = transforms.Compose([
        transforms.Resize((imgsz, imgsz)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    return m, tfm, class_names


def _classify_image(model, tfm, img_path: Path, device: torch.device):
    img = Image.open(img_path).convert("RGB")
    x = tfm(img).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)
        conf, idx = probs.max(dim=1)
    i = int(idx.item())
    return i, float(conf.item())


def _detect_image(detector, img_path: Path):
    """Run YOLO detection, return list of (class_id, confidence)."""
    results = detector.predict(str(img_path), verbose=False, imgsz=640)
    if not results:
        return []
    boxes = results[0].boxes
    if boxes is None or len(boxes) == 0:
        return []
    dets = []
    for box in boxes:
        cls_id = int(box.cls.item())
        conf = float(box.conf.item())
        dets.append((cls_id, conf))
    return dets


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 70)
    print("  TEST: YOLO Detection + ResNet Classification")
    print("=" * 70)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"  Device : {device}\n")

    # ── 1. Load detector ────────────────────────────────────────────────────
    det_meta = json.loads(DETECTOR_META.read_text(encoding="utf-8"))
    det_path = det_meta["weights_file"]
    if not Path(det_path).is_absolute():
        det_path = ROOT / det_path
    print(f"  Detector: {det_path}")
    print(f"  Classes : {len(det_meta['names'])}")
    detector = YOLO(str(det_path))
    detector.to(device)
    print(f"  Detector loaded ✓\n")

    # ── 2. Load classifier ─────────────────────────────────────────────────
    if not CLASSIFIER_PT.exists():
        print(f"  WARNING: Classifier not found at {CLASSIFIER_PT}")
        print("  Skipping classifier test.\n")
        classifier = None
        clf_classes = []
    else:
        clf_meta = {}
        if CLASSIFIER_META_PATH.exists():
            clf_meta = json.loads(CLASSIFIER_META_PATH.read_text(encoding="utf-8"))
        classifier, clf_tfm, clf_classes = _build_classifier(device)
        print(f"  Classifier: {CLASSIFIER_PT}")
        print(f"  Classes   : {clf_classes}")
        print(f"  Classifier loaded ✓\n")

    # ── 3. Collect validation images ───────────────────────────────────────
    if not VALID_IMG_DIR.exists():
        print(f"  ERROR: Valid images dir not found: {VALID_IMG_DIR}")
        return
    img_files = sorted([
        f for f in VALID_IMG_DIR.rglob("*")
        if f.suffix.lower() in {".jpg", ".jpeg", ".png"}
    ])
    n_images = len(img_files)
    print(f"  Valid images: {n_images}\n")

    if n_images == 0:
        print("  ERROR: No images found. Check dataset path.")
        return

    # ── 4. Run inference ───────────────────────────────────────────────────
    # Per-class stats
    det_stats = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    clf_stats = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    det_by_conf: list[tuple[str, str, float]] = []   # (filename, pred, conf)
    clf_by_conf: list[tuple[str, str, float]] = []
    no_detections = 0
    errors = 0

    t0 = time.perf_counter()
    for img_path in img_files:
        fname = img_path.name
        lbl_path = VALID_LBL_DIR / (img_path.stem + ".txt")

        # Ground-truth detection class
        gt_det_cls_id = None
        if lbl_path.exists():
            lines = lbl_path.read_text(encoding="utf-8").strip().splitlines()
            if lines:
                try:
                    gt_det_cls_id = int(float(lines[0].split()[0]))
                except (ValueError, IndexError):
                    pass

        # ── YOLO detection ─────────────────────────────────────────────────
        dets = _detect_image(detector, img_path)
        if not dets:
            no_detections += 1
            # No detection → treat as negative for all classes
            if gt_det_cls_id is not None:
                det_stats[DETECTOR_NAMES[gt_det_cls_id]]["fn"] += 1

        best_det_cls = None
        best_det_conf = 0.0
        for cls_id, conf in dets:
            if conf > best_det_conf:
                best_det_conf = conf
                best_det_cls = DETECTOR_NAMES[cls_id]

        if best_det_cls is not None:
            det_by_conf.append((fname, best_det_cls, best_det_conf))
            if gt_det_cls_id is not None:
                if best_det_cls == DETECTOR_NAMES[gt_det_cls_id]:
                    det_stats[best_det_cls]["tp"] += 1
                else:
                    det_stats[best_det_cls]["fp"] += 1
                    det_stats[DETECTOR_NAMES[gt_det_cls_id]]["fn"] += 1
        elif gt_det_cls_id is not None:
            det_stats[DETECTOR_NAMES[gt_det_cls_id]]["fn"] += 1

        # ── ResNet classification ───────────────────────────────────────────
        if classifier is not None:
            pred_idx, pred_conf = _classify_image(classifier, clf_tfm, img_path, device)
            pred_clf_cls = clf_classes[pred_idx]

            # Map ground-truth detection class → classifier class
            gt_clf_cls = None
            if gt_det_cls_id is not None:
                det_cls_name = DETECTOR_NAMES[gt_det_cls_id]
                gt_clf_cls = DET_TO_CLASS.get(det_cls_name)

            clf_by_conf.append((fname, pred_clf_cls, pred_conf))

            if gt_clf_cls is not None:
                if pred_clf_cls == gt_clf_cls:
                    clf_stats[pred_clf_cls]["tp"] += 1
                else:
                    clf_stats[pred_clf_cls]["fp"] += 1
                    clf_stats[gt_clf_cls]["fn"] += 1
            elif pred_clf_cls:
                clf_stats[pred_clf_cls]["fp"] += 1

    elapsed = time.perf_counter() - t0
    print(f"  Inference done in {elapsed:.1f}s ({elapsed/max(n_images,1)*1000:.1f}ms/img)\n")

    # ── 5. Results ──────────────────────────────────────────────────────────
    print("=" * 70)
    print("  YOLO DETECTION RESULTS")
    print("=" * 70)

    all_classes = sorted(set(DETECTOR_NAMES) | set(det_stats.keys()))
    rows = []
    for cls in all_classes:
        s = det_stats[cls]
        tp, fp, fn = s["tp"], s["fp"], s["fn"]
        total = tp + fp + fn
        if total == 0:
            continue
        recall = tp / max(tp + fn, 1)
        precision = tp / max(tp + fp, 1)
        f1 = 2 * precision * recall / max(precision + recall, 1e-9)
        rows.append((cls, tp, fp, fn, recall, precision, f1))
        print(f"  {cls:<28}  TP={tp:3d}  FP={fp:3d}  FN={fn:3d}  "
              f"Recall={recall:.3f}  Prec={precision:.3f}  F1={f1:.3f}")

    # Overall
    all_tp = sum(det_stats[c]["tp"] for c in all_classes)
    all_fp = sum(det_stats[c]["fp"] for c in all_classes)
    all_fn = sum(det_stats[c]["fn"] for c in all_classes)
    overall_recall = all_tp / max(all_tp + all_fn, 1)
    overall_prec = all_tp / max(all_tp + all_fp, 1)
    overall_f1 = 2 * overall_prec * overall_recall / max(overall_prec + overall_recall, 1e-9)
    print(f"\n  Overall — Recall={overall_recall:.3f}  Precision={overall_prec:.3f}  F1={overall_f1:.3f}")
    print(f"  Images with no detection: {no_detections}/{n_images}")

    # ── Classifier results ──────────────────────────────────────────────────
    if classifier is not None:
        print("\n" + "=" * 70)
        print("  RESNET CLASSIFICATION RESULTS")
        print("=" * 70)

        clf_all_classes = sorted(set(clf_classes) | set(clf_stats.keys()))
        c_rows = []
        for cls in clf_all_classes:
            s = clf_stats[cls]
            tp, fp, fn = s["tp"], s["fp"], s["fn"]
            total = tp + fp + fn
            if total == 0:
                continue
            recall = tp / max(tp + fn, 1)
            precision = tp / max(tp + fp, 1)
            f1 = 2 * precision * recall / max(precision + recall, 1e-9)
            c_rows.append((cls, tp, fp, fn, recall, precision, f1))
            print(f"  {cls:<28}  TP={tp:3d}  FP={fp:3d}  FN={fn:3d}  "
                  f"Recall={recall:.3f}  Prec={precision:.3f}  F1={f1:.3f}")

        c_all_tp = sum(clf_stats[c]["tp"] for c in clf_all_classes)
        c_all_fp = sum(clf_stats[c]["fp"] for c in clf_all_classes)
        c_all_fn = sum(clf_stats[c]["fn"] for c in clf_all_classes)
        c_overall_recall = c_all_tp / max(c_all_tp + c_all_fn, 1)
        c_overall_prec = c_all_tp / max(c_all_tp + c_all_fp, 1)
        c_overall_f1 = 2 * c_overall_prec * c_overall_recall / max(c_overall_prec + c_overall_recall, 1e-9)
        print(f"\n  Overall — Recall={c_overall_recall:.3f}  Precision={c_overall_prec:.3f}  F1={c_overall_f1:.3f}")

    print("\n" + "=" * 70)
    print("  DONE")
    print("=" * 70)


if __name__ == "__main__":
    main()
