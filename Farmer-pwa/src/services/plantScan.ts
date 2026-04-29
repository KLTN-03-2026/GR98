import apiClient from './apiClient';
import type { AIVisionResult } from './aiVision';

export interface SaveScanPayload {
  diseaseEn: string;
  diseaseVi: string;
  causingAgent: string;
  dangerLevel: string;
  category: string;
  symptoms: string;
  treatment: string;
  confidence: number;
  processingMs?: number;
  plotId?: string;
  imageDataUrl?: string;
}

/** Chuyển đổi từ AIVisionResult sang SaveScanPayload */
export function mapAIResultToPayload(
  result: AIVisionResult,
  opts?: { plotId?: string; imageDataUrl?: string },
): SaveScanPayload {
  return {
    diseaseEn: result.benh.disease,
    diseaseVi: result.benh.benh,
    causingAgent: result.benh.tac_nhan ?? '',
    dangerLevel: result.benh.do_nguy_hiem,
    category: result.benh.phan_loai,
    symptoms: result.benh.chi_tiet ?? '',
    treatment: result.benh.dieu_tri,
    confidence: result.benh.do_chinh_xac,
    processingMs: result.thoi_gian_xu_ly_ms,
    plotId: opts?.plotId,
    imageDataUrl: opts?.imageDataUrl,
  };
}

/**
 * Tự động lưu kết quả AI lên server sau khi phân tích xong.
 * Fire-and-forget — không block UI, lỗi chỉ log ra console.
 */
export async function saveScanResult(payload: SaveScanPayload): Promise<void> {
  try {
    await apiClient.post('/plant-scans', payload);
  } catch (err) {
    // Không hiện lỗi cho user — đây là background save
    console.warn('[PlantScan] Không thể lưu kết quả quét:', err);
  }
}
