import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractData } from '@/client/lib/api-client';
import { contractApi } from './contract-api';
import type {
  ContractResponse,
  CreateContractPayload,
  PaginatedContractsResponse,
  RejectContractPayload,
  UpdateContractPayload,
} from './types';

export function useContracts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContractResponse['status'];
  cropType?: string;
  grade?: ContractResponse['grade'];
  farmerId?: string;
}) {
  return useQuery({
    queryKey: ['contracts', params],
    queryFn: async () => {
      const response = await contractApi.list(params);
      return extractData<PaginatedContractsResponse>(response);
    },
    placeholderData: (prev) => prev,
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const response = await contractApi.getById(id);
      return extractData<ContractResponse>(response);
    },
    enabled: !!id,
  });
}

export function useCreateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContractPayload) => {
      const response = await contractApi.create(data);
      return extractData<ContractResponse>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] });
      toast.success('Đã tạo hợp đồng nháp');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể tạo hợp đồng');
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateContractPayload;
    }) => {
      const response = await contractApi.update(id, data);
      return { contract: extractData<ContractResponse>(response), requestData: data };
    },
    onSuccess: ({ contract, requestData }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', contract.id] });
      queryClient.setQueryData(['contract', contract.id], contract);

      const requestKeys = Object.keys(requestData || {});
      const isSignatureOnlyUpdate =
        requestKeys.length === 1 && requestKeys[0] === 'signatureUrl';
      toast.success(
        isSignatureOnlyUpdate ? 'Cập nhật ảnh thành công' : 'Đã cập nhật hợp đồng nháp',
      );
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể cập nhật hợp đồng');
    },
  });
}

export function useSubmitContractForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await contractApi.submitForApproval(id);
      return extractData<ContractResponse>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] });
      toast.success('Đã gửi yêu cầu phê duyệt');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể gửi yêu cầu phê duyệt');
    },
  });
}

export function useApproveContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await contractApi.approve(id);
      return extractData<ContractResponse>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] });
      toast.success('Đã phê duyệt hợp đồng');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể phê duyệt hợp đồng');
    },
  });
}

export function useRejectContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: RejectContractPayload;
    }) => {
      const response = await contractApi.reject(id, data);
      return extractData<ContractResponse>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', data.id] });
      toast.success('Đã từ chối hợp đồng');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Không thể từ chối hợp đồng');
    },
  });
}
