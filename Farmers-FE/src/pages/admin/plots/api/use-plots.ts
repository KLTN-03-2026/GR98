import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { plotApi } from './plot-api';
import type { PlotResponse, PaginatedPlotsResponse, PlotCropType } from './types';

// ─── Queries ────────────────────────────────────────────────────────────────

const LOCAL_PLOT_OVERRIDES_KEY = 'gis_plot_overrides_v1';

const readLocalOverrides = () => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_PLOT_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
};

export function usePlots(params?: {
  page?: number;
  limit?: number;
  search?: string;
  cropType?: PlotCropType;
  id_suppervisor?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params ?? {};
  return useQuery({
    queryKey: ['plots', queryParams],
    enabled,
    queryFn: async () => {
      const response = await plotApi.list(queryParams);
      return extractData<PaginatedPlotsResponse>(response);
    },
    select: (data) => {
      const overrides = readLocalOverrides();
      const mergedData = data.data
        .map((row) => ({
          ...row,
          ...(overrides[row.id] || {}),
        }))
        // The current index.tsx filters out plots that were "deleted" locally.
        // If an override contains a flag or if we just want to follow the current logic,
        // we'll need a way to track "deleted" status in overrides.
        // For now, index.tsx manually filters. Let's provide the merged data.
        // Note: The original handleDelete removes from the 'plots' state, not just overrides.
        // To truly support "local delete" persisting, we'd need a 'deleted' flag in overrides.
        .filter((row) => !overrides[row.id]?.isDeleted);

      return {
        ...data,
        data: mergedData,
        // Recalculate total if items were filtered out locally
        total: data.total - (data.data.length - mergedData.length),
      };
    },
    placeholderData: (prev) => prev,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function useCreatePlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Parameters<typeof plotApi.create>[0]) => {
      const response = await plotApi.create(data);
      return extractData<PlotResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast.success('Đã tạo lô đất mới');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không tạo được lô đất');
    },
  });
}

export function useUpdatePlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof plotApi.update>[1];
    }) => {
      const response = await plotApi.update(id, data);
      return extractData<PlotResponse>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      toast.success('Đã cập nhật lô đất');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không cập nhật được lô đất');
    },
  });
}
