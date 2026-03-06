/**
 * Utilidad para el envío de eventos a Google Analytics (GA4)
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const setAnalyticsUser = (userId: string | number, userProperties: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', 'user_properties', {
      user_id: userId.toString(),
      ...userProperties
    });
    window.gtag('config', 'G-FSZYZ6L81C', {
      'user_id': userId.toString()
    });
  }
};

export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// Función auxiliar para asegurar que el precio sea ARS para Analytics
const getArsPrice = (price: string | number, categories: any[] = [], rate: number | null): number => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  // Si ya es un iPhone o categoría en dólares (y tenemos el rate), convertimos
  // Nota: El cartStore ya guarda algunos precios convertidos, pero aquí aseguramos consistencia.
  const isUsd = categories.some(c => c.slug === 'iphone' || c.slug === 'apple');
  if (isUsd && rate && numericPrice < 10000) { // < 10000 es un heurístico para detectar USD
    return numericPrice * rate;
  }
  return numericPrice;
};

export const trackViewItem = (product: any, rate: number | null = null) => {
  const priceArs = getArsPrice(product.price, product.categories || [], rate);
  trackEvent('view_item', {
    currency: 'ARS',
    value: priceArs,
    items: [{
      item_id: product.id.toString(),
      item_name: product.name,
      price: priceArs,
      item_category: product.categories?.[0]?.name || 'General'
    }]
  });
};

export const trackAddToCart = (product: any, quantity: number = 1, rate: number | null = null) => {
  const priceArs = getArsPrice(product.price, product.categories || [], rate);
  trackEvent('add_to_cart', {
    currency: 'ARS',
    value: priceArs * quantity,
    items: [{
      item_id: product.id.toString(),
      item_name: product.name,
      price: priceArs,
      quantity: quantity
    }]
  });
};

export const trackBeginCheckout = (items: any[], total: number, rate: number | null = null) => {
  // Aquí asumimos que el total ya viene en la moneda que el usuario ve, 
  // pero forzamos que Google lo registre como ARS.
  trackEvent('begin_checkout', {
    currency: 'ARS',
    value: total, 
    items: items.map(item => ({
      item_id: item.id.toString(),
      item_name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity
    }))
  });
};

export const trackPurchase = (orderId: string, total: number, items: any[]) => {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'ARS',
    items: items.map(item => ({
      item_id: item.product_id?.toString() || item.id?.toString(),
      item_name: item.name,
      price: parseFloat(item.price || item.total),
      quantity: item.quantity
    }))
  });
};

export const trackSearch = (searchTerm: string) => {
  trackEvent('search', { search_term: searchTerm });
};

export const trackRemoveFromCart = (item: any) => {
  trackEvent('remove_from_cart', {
    currency: 'USD',
    value: parseFloat(item.price) * item.quantity,
    items: [{
      item_id: item.id.toString(),
      item_name: item.name,
      price: parseFloat(item.price),
      quantity: item.quantity
    }]
  });
};

export const trackLogin = (method: string = 'email') => {
  trackEvent('login', { method });
};

export const trackSignUp = (method: string = 'email') => {
  trackEvent('sign_up', { method });
};

export const trackWhatsAppClick = (productName: string, location: string = 'product_page') => {
  trackEvent('contact_whatsapp', {
    product_name: productName,
    location: location
  });
};

export const trackViewItemList = (categoryName: string, items: any[]) => {
  trackEvent('view_item_list', {
    item_list_name: categoryName,
    items: items.slice(0, 10).map((item, idx) => ({
      item_id: item.id.toString(),
      item_name: item.name,
      index: idx + 1,
      price: parseFloat(item.price)
    }))
  });
};

