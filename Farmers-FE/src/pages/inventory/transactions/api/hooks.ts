import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { transactionApi } from './api';
import type { CreateTransactionInput, TransactionFilters } from './types';

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...transactionKeys.lists(), filters] as const,
};

export const useGetTransactions = (filters: TransactionFilters) => {
  return useQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const response = await transactionApi.getTransactions(filters);
      return extractData<any[]>(response);
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const response = await transactionApi.createTransaction(data);
      return extractData<any>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['lots'] });
    },
  });
};

export const useGetTransactionProducts = () => {
  return useQuery({
    queryKey: ['transaction-products'],
    queryFn: async () => {
      const response = await transactionApi.getProducts();
      return extractData<any[]>(response);
    },
  });
};

export const useGetTransactionWarehouses = () => {
  return useQuery({
    queryKey: ['transaction-warehouses'],
    queryFn: async () => {
      const response = await transactionApi.getWarehouses();
      return extractData<any[]>(response);
    },
  });
};

export const useGetTransactionLots = (warehouseId?: string) => {
  return useQuery({
    queryKey: ['transaction-lots', warehouseId],
    queryFn: async () => {
      const response = await transactionApi.getLots(warehouseId);
      return extractData<any[]>(response);
    },
    enabled: !!warehouseId,
  });
};
