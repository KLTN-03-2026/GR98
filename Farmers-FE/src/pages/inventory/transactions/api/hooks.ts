import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { extractData } from '@/client/lib/api-client';
import { transactionApi } from './api';
import type { WarehouseTransaction, TransactionFilters, CreateTransactionInput } from './types';

export const transactionKeys = {
  all: ['inventory-transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (params: TransactionFilters) => [...transactionKeys.lists(), params] as const,
};

export const useGetTransactions = (params: TransactionFilters) => {
  return useQuery({
    queryKey: transactionKeys.list(params),
    queryFn: async () => {
      const response = await transactionApi.getTransactions(params);
      return extractData<WarehouseTransaction[]>(response);
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const response = await transactionApi.createTransaction(data);
      return extractData<WarehouseTransaction>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      // Also invalidate lots and product dashboard as they are affected
      queryClient.invalidateQueries({ queryKey: ['lots'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'dashboard'] });
    },
  });
};
