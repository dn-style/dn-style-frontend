export interface ProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  options: string[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: 'simple' | 'variable' | 'grouped' | 'external';
  status: string;
  featured: boolean;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  price_html: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  images: ProductImage[];
  attributes: ProductAttribute[];
  categories: { id: number; name: string; slug: string }[];
  average_rating: string;
  rating_count: number;
}

export interface Review {
  id: number;
  date_created: string;
  review: string;
  rating: number;
  reviewer: string;
  reviewer_avatar_urls: Record<string, string>;
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedAttributes?: Record<string, string>;
}

export interface CustomerAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone?: string;
}

export interface Order {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: CustomerAddress;
  shipping: CustomerAddress;
  line_items: Array<{
    product_id: number;
    variation_id?: number;
    quantity: number;
  }>;
}