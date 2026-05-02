import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { lotApi } from './api';
import type { Product } from '@/client/types';
import type { InventoryLot, LotTrace, CreateLotInput, UpdateLotInput, PendingHarvest, LotTransaction, GetLotsFilters } from './types';

export const lotKeys = {
  all: ['lots'] as const,
  lists: () => [...lotKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...lotKeys.lists(), params] as const,
  details: () => [...lotKeys.all, 'detail'] as const,
  detail: (id: string) => [...lotKeys.details(), id] as const,
  pendingHarvests: () => [...lotKeys.all, 'pending-harvests'] as const,
};

export const useGetLots = (params: GetLotsFilters) => {
  return useQuery({
    queryKey: lotKeys.list(params as Record<string, unknown>),
    queryFn: async () => {
      const response = await lotApi.getLots(params);
      return extractData<InventoryLot[]>(response);
    },
  });
};

export const useGetProducts = () => {
  return useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const response = await lotApi.getProducts();
      return extractData<Product[]>(response);
    },
  });
};

export const useGetContracts = () => {
  return useQuery({
    queryKey: ['inventory-contracts'],
    queryFn: async () => {
      const response = await lotApi.getContracts();
      return extractData<any[]>(response);
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
      queryClient.invalidateQueries({ queryKey: lotKeys.all });
    },
  });
};

export const useGetLotById = (id: string) => {
  return useQuery({
    queryKey: lotKeys.detail(id),
    queryFn: async () => {
      const response = await lotApi.getLotById(id);
      return extractData<LotTrace>(response);
    },
    enabled: !!id,
  });
};

export const useGetPendingHarvests = () => {
  return useQuery({
    queryKey: lotKeys.pendingHarvests(),
    queryFn: async () => {
      const response = await lotApi.getPendingHarvests();
      return extractData<PendingHarvest[]>(response);
    },
  });
};

export const useGetWarehouses = () => {
  return useQuery({
    queryKey: ['inventory-warehouses'],
    queryFn: async () => {
      const response = await lotApi.getWarehouses();
      return extractData<any[]>(response);
    },
  });
};

export const useUpdateLot = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLotInput }) => {
      const response = await lotApi.updateLot(id, data);
      return extractData<InventoryLot>(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lotKeys.all });
      queryClient.invalidateQueries({ queryKey: lotKeys.detail(variables.id) });
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await lotApi.createTransaction(data);
      return extractData<any>(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: lotKeys.all });
      if (variables.inventoryLotId) {
        queryClient.invalidateQueries({ queryKey: lotKeys.detail(variables.inventoryLotId) });
        queryClient.invalidateQueries({ queryKey: [...lotKeys.all, 'timeline', variables.inventoryLotId] });
      }
    },
  });
};

export const useGetLotTimeline = (id: string) => {
  return useQuery({
    queryKey: [...lotKeys.all, 'timeline', id],
    queryFn: async () => {
      const response = await lotApi.getLotTimeline(id);
      return extractData<LotTransaction[]>(response);
    },
    enabled: !!id,
  });
};
