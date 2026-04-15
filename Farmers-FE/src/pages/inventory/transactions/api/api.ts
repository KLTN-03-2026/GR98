import { apiGet, apiPost } from '@/client/lib/api-client';
import type { WarehouseTransaction, CreateTransactionInput, TransactionFilters } from './types';

export const transactionApi = {
  getTransactions: (params: TransactionFilters) =>
    apiGet<WarehouseTransaction[]>('/inventory/transactions', { params }),
  
  createTransaction: (data: CreateTransactionInput) =>
    apiPost<WarehouseTransaction>('/inventory/transactions', data),
};
