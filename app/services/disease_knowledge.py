"""
Disease knowledge base: maps detected class_key → full Vietnamese + English info.
Add or edit entries in diseases.json — no code changes needed.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_KB_PATH = _PROJECT_ROOT / "ai" / "weights" / "diseases.json"

# ── defaults (fallback if JSON missing) ──────────────────────────────────────

_DEFAULTS: dict[str, dict[str, Any]] = {
    "Healthy_leaf": {
        "disease": "Healthy Leaf",
        "benh": "Lá khỏe mạnh",
        "tac_nhan": "Không có",
        "do_nguy_hiem": "Không",
        "xuc_tac": "Không có",
        "dieu_tri": "Không cần xử lý. Tiếp tục chăm sóc bình thường.",
        "phan_loai": "healthy",
        "chi_tiet": "Cây không có dấu hiệu bệnh. Lá xanh tốt, không có đốm hay tổn thương.",
    },
    "Leaf_Blight": {
        "disease": "Leaf Blight",
        "benh": "Bệnh cháy mép lá",
        "tac_nhan": "Phytophthora palmivora (nấm)",
        "do_nguy_hiem": "Cao",
        "xuc_tac": "Phytophthora palmivora, Pythium sp.",
        "dieu_tri": "Metalaxyl 8WP (2-3 g/l), Fosetyl-Al (Aliette) 80WP (3-4 g/l), Copper-based fungicide (Bordeaux 1%). Phun 2-3 lần cách nhau 7-10 ngày.",
        "phan_loai": "fungal",
        "chi_tiet": "Mép lá khô nâu, lan dần vào phiến lá. Bệnh phát triển mạnh trong điều kiện ẩm ướt, mưa nhiều.",
    },
    "Leaf_Phytophthora": {
        "disease": "Phytophthora Leaf Disease",
        "benh": "Bệnh Phytophthora trên lá",
        "tac_nhan": "Phytophthora palmivora, Phytophthora nicotianae (nấm)",
        "do_nguy_hiem": "Rất cao",
        "xuc_tac": "P. palmivora, P. nicotianae.",
        "dieu_tri": "Metalaxyl 8WP (2.5 g/l), Fosetyl-Al 80WP (4 g/l), Copper hydroxide (Kocide). Phun định kỳ 10-14 ngày/lần khi thời tiết mưa nhiều.",
        "phan_loai": "fungal",
        "chi_tiet": "Lá xuất hiện các vết nâu đen ướt, lan nhanh. Gây rụng lá hàng loạt, cây suy yếu nghiêm trọng.",
    },
    "Leaf_Spot": {
        "disease": "Leaf Spot",
        "benh": "Bệnh đốm lá",
        "tac_nhan": "Alternaria sp., Bipolaris sp., Curvularia sp. (nấm)",
        "do_nguy_hiem": "Trung bình",
        "xuc_tac": "Alternaria alternata, Bipolaris oryzae, Curvularia lunata.",
        "dieu_tri": "Chlorothalonil 75WP (2-3 g/l), Mancozeb 80WP (3-4 g/l), Hexaconazole 5SC (1-1.5 ml/l). Phun 2 lần cách nhau 10-14 ngày.",
        "phan_loai": "fungal",
        "chi_tiet": "Xuất hiện các đốm tròn hoặc bầu dục màu nâu xám trên lá. Đốm có viền vàng bao quanh. Bệnh ảnh hưởng đến quang hợp của cây.",
    },
    "leaf_blight_anthracnose": {
        "disease": "Anthracnose (Leaf Blight)",
        "benh": "Bệnh thán thư (cháy lá)",
        "tac_nhan": "Colletotrichum gloeosporioides, Colletotrichum acutatum (nấm)",
        "do_nguy_hiem": "Cao",
        "xuc_tac": "Colletotrichum gloeosporioides (Penz.) Penz. & Sacc.",
        "dieu_tri": "Carbendazim 50WP (1-2 g/l), Mancozeb 80WP (3 g/l), Copper oxychloride 50WP (3-4 g/l). Phun khi triệu chứng mới xuất hiện.",
        "phan_loai": "fungal",
        "chi_tiet": "Vết bệnh ban đầu là đốm nhỏ màu nâu đen, sau đó lan rộng thành vùng chết khô. Trên vết bệnh có thể thấy các điểm đen nhỏ là quả thể nấm.",
    },
    "leaf_blight_phyllosticta": {
        "disease": "Phyllosticta Leaf Blight",
        "benh": "Bệnh cháy lá do nấm Phyllosticta",
        "tac_nhan": "Phyllosticta durionis, Phyllosticta capitalensis (nấm)",
        "do_nguy_hiem": "Trung bình",
        "xuc_tac": "Phyllosticta durionis Beeli.",
        "dieu_tri": "Mancozeb 80WP (3 g/l), Copper-based fungicide (Copper X, Champion). Phun phòng ngừa đầu mùa mưa. Thu gom lá bệnh tiêu hủy.",
        "phan_loai": "fungal",
        "chi_tiet": "Vết bệnh hình bầu dục hoặc không đều, màu nâu xám với viền nâu đậm. Giữa vết bệnh có thể thấy các quả thể nấm nhỏ màu đen.",
    },
    "leaf_blight_rhizoctonia": {
        "disease": "Rhizoctonia Leaf Blight",
        "benh": "Bệnh cháy lá do nấm Rhizoctonia",
        "tac_nhan": "Rhizoctonia solani (nấm), Thanatephorus cucumeris (giai đoạn hữu tính)",
        "do_nguy_hiem": "Cao",
        "xuc_tac": "Rhizoctonia solani Kühn (AG-1, AG-4).",
        "dieu_tri": "Hexaconazole 5SC (1.5 ml/l), Validamycin 3L (2-3 ml/l), Carbendazim 50WP (1-2 g/l). Kết hợp vệ sinh đồng ruộng, không tưới ngập.",
        "phan_loai": "fungal",
        "chi_tiet": "Bệnh gây các vết khô màu nâu đỏ trên lá, thân và cuống lá. Nấm tồn tại trong đất và mùn gỗ mục. Phát triển mạnh khi độ ẩm cao.",
    },
    "leaf_spot_algal": {
        "disease": "Algal Leaf Spot",
        "benh": "Bệnh đốm rong trên lá",
        "tac_nhan": "Cephaleuros virescens (tảo)",
        "do_nguy_hiem": "Thấp đến trung bình",
        "xuc_tac": "Cephaleuros virescens Kunze ex Fries (tảo lục, bộ Trentepohliales).",
        "dieu_tri": "Copper-based fungicide (Copper hydroxide, Copper oxychloride) 3-4 g/l. Phun 2-3 lần mỗi mùa mưa. Tỉa cành thông thoáng, bón phân cân đối.",
        "phan_loai": "algal",
        "chi_tiet": "Xuất hiện các đốm tròn màu xám xanh hoặc nâu đỏ như rong biển trên bề mặt lá. Bề mặt đốm có thể nứt ra. Chủ yếu ảnh hưởng cây già và cây yếu.",
    },
    "leaf_spot_pseudocercospora": {
        "disease": "Pseudocercospora Leaf Spot",
        "benh": "Bệnh đốm lá do nấm Pseudocercospora",
        "tac_nhan": "Pseudocercospora durionis, Pseudocercospora grisea (nấm)",
        "do_nguy_hiem": "Trung bình",
        "xuc_tac": "Pseudocercospora durionis (Hansf.) Deighton.",
        "dieu_tri": "Hexaconazole 5SC (1-1.5 ml/l), Carbendazim 50WP (1-2 g/l), Mancozeb 80WP (3 g/l). Phun định kỳ 14 ngày/lần. Loại bỏ lá bệnh nặng.",
        "phan_loai": "fungal",
        "chi_tiet": "Đốm lá nhỏ màu xám nâu, đường kính 2-5mm, có viền đậm. Mặt dưới lá có lớp bào tử nấm màu xám đen. Bệnh lan rộng trong điều kiện ẩm.",
    },
}


def _load_kb() -> dict[str, dict[str, Any]]:
    if _KB_PATH.is_file():
        try:
            raw = json.loads(_KB_PATH.read_text(encoding="utf-8"))
            if isinstance(raw, dict) and raw:
                logger.info("Disease knowledge base loaded from %s", _KB_PATH)
                return raw
        except Exception as exc:
            logger.warning("Could not parse diseases.json: %s — using defaults", exc)
    return dict(_DEFAULTS)


_KB: dict[str, dict[str, Any]] = _load_kb()


def get_disease_info(class_key: str) -> dict[str, Any]:
    """Return full disease info dict for a class_key, or a safe fallback."""
    return _KB.get(class_key) or _DEFAULTS.get(class_key) or {
        "disease": class_key,
        "benh": class_key,
        "tac_nhan": "Không xác định",
        "do_nguy_hiem": "Không rõ",
        "xuc_tac": "Không rõ",
        "dieu_tri": "Liên hệ chuyên gia bảo vệ thực vật để được tư vấn.",
        "phan_loai": "unknown",
        "chi_tiet": f"Loại bệnh '{class_key}' chưa có thông tin trong cơ sở dữ liệu.",
    }


def get_all_class_keys() -> list[str]:
    return list(_KB.keys()) or list(_DEFAULTS.keys())
