import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/client/lib/api-client';

// ─── Types ───────────────────────────────────────────────────

export interface PlantScanPlot {
  id: string;
  plotCode: string;
  cropType: string;
  farmer: { id: string; fullName: string };
}

export interface PlantScanSupervisor {
  id: string;
  user: { fullName: string };
}

export interface PlantScanRecord {
  id: string;
  adminId: string;
  supervisorId: string;
  plotId: string | null;
  diseaseEn: string;
  diseaseVi: string;
  causingAgent: string;
  dangerLevel: string;
  category: string;
  symptoms: string;
  treatment: string;
  confidence: number;
  processingMs: number | null;
  imageDataUrl: string | null;
  scannedAt: string;
  supervisor: PlantScanSupervisor;
  plot: PlantScanPlot | null;
}

export interface PlantScanMeta {
  totalScans: number;
  diseaseCount: number;
  healthyCount: number;
  dangerHighCount: number;
}

export interface PlantScanListResponse {
  data: PlantScanRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  meta: PlantScanMeta;
}

// ─── Query params ─────────────────────────────────────────────

export interface PlantScanQueryParams {
  page?: number;
  limit?: number;
  dangerLevel?: string;
  category?: string;
  plotId?: string;
  from?: string;
  to?: string;
}

// ─── API ─────────────────────────────────────────────────────

export const plantScanApi = {
  list: (params: PlantScanQueryParams) =>
    apiGet<{ data: PlantScanListResponse }>('/plant-scans', { params }),
};

// ─── Hooks ───────────────────────────────────────────────────

export const PLANT_SCAN_QUERY_KEY = ['plant-scans'] as const;

export function usePlantScans(params: PlantScanQueryParams = {}) {
  return useQuery({
    queryKey: [...PLANT_SCAN_QUERY_KEY, params],
    queryFn: async (): Promise<PlantScanListResponse> => {
      const res = await plantScanApi.list(params);
      return (res as any).data.data ?? (res as any).data;
    },
    staleTime: 30_000,
  });
}
