import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { lotApi } from './api';
import type { Product } from '@/client/types';
import type { InventoryLot, LotTrace, CreateLotInput, QualityGrade } from './types';

export const lotKeys = {
  all: ['lots'] as const,
  lists: () => [...lotKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...lotKeys.lists(), params] as const,
  details: () => [...lotKeys.all, 'detail'] as const,
  detail: (id: string) => [...lotKeys.details(), id] as const,
};

export const useGetLots = (params: { warehouseId?: string; productId?: string; qualityGrade?: string }) => {
  return useQuery({
    queryKey: lotKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const response = await lotApi.getLots(params);
      return extractData<InventoryLot[]>(response);
    },
  });
};

export const useCreateLot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLotInput) => {
      const response = await lotApi.createLot(data);
      return extractData<InventoryLot>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lotKeys.lists() });
    },
  });
};

export const useGetLotTrace = (id: string) => {
  return useQuery({
    queryKey: lotKeys.detail(id),
    queryFn: async () => {
      const response = await lotApi.getLotTrace(id);
      return extractData<LotTrace>(response);
    },
    enabled: !!id,
  });
};

export const useGetProducts = () => {
  return useQuery({
    queryKey: ['inventory', 'products'],
    queryFn: async () => {
      const response = await lotApi.getProducts();
      return extractData<Product[]>(response);
    },
  });
};

export const useGetContracts = () => {
  return useQuery({
    queryKey: ['inventory', 'contracts'],
    queryFn: async () => {
      const response = await lotApi.getContracts();
      return extractData<{ 
        id: string; 
        contractNo: string; 
        farmer: { fullName: string }; 
        plot: { plotCode: string };
        product: { id: string; name: string };
        grade: QualityGrade;
      }[]>(response);
    },
  });
};

export const useUpdateLotGrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; qualityGrade: string; note: string }) => {
      const response = await lotApi.updateLotGrade(id, data);
      return extractData<InventoryLot>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: lotKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lotKeys.detail(data.id) });
    },
  });
};
