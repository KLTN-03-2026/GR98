import apiClient from './apiClient';

export interface RecommendationPayload {
  diagnosisSummary: string;
  severityAssessment: string;
  recommendation: {
    product: string | null;
    dosagePerHa: string | null;
    totalDosage: string | null;
    sprayInterval: string | null;
    duration: string | null;
  };
  warnings: string[];
  confidence: 'high' | 'medium' | 'low';
  citations: Array<{ source: string; excerpt: string }>;
}

export interface TreatmentRecommendation {
  id: string;
  sessionId: string;
  confidence: string | null;
  payload: RecommendationPayload;
  citations: Array<{ source: string; excerpt: string }>;
  status: 'DRAFT' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
}

function unwrap<T>(resp: any): T {
  return resp?.data?.data as T;
}

/**
 * Gọi Claude RAG qua BE để sinh khuyến nghị. Prompt mới yêu cầu output đầy đủ
 * (~1500-2000 tokens) nên Claude inference qua proxy gwai.cloud có thể mất
 * 30-50s. Vì vậy timeout 90s + auto retry 2 lần khi gặp timeout/network error.
 */
export async function requestRecommendation(
  sessionId: string,
): Promise<TreatmentRecommendation> {
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await apiClient.post(
        `/scan-sessions/${sessionId}/recommend`,
        undefined,
        { timeout: 90_000 }, // 90s đủ cho Claude generate prompt dài
      );
      return unwrap<TreatmentRecommendation>(res);
    } catch (err: any) {
      lastErr = err;
      // Chỉ retry với timeout / network error, KHÔNG retry 4xx/5xx có message
      const isTimeout = err?.code === 'ECONNABORTED' || /timeout/i.test(err?.message ?? '');
      const isNetwork = !err?.response;
      if (attempt < MAX_ATTEMPTS && (isTimeout || isNetwork)) {
        console.warn(`[aiAdvisor] attempt ${attempt} failed (${err?.message}), retrying...`);
        // Backoff ngắn để không spam proxy
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export async function approveRecommendation(
  id: string,
  note?: string,
): Promise<TreatmentRecommendation> {
  const res = await apiClient.post(`/recommendations/${id}/approve`, { note });
  return unwrap<TreatmentRecommendation>(res);
}

export async function rejectRecommendation(
  id: string,
  note?: string,
): Promise<TreatmentRecommendation> {
  const res = await apiClient.post(`/recommendations/${id}/reject`, { note });
  return unwrap<TreatmentRecommendation>(res);
}
