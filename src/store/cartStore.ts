import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';
import { toast } from 'react-toastify';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (product: Product, quantity?: number, attributes?: Record<string, string>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  cartTotal: () => number;
  itemsCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, attributes = {}) => {
        const { items } = get();
        // Generar un ID único basado en producto y atributos (para diferenciar variantes)
        // Por simplicidad en este MVP, usaremos el ID del producto + string de atributos
        const attrKey = Object.values(attributes).sort().join('-');
        const cartId = `${product.id}-${attrKey}`;

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
              { ...product, cartId, quantity, selectedAttributes: attributes },
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

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      cartTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
            const price = parseFloat(item.price) || 0;
            return total + price * item.quantity;
        }, 0);
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
