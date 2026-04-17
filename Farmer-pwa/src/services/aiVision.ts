import axios from 'axios';

const AI_VISION_API_URL = import.meta.env.VITE_AI_VISION_API_URL || 'http://localhost:8000';

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

export interface AIVisionResult {
  benh: BenhInfo;
  thoi_gian_xu_ly_ms?: number;
  timestamp?: string;
}

const aiVisionClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export const analyzeLeafImage = async (imageFile: File): Promise<AIVisionResult> => {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await aiVisionClient.post<AIVisionResult>('/analyze/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
