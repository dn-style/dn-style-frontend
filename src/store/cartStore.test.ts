import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from './cartStore';

// Mock de toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockProduct = {
  id: 1,
  name: "Test Perfume",
  price: "100.00",
  images: [{ src: "test.jpg" }],
  short_description: "Desc",
  description: "Desc long",
  type: "simple",
  on_sale: false,
  regular_price: "100.00",
  sale_price: "",
  attributes: [],
  categories: [],
  stock_status: "instock"
};

describe('useCartStore', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('debe añadir un producto al carrito', () => {
    const { addItem, items } = useCartStore.getState();
    addItem(mockProduct as any);
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].id).toBe(1);
  });

  it('debe incrementar cantidad si el producto ya existe', () => {
    const { addItem } = useCartStore.getState();
    addItem(mockProduct as any);
    addItem(mockProduct as any);
    expect(useCartStore.getState().items.length).toBe(1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
  });

  it('debe calcular el total correctamente', () => {
    const { addItem, cartTotal } = useCartStore.getState();
    addItem(mockProduct as any, 2); // 200.00
    expect(cartTotal()).toBe(200.00);
  });

  it('debe eliminar un producto', () => {
    const { addItem, removeItem } = useCartStore.getState();
    addItem(mockProduct as any);
    const cartId = useCartStore.getState().items[0].cartId;
    removeItem(cartId);
    expect(useCartStore.getState().items.length).toBe(0);
  });
});
