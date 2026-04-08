import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, CartItem, Product } from '@/client/types';
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAllAuthCookies,
} from '@/lib/cookie-utils';

// ============================================================
// AUTH STORE
// accessToken: lưu ở Cookie (bảo mật, chống XSS)
// user info: lưu ở localStorage (thông qua persist)
// ============================================================
interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser, accessToken?: string, refreshToken?: string) => void;
  logout: () => void;
  setUser: (partial: Partial<AuthUser>) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, accessToken, refreshToken) => {
        // Lưu accessToken vào Cookie (bảo mật)
        if (accessToken) {
          setAccessTokenCookie(accessToken);
        }
        if (refreshToken) {
          setRefreshTokenCookie(refreshToken);
        }

        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        // Xóa toàn bộ Cookie auth
        clearAllAuthCookies();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setUser: (partial) => set((state) => ({
        user: state.user ? { ...state.user, ...partial } : null,
      })),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'ec_auth',
      storage: createJSONStorage(() => localStorage),
      // Chỉ persist user info, KHÔNG persist accessToken (đã ở Cookie)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// ============================================================
// CART STORE
// ============================================================
interface CartState {
  items: CartItem[];
  shippingFee: number;
  discount: number;
  addItem: (product: Product, quantityKg: number) => void;
  updateQuantity: (productId: string, quantityKg: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  applyDiscount: (discount: number) => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getItem: (productId: string) => CartItem | undefined;
  isInCart: (productId: string) => boolean;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shippingFee: 0,
      discount: 0,

      addItem: (product, quantityKg) => {
        const existing = get().items.find((i) => i.productId === product.id);
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === product.id
                ? { ...i, quantityKg: i.quantityKg + quantityKg }
                : i,
            ),
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              {
                productId: product.id,
                product,
                quantityKg,
                addedAt: new Date().toISOString(),
              },
            ],
          }));
        }
      },

      updateQuantity: (productId, quantityKg) => {
        if (quantityKg <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantityKg } : i,
          ),
        }));
      },

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      clearCart: () => set({ items: [], shippingFee: 0, discount: 0 }),

      applyDiscount: (discount) => set({ discount: Math.max(0, discount) }),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.product.pricePerKg * i.quantityKg, 0),

      getTotal: () => {
        const state = get();
        return state.getSubtotal() + state.shippingFee - state.discount;
      },

      getItemCount: () =>
        get().items.reduce((count, i) => count + i.quantityKg, 0),

      getItem: (productId) => get().items.find((i) => i.productId === productId),

      isInCart: (productId) => get().items.some((i) => i.productId === productId),
    }),
    {
      name: 'ec_cart',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ============================================================
// UI STATE STORE
// ============================================================
interface UIState {
  isPageLoading: boolean;
  searchQuery: string;
  mobileMenuOpen: boolean;
  quickViewProduct: Product | null;
  setPageLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setQuickViewProduct: (product: Product | null) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isPageLoading: false,
  searchQuery: '',
  mobileMenuOpen: false,
  quickViewProduct: null,
  setPageLoading: (loading) => set({ isPageLoading: loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setQuickViewProduct: (product) => set({ quickViewProduct: product }),
}));
