export interface Product {
  id: number;
  title: { rendered: string };
  meta?: { price?: string };
  _embedded?: { "wp:featuredmedia"?: { source_url: string }[] };
}