import apiClient from './apiClient';

// Khớp với mapPlotToListItem() trong plot.service.ts
export interface PlotItem {
  id: string;
  lotCode: string;       // BE trả về lotCode (không phải plotCode)
  plotName: string;      // = lotCode
  farmerName: string;    // BE trả về farmerName (không phải farmer.fullName)
  farmerPhone: string;
  cropType: string;      // 'ca-phe' | 'sau-rieng'
  areaHa: number | null;
  province: string;
  district: string;
  id_suppervisor: string | null;
  name_suppervisor: string | null;
}

const CROP_TYPE_LABEL: Record<string, string> = {
  'ca-phe':   'Cà phê',
  'sau-rieng': 'Sầu riêng',
};

export function formatCropType(cropType: string): string {
  return CROP_TYPE_LABEL[cropType] ?? cropType;
}

interface PlotsApiResponse {
  data: PlotItem[];
  total: number;
}

/**
 * Lấy danh sách lô đất của supervisor đang đăng nhập.
 * Dùng limit lớn để load hết vì đây là dropdown.
 */
export async function fetchMyPlots(): Promise<PlotItem[]> {
  try {
    const res = await apiClient.get('/plots', {
      params: { limit: 50, page: 1 },
    });
    // BE wraps: { success: true, data: PaginatedResponse }
    // PaginatedResponse = { data: [...], total, page, limit, totalPages }
    const wrapped = (res as any).data;
    const paginated: PlotsApiResponse = wrapped?.data ?? wrapped;
    const rows: PlotItem[] = Array.isArray(paginated?.data)
      ? paginated.data
      : Array.isArray(paginated)
        ? (paginated as unknown as PlotItem[])
        : [];
    return rows;
  } catch (err) {
    console.warn('[Plots] Không thể tải danh sách lô đất:', err);
    return [];
  }
}

