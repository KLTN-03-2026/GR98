import type { WarehouseTransaction, CreateTransactionInput, TransactionFilters, ReceiveHarvestInput } from './types';

export const transactionApi = {
  getTransactions: (params: TransactionFilters) =>
    apiGet<WarehouseTransaction[]>('/inventory/transactions', { params }),
  
  createTransaction: (data: CreateTransactionInput) =>
    apiPost<WarehouseTransaction>('/inventory/transactions', data),

  receiveHarvest: (data: ReceiveHarvestInput) =>
    apiPost<any>('/inventory/receive-harvest', data),
};
