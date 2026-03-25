import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';
import { toast } from 'react-toastify';
import { isIphoneCategory } from '../utils/priceUtils';

import { useConfigStore } from './configStore';

interface Coupon {
  code: string;
  amount: string;
  type: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  coupon: Coupon | null;
  addItem: (product: Product, quantity?: number, attributes?: Record<string, string>, variationId?: number) => Promise<void>;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  cartTotal: () => number;
  itemsCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      coupon: null,

      addItem: async (product, quantity = 1, attributes = {}, variationId) => {
        const { items } = get();
        const rate = useConfigStore.getState().rate;

        let finalPrice = product.price;

        if (isIphoneCategory(product.categories || [])) {
          if (rate) {
            const numericPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
            finalPrice = (numericPrice * rate).toString();
          }
        }

        const attrKey = Object.values(attributes).sort().join('-');
        const cartId = variationId ? `${product.id}-${variationId}` : `${product.id}-${attrKey}`;

        const existingItem = items.find((item) => item.cartId === cartId);

        if (existingItem) {
          set({
            items: items.map((item) =>
              item.cartId === cartId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
          toast.info(`Cantidad actualizada: ${product.name}`);
        } else {
          set({
            items: [
              ...items,
              {
                ...product,
                images: Array.isArray(product.images) ? product.images : [],
                price: finalPrice,
                cartId,
                quantity,
                variationId,
                selectedAttributes: attributes
              },
            ],
          });
          toast.success(`${product.name} agregado al carrito`);
        }
      },

      removeItem: (cartId) => {
        set((state) => ({
          items: state.items.filter((item) => item.cartId !== cartId),
        }));
        toast.error('Producto eliminado del carrito');
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity < 1) return;
        set((state) => ({
          items: state.items.map((item) =>
            item.cartId === cartId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [], coupon: null }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      applyCoupon: (coupon: Coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      cartTotal: () => {
        const { items, coupon } = get();
        let subtotal = items.reduce((total, item) => {
          const price = parseFloat(item.price) || 0;
          return total + price * item.quantity;
        }, 0);

        if (coupon) {
          const amount = parseFloat(coupon.amount) || 0;
          if (coupon.type === 'percent') {
            subtotal = subtotal * (1 - (amount / 100));
          } else {
            subtotal = Math.max(0, subtotal - amount);
          }
        }

        return subtotal;
      },

      itemsCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'dn-style-cart',
    }
  )
);
