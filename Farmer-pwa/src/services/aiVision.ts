import axios from 'axios';

// Luôn dùng proxy /api/ai-vision trong dev để tránh CORS
const API_BASE = '/api/ai-vision';

export interface BenhInfo {
  disease: string;
  benh: string;
  tac_nhan?: string;
  do_nguy_hiem: string;
  xuc_tac?: string;
  dieu_tri: string;
  phan_loai: string;
  chi_tiet?: string;
  do_chinh_xac: number;
}

/**
 * Mức độ nặng của bệnh rỉ sắt (rust). Chỉ trả về khi disease == leaf_rust.
 * level_index: 0=healthy, 1-4=rust level (1=nhẹ, 4=rất nặng)
 */
export interface MucDoNangInfo {
  level: string;          // healthy | rust_level_1..4
  level_index: number;    // 0..4
  label_vi: string;       // mô tả tiếng Việt
  do_chinh_xac: number;
}

export interface AIVisionResult {
  benh: BenhInfo;
  muc_do_nang?: MucDoNangInfo | null;
  thoi_gian_xu_ly_ms?: number;
  timestamp?: string;
}

const aiVisionClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

/**
 * Chuẩn hoá cropType về slug — plot.cropType lưu lung tung
 * ("Cà phê" / "ca-phe" / ...) tuỳ form input vs seed data.
 * Đảm bảo BE Farmer-aivision (Python) luôn nhận đúng slug.
 */
export function normalizeCropType(raw: string | null | undefined): string {
  if (!raw) return 'ca-phe';
  const s = raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
  if (s.includes('ca phe') || s === 'ca-phe' || s === 'caphe' || s === 'coffee') {
    return 'ca-phe';
  }
  if (s.includes('sau rieng') || s === 'sau-rieng' || s === 'saurieng' || s === 'durian') {
    return 'sau-rieng';
  }
  return 'ca-phe'; // fallback
}

/**
 * Phân tích ảnh lá. cropType chọn pipeline phù hợp ở BE:
 *  - 'sau-rieng' → YOLO detect 9 bệnh sầu riêng
 *  - 'ca-phe'    → YOLO + ResNet 7 bệnh + Severity cho rỉ sắt (default)
 */
export const analyzeLeafImage = async (
  imageFile: File,
  cropType: string = 'ca-phe',
): Promise<AIVisionResult> => {
  const normalizedCrop = normalizeCropType(cropType);
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('crop_type', normalizedCrop);

  const response = await aiVisionClient.post<AIVisionResult>('/analyze/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
