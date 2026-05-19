# -*- coding: utf-8 -*-
"""
07 — Swap model cũ (sầu riêng) → model mới (cà phê) trong Farmer-aivision.

Việc cần làm:
  1. Backup weights cũ (durian_*.pt + diseases.json) → ai/weights/_backup_durian/
  2. Copy weights mới: coffee_leaf_detector.pt, coffee_disease_classifier.pt,
     coffee_severity_classifier.pt (giữ nguyên tên — KHÔNG đổi sang durian_*)
  3. Cập nhật .env trong Farmer-aivision (hoặc tạo mới) để Settings trỏ
     sang weights cà phê. Nhờ đó KHÔNG cần sửa code service.
  4. Backup diseases.json cũ → diseases_durian_backup.json; copy
     coffee_diseases.json → diseases.json (file mà disease_knowledge load).

Sau khi chạy script này:
  - Restart FastAPI service (uvicorn).
  - Quét lá cà phê → model mới chạy + diseases.json mới trả về tên bệnh tiếng Việt.

Severity (model thứ 3) chưa được tích hợp vào pipeline service — đó là bước
tiếp theo: thêm severity_service.py + sửa analysis_service.py để gọi nó
khi disease == leaf_rust. Xem README.md trong scripts/coffee_train/.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEIGHTS = ROOT / "ai" / "weights"
BACKUP_DIR = WEIGHTS / "_backup_durian"
ENV_FILE = ROOT / ".env"


REQUIRED = [
    "coffee_leaf_detector.pt",
    "coffee_leaf_detector.json",
    "coffee_disease_classifier.pt",
    "coffee_disease_classifier.json",
    "coffee_severity_classifier.pt",
    "coffee_severity_classifier.json",
]

DURIAN_FILES = [
    "durian_leaf_detector.pt",
    "durian_leaf_detector.json",
    "durian_leaf_classifier.pt",
    "durian_leaf_classifier.json",
    "diseases.json",
]


def check_required() -> bool:
    missing = [f for f in REQUIRED if not (WEIGHTS / f).exists()]
    if missing:
        print("[ERROR] Thiếu weights — train chưa xong:")
        for f in missing:
            print(f"   - {f}")
        print("\nHãy chạy:")
        print("   python scripts/coffee_train/04_train_yolo.py")
        print("   python scripts/coffee_train/05_train_resnet_disease.py")
        print("   python scripts/coffee_train/06_train_resnet_severity.py")
        return False
    return True


def backup_durian() -> None:
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    for fname in DURIAN_FILES:
        src = WEIGHTS / fname
        if src.exists():
            dst = BACKUP_DIR / fname
            shutil.copy2(src, dst)
            print(f"   [backup] {fname} → _backup_durian/")


def update_env() -> None:
    """Append/update các path trong .env để Settings trỏ sang coffee weights."""
    # Đọc env hiện tại
    existing: dict[str, str] = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            existing[k.strip()] = v.strip()

    # Override các key model paths
    updates = {
        "DETECTOR_MODEL_PATH": str((WEIGHTS / "coffee_leaf_detector.pt").resolve()),
        "DETECTOR_LABELS_PATH": str((WEIGHTS / "coffee_leaf_detector.json").resolve()),
        "CLASSIFIER_MODEL_PATH": str((WEIGHTS / "coffee_disease_classifier.pt").resolve()),
    }
    for k, v in updates.items():
        existing[k] = v

    # Ghi lại
    lines_out = []
    if ENV_FILE.exists():
        # Giữ comment + thứ tự cũ
        seen = set()
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                lines_out.append(line)
                continue
            k = stripped.split("=", 1)[0].strip()
            if k in updates:
                lines_out.append(f"{k}={updates[k]}")
                seen.add(k)
            else:
                lines_out.append(line)
        # Thêm key mới chưa có
        for k, v in updates.items():
            if k not in seen:
                lines_out.append(f"{k}={v}")
    else:
        lines_out.append("# Farmer-aivision config — coffee model")
        for k, v in updates.items():
            lines_out.append(f"{k}={v}")

    ENV_FILE.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
    print(f"   [.env] updated: {ENV_FILE}")


def swap_diseases_json() -> None:
    src = WEIGHTS / "coffee_diseases.json"
    dst = WEIGHTS / "diseases.json"
    if not src.exists():
        print(f"[ERROR] coffee_diseases.json missing — KHÔNG swap được.")
        sys.exit(1)
    # Backup cũ
    if dst.exists():
        backup = WEIGHTS / "diseases_durian_backup.json"
        if not backup.exists():
            shutil.copy2(dst, backup)
            print(f"   [backup] diseases.json → diseases_durian_backup.json")
    shutil.copy2(src, dst)
    print(f"   [copy ] coffee_diseases.json → diseases.json")


def main() -> None:
    print("=== Swap durian → coffee model ===\n")

    print("[1/3] Check required weights...")
    if not check_required():
        sys.exit(1)
    print("   All required weights present.")

    print("\n[2/3] Backup durian artifacts...")
    backup_durian()

    print("\n[3/3] Update config (.env) + swap diseases.json...")
    update_env()
    swap_diseases_json()

    print("\n=== Swap done ===")
    print("\nNext steps:")
    print("  1. Restart FastAPI: kill uvicorn cũ, chạy lại")
    print("     python -m app  hoặc  uvicorn app.main:app --reload")
    print("  2. Test endpoint /detect với 1 ảnh lá cà phê")
    print("  3. Tích hợp severity vào analysis_service.py (xem README.md)")
    print("\nRollback nếu cần:")
    print(f"  - Copy lại từ {BACKUP_DIR} ngược về {WEIGHTS}")
    print("  - Xóa hoặc comment 3 dòng DETECTOR/CLASSIFIER trong .env")


if __name__ == "__main__":
    main()
