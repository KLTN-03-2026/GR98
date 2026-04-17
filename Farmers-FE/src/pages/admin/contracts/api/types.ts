import type { ApiSuccessResponse } from '@/client/lib/api-client';

export type ContractStatus =
  | 'DRAFT'
  | 'SIGNED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SETTLED'
  | 'TERMINATED';

export type QualityGrade = 'A' | 'B' | 'C' | 'REJECT';

export interface ContractResponse {
  id: string;
  adminId: string;
  supervisorId: string;
  contractNo: string;
  cropType: string;
  grade: QualityGrade;
  status: ContractStatus;
  plotDraftProvince: string | null;
  plotDraftDistrict: string | null;
  plotDraftAreaHa: number | null;
  plotDraftCoordinatesText: string | null;
  signedAt: string | null;
  harvestDue: string | null;
  signatureUrl: string | null;
  traceabilityQr: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedReason: string | null;
  createdAt: string;
  farmer: {
    id: string;
    fullName: string;
    phone: string;
    cccd: string;
    bankAccount: string | null;
    bankName: string | null;
    bankBranch: string | null;
    address: string | null;
    province: string | null;
  };
  plot: {
    id: string;
    plotCode: string;
    cropType: string;
    areaHa: number;
    status: string;
    estimatedYieldKg: number | null;
    province: string | null;
    district: string | null;
  };
  supervisor: {
    id: string | null;
    fullName: string | null;
    userId?: string | null;
    employeeCode?: string | null;
    email?: string | null;
    phone?: string | null;
    status?: string | null;
    hiredAt?: string | null;
    zone?: {
      id: string;
      name: string;
      province: string;
      district: string;
    } | null;
  };
  admin?: {
    businessName: string;
    province: string;
    taxCode: string | null;
    bankAccount: string | null;
  };
}

export interface PaginatedContractsResponse {
  data: ContractResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateContractPayload {
  farmerId?: string;
  plotId?: string;
  plotDraftProvince?: string;
  plotDraftDistrict?: string;
  plotDraftAreaHa?: number;
  plotDraftCoordinatesText?: string;
  cropType: string;
  grade: QualityGrade;
  signedAt?: string;
  harvestDue?: string;
  signatureUrl?: string;
}

export type UpdateContractPayload = Partial<CreateContractPayload>;

export interface RejectContractPayload {
  rejectedReason: string;
}

export type { ApiSuccessResponse };
