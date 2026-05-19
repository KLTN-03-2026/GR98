// ============================================================
// AUTH TYPES
// ============================================================
export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'INVENTORY' | 'SHIPPER' | 'CLIENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type FulfillStatus = 'PENDING' | 'PACKING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'OUT_OF_STOCK' | 'ARCHIVED';
/**
 * Unified 4-tier grade system. Legacy A/B/C giữ lại để hỗ trợ dữ liệu cũ.
 * Hiển thị: dùng `getGradeLabel()` để auto-map cả legacy → label tiếng Việt.
 */
export type QualityGrade =
  | 'PREMIUM'
  | 'STANDARD'
  | 'ECONOMY'
  | 'REJECT'
  | 'A'  // legacy → PREMIUM
  | 'B'  // legacy → STANDARD
  | 'C'; // legacy → ECONOMY

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  ward?: string | null;
  province: string;
  district?: string | null;
  isDefault?: boolean;
}

// ============================================================
// AUTH & USER
// ============================================================
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
}

/** Địa chỉ giao hàng (bảng ClientShippingAddresses) */
export interface ClientShippingAddressRow {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  district?: string | null;
  province: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientProfile {
  id: string;
  userId: string;
  province?: string;
  createdAt?: string;
  shippingAddresses?: ClientShippingAddressRow[];
}

export interface AuthUser extends User {
  clientProfile?: ClientProfile;
  accessToken: string;
  refreshToken?: string;
  adminId?: string;
  supervisorId?: string;
  inventoryId?: string;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}

// ============================================================
// PRODUCT & CATEGORY
// ============================================================
export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  sortOrder: number;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cropType: string; // 'ca-phe' | 'sau-rieng'
  variety?: string | null;
  grade: QualityGrade;
  pricePerKg: number;
  stockKg: number;
  actualStockKg?: number;
  upcomingStockKg?: number;
  minOrderKg: number;
  qrCode: string;
  sku: string;
  unit?: string;
  imageUrls: string[];
  thumbnailUrl?: string;
  status: ProductStatus;
  harvestDate?: string;
  aiConfidenceScore?: number;
  createdAt: string;
  plotId?: string;
  contractId?: string;
  plot?: Record<string, unknown>;
  contract?: Record<string, unknown>;
  inventoryLot?: Record<string, unknown>;
  /** Số nông trại (plot) khác nhau đóng góp vào sản phẩm này. >1 nghĩa là
   *  sản phẩm được gộp từ nhiều hợp đồng/lô. */
  contributingFarmCount?: number;
  categories?: Category[];
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
}

export interface ProductFilters {
  cropType?: string;
  grade?: QualityGrade;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  status?: ProductStatus;
  search?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'name';
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// TRACEABILITY
// ============================================================
export interface TraceTimelineItem {
  date: string;
  type: 'planting' | 'expected_harvest' | 'report' | 'incident' | 'harvest' | 'scan' | 'warehouse' | 'transaction';
  title: string;
  description: string;
  imageUrls?: string[];
  meta?: Record<string, unknown>;
  /** Tag nguồn gốc — có khi sản phẩm gộp từ nhiều nông trại */
  source?: {
    plotCode: string | null;
    farmerName: string | null;
    contractNo: string | null;
  } | null;
}

export interface TracePlot {
  id: string;
  plotCode: string;
  cropType: string;
  areaHa: number;
  plantingDate?: string | null;
  expectedHarvest?: string | null;
  estimatedYieldKg?: number | null;
  farmer: { fullName: string; province?: string } | null;
  zone: { name: string; province: string; district?: string } | null;
}

export interface TraceContract {
  id: string;
  contractNo: string;
  cropType: string;
  variety?: string | null;
  grade: string;
  signedAt?: string | null;
  harvestDue?: string | null;
  traceabilityQr?: string | null;
  farmer: { fullName: string } | null;
  supervisor: { fullName?: string } | null;
}

export interface TraceInventoryLot {
  id: string;
  quantityKg: number;
  harvestDate?: string | null;
  expiryDate?: string | null;
  qualityGrade: string;
  warehouseName?: string;
}

export interface TraceReview {
  id: string;
  rating: number;
  comment?: string;
  imageUrls: string[];
  clientName?: string;
  clientAvatar?: string;
  createdAt: string;
}

export interface TraceStats {
  totalReports: number;
  totalIncidents: number;
  totalHarvestReports: number;
  totalScans: number;
  avgYieldEstimate: number;
  yieldHistory: { date: string; value: number }[];
  reportTypeCounts: Record<string, number>;
  scanCategoryCounts: Record<string, number>;
  totalInventoryKg: number;
  contributingFarmCount: number;
}

export interface TracePlotSummary {
  id: string;
  plotCode: string;
  areaHa: number;
  plantingDate?: string | null;
  farmer?: { fullName: string; province?: string } | null;
  zone?: { name: string; province: string; district?: string } | null;
}

export interface ProductTraceability {
  product: Product & { averageRating: number; reviewCount: number };
  plot: TracePlot | null;
  contributingPlots: TracePlotSummary[];
  contract: TraceContract | null;
  timeline: TraceTimelineItem[];
  inventoryLots: TraceInventoryLot[];
  reviews: TraceReview[];
  stats: TraceStats;
}

// ============================================================
// REVIEW
// ============================================================
export interface Review {
  id: string;
  productId: string;
  clientId: string;
  clientName?: string;
  clientAvatar?: string;
  rating: number;
  comment?: string;
  imageUrls: string[];
  verifiedPurchase: boolean;
  status: ReviewStatus;
  createdAt: string;
}

// ============================================================
// CART & ORDER
// ============================================================
export interface CartItem {
  productId: string;
  product: Product;
  quantityKg: number;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantityKg: number;
  subtotal: number;
  productImage?: string;
  product?: {
    id: string;
    sku: string | null;
    category: string | null;
    qualityGrade: string | null;
    imageUrls: string[];
    thumbnailUrl: string | null;
  };
}

export interface Order {
  id: string;
  orderNo: string;
  orderCode?: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentRef?: string | null;
  paymentStatus: PaymentStatus;
  fulfillStatus: FulfillStatus;
  shippingAddr: ShippingAddress;
  shippingAddrText?: string | null;
  trackingCode?: string | null;
  note?: string | null;
  orderedAt: string;
  paidAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  deliveryProofUrl?: string | null;
  orderItems: OrderItem[];
  client?: {
    id: string;
    user: { fullName: string; email: string; phone: string | null };
  };
  admin?: { id: string; businessName: string };
  shipperId?: string | null;
  shipper?: {
    id: string;
    employeeCode: string;
    vehicleType?: string | null;
    licensePlate?: string | null;
    status?: string | null;
    lat?: number | null;
    lng?: number | null;
    lastSeenAt?: string | null;
    user: {
      id: string;
      fullName: string;
      phone?: string | null;
      avatar?: string | null;
    };
  } | null;
}

export interface CreateOrderRequest {
  cartItems: { productId: string; quantityKg: number }[];
  shippingAddr: ShippingAddress;
  paymentMethod: PaymentMethod;
  note?: string;
}

// ============================================================
// API RESPONSE WRAPPER
// ============================================================
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// ============================================================
// CROP TYPE CONSTANTS (E-com domain)
// ============================================================
export const CROP_TYPES: Record<string, string> = {
  'ca-phe': 'Cà Phê',
  'sau-rieng': 'Sầu Riêng',
};

export type CropTypeKey = keyof typeof CROP_TYPES;

export const GRADE_LABELS: Record<QualityGrade, string> = {
  PREMIUM:  'Cao cấp',
  STANDARD: 'Tiêu chuẩn',
  ECONOMY:  'Phổ thông',
  REJECT:   'Không đạt',
  // Legacy aliases (mapped vào label tương ứng)
  A: 'Cao cấp',
  B: 'Tiêu chuẩn',
  C: 'Phổ thông',
};

/** Map legacy A/B/C → grade slug mới để chuẩn hoá filter/display. */
const LEGACY_GRADE_MAP: Record<string, QualityGrade> = {
  A: 'PREMIUM',
  B: 'STANDARD',
  C: 'ECONOMY',
};

/** Normalize bất kỳ grade nào (legacy hay mới) về slug chuẩn. */
export function normalizeGrade(grade: string | null | undefined): QualityGrade {
  if (!grade) return 'STANDARD';
  const upper = grade.toUpperCase();
  return (LEGACY_GRADE_MAP[upper] ?? (upper as QualityGrade));
}

/** Lấy label tiếng Việt từ grade — handle cả legacy + undefined. */
export function getGradeLabel(grade: string | null | undefined): string {
  if (!grade) return 'Tiêu chuẩn';
  return GRADE_LABELS[grade as QualityGrade] ?? GRADE_LABELS[normalizeGrade(grade)];
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  VNPAY: 'VNPay',
  MOMO: 'MoMo',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

export const FULFILL_STATUS_LABELS: Record<FulfillStatus, string> = {
  PENDING: 'Chờ xử lý',
  PACKING: 'Đang đóng gói',
  SHIPPED: 'Đang giao hàng',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đang bán',
  OUT_OF_STOCK: 'Hết hàng',
  ARCHIVED: 'Lưu trữ',
};
