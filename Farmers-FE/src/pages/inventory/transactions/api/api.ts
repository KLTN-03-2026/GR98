import { apiGet, apiPost } from '@/client/lib/api-client';
import type { WarehouseTransaction, CreateTransactionInput, TransactionFilters } from './types';
import type { Product } from '@/client/types';

export const transactionApi = {
  getTransactions: (filters: TransactionFilters) =>
    apiGet<WarehouseTransaction[]>('/inventory/transactions', { params: filters }),

  createTransaction: (data: CreateTransactionInput) =>
    apiPost<WarehouseTransaction>('/inventory/transactions', data),

  getProducts: () =>
    apiGet<Product[]>('/inventory/products'),

  getWarehouses: () =>
    apiGet<any[]>('/inventory/warehouses'),
    
  getLots: (warehouseId?: string) =>
    apiGet<any[]>('/inventory/lots', { params: { warehouseId } }),
};
