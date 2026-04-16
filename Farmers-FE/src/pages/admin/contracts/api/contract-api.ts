import {
  apiGet,
  apiPatch,
  apiPost,
  type ApiSuccessResponse,
} from '@/client/lib/api-client';
import type {
  ContractResponse,
  CreateContractPayload,
  PaginatedContractsResponse,
  RejectContractPayload,
  UpdateContractPayload,
  ContractStatus,
  QualityGrade,
} from './types';

export const contractApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: ContractStatus;
    cropType?: string;
    grade?: QualityGrade;
    farmerId?: string;
  }) =>
    apiGet<ApiSuccessResponse<PaginatedContractsResponse>>('/contracts', { params }),

  getById: (id: string) =>
    apiGet<ApiSuccessResponse<ContractResponse>>(`/contracts/${id}`),

  create: (data: CreateContractPayload) =>
    apiPost<ApiSuccessResponse<ContractResponse>>('/contracts', data),

  update: (id: string, data: UpdateContractPayload) =>
    apiPatch<ApiSuccessResponse<ContractResponse>>(`/contracts/${id}`, data),

  submitForApproval: (id: string) =>
    apiPatch<ApiSuccessResponse<ContractResponse>>(`/contracts/${id}/submit`, {}),

  approve: (id: string) =>
    apiPatch<ApiSuccessResponse<ContractResponse>>(`/contracts/${id}/approve`, {}),

  reject: (id: string, data: RejectContractPayload) =>
    apiPatch<ApiSuccessResponse<ContractResponse>>(`/contracts/${id}/reject`, data),
};
