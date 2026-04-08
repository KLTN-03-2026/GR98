import { useMemo } from 'react';
import type { PaginatedProducts } from '@/client/types';
import {
  MOCK_CATEGORIES,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
  getFeaturedProducts,
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from '@/client/data/mock-data';

// ============================================================
// PRODUCT HOOKS (Mock)
// ============================================================
export function useMockProducts(filters: {
  page?: number;
  limit?: number;
  search?: string;
  cropType?: string;
  grade?: string;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  sortBy?: string;
}) {
  return useMemo(() => {
    let results = [...MOCK_PRODUCTS].filter((p) => p.status === 'PUBLISHED');

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }

    // Filter by crop type
    if (filters.cropType) {
      results = results.filter((p) => p.cropType === filters.cropType);
    }

    // Filter by grade
    if (filters.grade) {
      results = results.filter((p) => p.grade === filters.grade);
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      results = results.filter((p) => p.pricePerKg >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      results = results.filter((p) => p.pricePerKg <= filters.maxPrice!);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price_asc':
        results.sort((a, b) => a.pricePerKg - b.pricePerKg);
        break;
      case 'price_desc':
        results.sort((a, b) => b.pricePerKg - a.pricePerKg);
        break;
      case 'rating':
        results.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        results.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = results.slice(start, start + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      isLoading: false,
      isFetching: false,
    } as PaginatedProducts & { isLoading: boolean; isFetching: boolean };
  }, [filters]);
}

export function useMockFeaturedProducts(limit = 8) {
  return useMemo(() => {
    return {
      data: getFeaturedProducts(limit),
      isLoading: false,
      isFetching: false,
    };
  }, [limit]);
}

export function useMockProductBySlug(slug: string) {
  return useMemo(() => {
    return {
      data: getProductBySlug(slug),
      isLoading: false,
    };
  }, [slug]);
}

export function useMockRelatedProducts(productId: string, limit = 4) {
  return useMemo(() => {
    const product = MOCK_PRODUCTS.find((p) => p.id === productId);
    return {
      data: product ? getRelatedProducts(product, limit) : [],
      isLoading: false,
    };
  }, [productId, limit]);
}

export function useMockCategories() {
  return useMemo(() => {
    return {
      data: MOCK_CATEGORIES,
      isLoading: false,
    };
  }, []);
}

// ============================================================
// REVIEW HOOKS (Mock)
// ============================================================
export function useMockProductReviews(productId: string) {
  return useMemo(() => {
    const reviews = getProductReviews(productId);
    const total = reviews.length;
    const averageRating =
      total > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    return {
      data: {
        items: reviews,
        total,
        page: 1,
        limit: 10,
        totalPages: 1,
        averageRating,
      },
      isLoading: false,
    };
  }, [productId]);
}

// ============================================================
// ORDER HOOKS (Mock)
// ============================================================
export function useMockOrders() {
  return useMemo(() => {
    return {
      data: {
        items: MOCK_ORDERS,
        total: MOCK_ORDERS.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isFetching: false,
    };
  }, []);
}

export function useMockOrder(orderId: string) {
  return useMemo(() => {
    return {
      data: MOCK_ORDERS.find((o) => o.id === orderId) || null,
      isLoading: false,
    };
  }, [orderId]);
}

// ============================================================
// PROFILE HOOKS (Mock)
// ============================================================
export function useMockProfile() {
  return useMemo(() => {
    return {
      data: {
        id: 'u-101',
        email: 'nguyenvana@email.com',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        role: 'CLIENT' as const,
        status: 'ACTIVE' as const,
        avatarUrl: 'https://i.pravatar.cc/150?u=nguyenvana',
        clientProfile: {
          id: 'cp-001',
          userId: 'u-101',
          defaultAddress:
            '123 Nguyễn Trãi, P.5, Q.3, TP. Hồ Chí Minh',
          province: 'TP. Hồ Chí Minh',
          createdAt: '2024-01-01T00:00:00Z',
        },
      },
      isLoading: false,
    };
  }, []);
}

// ============================================================
// BANNER / PROMO HOOKS (Mock)
// ============================================================
export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  imageUrl: string;
  bgColor: string;
}

export function useMockBanners(): { data: BannerSlide[]; isLoading: boolean } {
  return useMemo(
    () => ({
      data: [
        {
          id: 'banner-1',
          title: 'Sầu Riêng Ri 6 A',
          subtitle: 'Trái chín cây từ Đắk Lắk - Chất lượng VietGAP',
          cta: 'Mua Ngay',
          ctaLink: '/products/sau-rieng-ri6-a-trai-chin-cay',
          imageUrl:
            'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=1400&q=85',
          bgColor: 'bg-gradient-to-r from-amber-900 to-amber-600',
        },
        {
          id: 'banner-2',
          title: 'Cà Phê Đắk Lắk',
          subtitle: '100% rang mộc - Hương vị Tây Nguyên đậm đà',
          cta: 'Khám Phá',
          ctaLink: '/products/ca-phe-arabica-dak-lak-hat-rang-moc',
          imageUrl:
            'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1400&q=85',
          bgColor: 'bg-gradient-to-r from-amber-800 to-amber-500',
        },
        {
          id: 'banner-3',
          title: 'Combo Quà Tặng Cao Cấp',
          subtitle: 'Sầu Riêng + Cà Phê - Quà tặng ý nghĩa dịp cuối năm',
          cta: 'Xem Chi Tiết',
          ctaLink: '/products/combo-qua-tang-cao-cap-sau-rieng-ca-phe',
          imageUrl:
            'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=1400&q=85',
          bgColor: 'bg-gradient-to-r from-green-900 to-green-600',
        },
      ],
      isLoading: false,
    }),
    [],
  );
}
