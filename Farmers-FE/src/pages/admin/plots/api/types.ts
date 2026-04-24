import type { ApiSuccessResponse } from '@/client/lib/api-client';

export type PlotCropType = 'ca-phe' | 'sau-rieng';

export interface PlotResponse {
  id: string;
  /** Gắn với nông dân — dùng lọc cascade lô theo nông dân */
  farmerId: string;
  lotCode: string;
  plotName: string;
  farmerName: string;
  farmerPhone: string;
  farmerCccd: string;
  contractId: string;
  province: string;
  district: string;
  areaHa: number;
  cropType: PlotCropType;
  progress: 'on-track' | 'attention';
  lat: number;
  lng: number;
  isGisMarked?: boolean;
  updatedAt: string;
  polygon?: Array<[number, number]>;
  /** Có dữ liệu GIS (tọa độ lat/lng) trong DB hay chưa */
  hasGis?: boolean;
  /** Tọa độ lô đất từ hợp đồng dạng "lat,lng\nlat,lng" */
  plotDraftCoordinatesText?: string | null;
  id_suppervisor?: string | null;
  name_suppervisor?: string | null;
}

export interface PaginatedPlotsResponse {
  data: PlotResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePlotPayload {
  plotName: string;
  farmerId?: string;
  farmerName?: string;
  farmerPhone?: string;
  farmerCccd?: string;
  contractId?: string;
  id_suppervisor?: string;
  name_suppervisor?: string;
  cropType: PlotCropType;
  areaHa: number;
  lat?: number;
  lng?: number;
  province?: string;
  district?: string;
  polygon?: Array<[number, number]>;
}

export interface UpdatePlotPayload {
  id_suppervisor?: string;
  name_suppervisor?: string;
  lat?: number;
  lng?: number;
}

export type { ApiSuccessResponse };
