/**
 * Cấu trúc dữ liệu Phiếu nhập kho (Goods Receipt Note) được encode dạng JSON
 * và lưu trong trường `note` của WarehouseTransaction. Không cần migration DB.
 *
 * Nếu chuỗi `note` không phải JSON hợp lệ (giao dịch cũ), helper trả về null
 * để màn hình fallback về cách hiển thị chuỗi thuần như trước.
 */

export type ReceiptCondition = 'OK' | 'WARN' | 'PARTIAL';

export interface ReceiptMetadata {
  /** Đánh dấu định dạng để phân biệt với note plain-text cũ. */
  kind: 'goods-receipt';
  /** Số phiếu nhập kho, ví dụ: GRN-20260512-A1B2. */
  receiptNo: string;
  /** Thời điểm nhập kho thực tế (ISO string). */
  receivedAt: string;
  /** Người giao hàng thực tế (tài xế / đại diện Nông Dân). */
  deliverer: {
    name: string;
    phone: string;
  };
  /** Biển số phương tiện vận chuyển. */
  vehiclePlate: string;
  /** Số hoá đơn / phiếu giao do bên giao cung cấp (nếu có). */
  invoiceNo: string;
  /** Tình trạng cảm quan khi nhận hàng. */
  condition: ReceiptCondition;
  /** URL ảnh đính kèm (ảnh hàng hoá, ảnh phiếu cân, ảnh hoá đơn...). */
  photos: string[];
  /** Ghi chú tự do của Nhân viên kho. */
  comment: string;
}

export const RECEIPT_CONDITION_LABEL: Record<ReceiptCondition, string> = {
  OK: 'Đạt',
  WARN: 'Đạt có lưu ý',
  PARTIAL: 'Không đạt một phần',
};

/** Sinh số phiếu nhập kho dựa trên thời điểm và mã lô. */
export function generateReceiptNo(lotId: string, when: Date = new Date()): string {
  const yyyy = when.getFullYear();
  const mm = String(when.getMonth() + 1).padStart(2, '0');
  const dd = String(when.getDate()).padStart(2, '0');
  const tail = lotId.slice(-4).toUpperCase();
  return `GRN-${yyyy}${mm}${dd}-${tail}`;
}

/** Encode object thành chuỗi để gửi lên backend qua trường `note`. */
export function serializeReceiptMetadata(meta: ReceiptMetadata): string {
  return JSON.stringify(meta);
}

/**
 * Decode chuỗi `note` thành ReceiptMetadata.
 * - Trả về null nếu chuỗi không phải JSON hoặc thiếu marker `kind`.
 * - Cho phép màn hình fallback về plain text với note cũ.
 */
export function parseReceiptMetadata(note: string | null | undefined): ReceiptMetadata | null {
  if (!note) return null;
  const trimmed = note.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const obj = JSON.parse(trimmed);
    if (obj && obj.kind === 'goods-receipt') {
      return obj as ReceiptMetadata;
    }
    return null;
  } catch {
    return null;
  }
}
