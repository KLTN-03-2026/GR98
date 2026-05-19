/**
 * Tính ngày hết hạn mặc định của 1 lô hàng dựa trên loại nông sản (cropType)
 * và ngày thu hoạch. Áp dụng khi nhân viên kho / admin không nhập tay
 * `expiryDate`.
 *
 * Áp dụng cho dạng phổ biến nhất trong hệ thống:
 *   - Cà phê nhân (chưa rang): ~12 tháng từ thu hoạch.
 *   - Sầu riêng tươi: ~7 ngày từ thu hoạch.
 * Với các dạng đã chế biến (cà phê rang/xay, sầu riêng đông lạnh/sấy),
 * caller phải override thủ công lúc tạo lot.
 */
const DEFAULT_SHELF_LIFE_DAYS: Record<string, number> = {
  'ca-phe': 365,
  'sau-rieng': 7,
};

export function computeDefaultExpiry(
  cropType: string | undefined | null,
  harvestDate: Date,
): Date {
  const days =
    cropType && DEFAULT_SHELF_LIFE_DAYS[cropType] !== undefined
      ? DEFAULT_SHELF_LIFE_DAYS[cropType]
      : 30;
  const expiry = new Date(harvestDate);
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
