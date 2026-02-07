import express, { Request, Response } from 'express';
import WooCommerceRestApi from 'woocommerce-rest-ts-api';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import "dotenv/config";

console.log('Iniciando servidor backend...');

const app = express();

app.use(cors(
  {
    origin: ['http://localhost:3001', "http://10.10.0.3:3001", 'http://miamo.com.ar', 'http://localhost:3000', 'http://localhost:6000'],
    credentials: true,
  }
));

const WP_URL = process.env.WP_HOST || process.env.WC_BASE || 'http://wordpress/';

// Proxy para contenido de WordPress (imagenes, uploads, etc) y API nativa si se requiere
app.use('/wp-content', createProxyMiddleware({
  target: WP_URL,
  changeOrigin: true,
}));

app.use('/wp-includes', createProxyMiddleware({
  target: WP_URL,
  changeOrigin: true,
}));

// Si necesitas la API de WP nativa directamente
app.use('/wp-json/wp/v2', createProxyMiddleware({
  target: WP_URL,
  changeOrigin: true,
}));

app.use(express.json());

const api = new WooCommerceRestApi({
  url: process.env.WC_BASE!,
  consumerKey: process.env.WC_KEY!,
  consumerSecret: process.env.WC_SECRET!,
  version: 'wc/v3',
  queryStringAuth: true,
});


// Supongamos que guardamos los atributos globales en memoria
const ATTRIBUTES: { id: number; name: string; slug: string; options: { id: number; name: string }[] }[] = [];

const loadAttributes = async () => {
  try {
    const res = await api._request('GET', 'products/attributes');
    const attrs = res.data;

    if (!attrs || !Array.isArray(attrs)) {
      console.warn('No se pudieron cargar atributos iniciales (data no es array)');
      return;
    }

    for (const attr of attrs) {
      try {
        const termsResp = await api._request('GET', `products/attributes/${attr.id}/terms`);
        const terms = termsResp.data;
        
        ATTRIBUTES.push({
          id: attr.id,
          slug: attr.slug,
          name: attr.name,
          options: Array.isArray(terms) ? terms.map((t: any) => ({ id: t.id, name: t.name })) : [],
        });
      } catch {
        ATTRIBUTES.push({ id: attr.id, name: attr.name, slug: attr.slug, options: [] });
      }
    }
    console.log('Atributos cargados:', ATTRIBUTES.map(a => a.slug));
  } catch (err) {
    console.error('Error cargando atributos:', err);
  }
};

// Llamar al iniciar el server
const initialize = async () => {
  console.log('Intentando conectar con WooCommerce en:', process.env.WC_BASE);
  // Esperar un poco para asegurar que WordPress esté arriba
  await new Promise(resolve => setTimeout(resolve, 5000));
  await loadAttributes();
};

initialize();

// Listar pasarelas de pago activas
app.get('/wc/payment-gateways', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', 'payment_gateways');
    // Filtramos solo las activas
    if (!response.data || !Array.isArray(response.data)) {
        return res.json([]);
    }
    const activeGateways = response.data.filter((g: any) => g.enabled);
    res.json(activeGateways);
  } catch (err: any) {
    console.error('Error obteniendo pasarelas:', err.response?.data || err.message);
    res.status(500).json({ error: 'Error obteniendo pasarelas de pago' });
  }
});

app.get('/wc/products', async (req: Request, res: Response) => {
  try {
    const params: Record<string, any> = {};
    const { per_page, page, category, attributes } = req.query;

    if (per_page) params.per_page = Number(per_page);
    if (page) params.page = Number(page);
    if (category) params.category = category;

    // Filtrado por atributos
    if (attributes) {
      const attrs = JSON.parse(attributes as string);
      const attributeSlugs: string[] = [];
      const attributeTermIds: number[] = [];

      for (const [slug, termName] of Object.entries(attrs)) {
        const attr = ATTRIBUTES.find(a => a.slug === slug);
        if (!attr) continue;

        const term = attr.options.find(o => o.name === termName);
        if (!term) continue;

        attributeSlugs.push(attr.slug);
        attributeTermIds.push(term.id);
      }

      if (attributeSlugs.length) {
        params.attribute = attributeSlugs;
        params.attribute_term = attributeTermIds;
      }
    }

    const response = await api.getProducts(params);
    res.json(response.data);
  } catch (err: any) {
    console.error('Error obteniendo productos:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error obteniendo productos' });
  }
});

app.get('/wc/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await api.getProduct(Number(id));
    res.json(response.data);
  } catch (err: any) {
    console.error(`Error obteniendo producto ${req.params.id}:`, err.response?.data || err.message);
    res.status(err.response?.status || 404).json({ error: 'Producto no encontrado' });
  }
});

app.get('/wc/categories', async (req: Request, res: Response) => {
  try {
    const params: Record<string, any> = {};
    const { parent } = req.query;
    if (parent !== undefined) params.parent = Number(parent);

    const response = await api._request('GET', 'products/categories', params);
    
    const categories = response.data.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      parent: cat.parent,
      image: cat.image ? cat.image.src : null,
    }));

    res.json(categories);
  } catch (err: any) {
    console.error('Error obteniendo categorías:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error obteniendo categorías' });
  }
});

app.get('/wc/attributes', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', 'products/attributes');
    const attributes = response.data;

    const attributesWithTerms = await Promise.all(
      attributes.map(async (attr: any) => {
        try {
          const termsResp = await api._request('GET', `products/attributes/${attr.id}/terms`);
          return {
            id: attr.id,
            name: attr.name,
            slug: attr.slug,
            options: Array.isArray(termsResp.data) ? termsResp.data.map((t: any) => t.name) : [],
          };
        } catch {
          return { id: attr.id, name: attr.name, slug: attr.slug, options: [] };
        }
      })
    );

    res.json(attributesWithTerms);
  } catch (err: any) {
    console.error('Error obteniendo atributos:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error obteniendo atributos' });
  }
});

app.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { customer, items, payment_method, set_paid } = req.body;
    const response = await api._request('POST', '/orders', {
      payment_method: payment_method || 'bacs',
      payment_method_title: payment_method ? undefined : 'Direct Bank Transfer',
      set_paid: set_paid || false,
      billing: customer,
      line_items: items,
    });

    res.json({ order_id: response.data.id, link: response.data.link });
  } catch (err: any) {
    console.error('Error creando pedido:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error creando pedido' });
  }
});

app.listen(4000, () => console.log('Proxy WooCommerce corriendo en puerto 4000'));