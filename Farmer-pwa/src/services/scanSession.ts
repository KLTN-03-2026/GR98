import apiClient from './apiClient';

export interface ScanSession {
  id: string;
  plotId: string;
  status: 'OPEN' | 'CLOSED' | 'REVIEWED' | 'CANCELLED';
  startedAt: string;
  closedAt: string | null;
  totalScans: number;
  infectedCount: number;
  severity: string | null;
  diseaseSummary: Record<string, number> | null;
  note: string | null;
  _count?: { scans: number };
}

export interface ScanSessionDetail extends ScanSession {
  plot: { id: string; plotCode: string; areaHa: number; cropType: string };
  scans: Array<{
    id: string;
    diseaseEn: string;
    diseaseVi: string;
    dangerLevel: string;
    category: string;
    confidence: number;
    scannedAt: string;
    imageDataUrl: string | null;
  }>;
  recommendations: any[];
}

/**
 * BE luôn wrap response thành `{ success, data }`. Axios `resp.data` là cả
 * wrapper, nên data thực sự nằm ở `resp.data.data`.
 * Lưu ý: null là giá trị hợp lệ (vd. khi không có phiên OPEN), không được
 * fallback về wrapper.
 */
function unwrap<T>(resp: any): T {
  return resp?.data?.data as T;
}

export async function getActiveSession(plotId: string): Promise<ScanSession | null> {
  const res = await apiClient.get('/scan-sessions/active', { params: { plotId } });
  return unwrap<ScanSession | null>(res);
}

export async function createSession(plotId: string, note?: string): Promise<ScanSession> {
  const res = await apiClient.post('/scan-sessions', { plotId, note });
  return unwrap<ScanSession>(res);
}

export async function getSessionDetail(id: string): Promise<ScanSessionDetail> {
  const res = await apiClient.get(`/scan-sessions/${id}`);
  return unwrap<ScanSessionDetail>(res);
}

export async function closeSession(id: string, note?: string): Promise<ScanSession> {
  const res = await apiClient.post(`/scan-sessions/${id}/close`, { note });
  return unwrap<ScanSession>(res);
}

export async function cancelSession(id: string): Promise<ScanSession> {
  const res = await apiClient.post(`/scan-sessions/${id}/cancel`);
  return unwrap<ScanSession>(res);
}
