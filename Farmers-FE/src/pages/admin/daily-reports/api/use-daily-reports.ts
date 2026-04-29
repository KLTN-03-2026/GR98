import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { dailyReportApi } from './daily-report-api';
import type {
  CreateDailyReportPayload,
  DailyReportResponse,
  DailyReportStatus,
  PaginatedDailyReportsResponse,
  UpdateDailyReportPayload,
} from './types';

export function useDailyReports(params?: {
  page?: number;
  limit?: number;
  status?: DailyReportStatus;
  supervisorId?: string;
  plotId?: string;
  from?: string;
  to?: string;
  search?: string;
  isHarvest?: string;
}) {
  return useQuery({
    queryKey: ['daily-reports', params],
    queryFn: async () => {
      const response = await dailyReportApi.list(params);
      return extractData<PaginatedDailyReportsResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useDailyReport(id: string) {
  return useQuery({
    queryKey: ['daily-report', id],
    queryFn: async () => {
      const response = await dailyReportApi.getById(id);
      return extractData<DailyReportResponse>(response);
    },
    enabled: !!id,
  });
}

export function useCreateDailyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDailyReportPayload) => {
      const response = await dailyReportApi.create(data);
      return extractData<DailyReportResponse>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['daily-report', data.id] });
      toast.success('Đã tạo báo cáo nháp');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể tạo báo cáo');
    },
  });
}

export function useUpdateDailyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateDailyReportPayload }) => {
      const response = await dailyReportApi.update(id, data);
      return extractData<DailyReportResponse>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['daily-report', data.id] });
      toast.success('Đã cập nhật nháp');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể cập nhật báo cáo');
    },
  });
}

export function useSubmitDailyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await dailyReportApi.submit(id);
      return extractData<DailyReportResponse>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      queryClient.invalidateQueries({ queryKey: ['daily-report', data.id] });
      toast.success('Đã gửi báo cáo');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể gửi báo cáo');
    },
  });
}
