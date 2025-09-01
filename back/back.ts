import express, { Request, Response } from 'express';
import WooCommerceRestApi from 'woocommerce-rest-ts-api';
import cors from 'cors';
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(cors());

const api = new WooCommerceRestApi({
  url: process.env.WC_BASE!,
  consumerKey: process.env.WC_KEY!,
  consumerSecret: process.env.WC_SECRET!,
  version: 'wc/v3',
});


// Supongamos que guardamos los atributos globales en memoria
// o los traemos de WooCommerce al iniciar el server
// { id, slug, options: [{ id, name }] }
const ATTRIBUTES: { id: number; name: string; slug: string; options: { id: number; name: string }[] }[] = [];
interface Attribute {
  id: number;
  name: string;
  slug: string;
  options: { id: number; name: string }[];
}
const loadAttributes = async () => {
  try {
    const res = await api._request('GET', 'products/attributes');
    const attrs = res.data;

    for (const attr of attrs) {
      try {
        const termsResp = await api._request('GET', `products/attributes/${attr.id}/terms`);
        ATTRIBUTES.push({
          id: attr.id,
          slug: attr.slug,
          name: attr.name,
          options: termsResp.data.map((t: any) => ({ id: t.id, name: t.name })),
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
loadAttributes();
app.get('/wc/products', async (req: Request, res: Response) => {
  try {
    const params: Record<string, any> = {};
    const { per_page, page, category, attributes } = req.query;

    if (per_page) params.per_page = Number(per_page);
    if (page) params.page = Number(page);
    if (category) params.category = category;
    console.log('Product query params iniciales:', params);


    // Filtrado por atributos
if (attributes) {
  const attrs = JSON.parse(attributes as string); // { pa_presentacion: "100ml" }

  const attributeSlugs: string[] = [];
  const attributeTermIds: number[] = [];

  for (const [slug, termName] of Object.entries(attrs)) {
    const attr = ATTRIBUTES.find(a => a.slug === slug);
    if (!attr) {
      console.warn(`Atributo no encontrado: ${slug}`);
      continue;
    }

    const term = attr.options.find(o => o.name === termName);
    if (!term) {
      console.warn(`Término no encontrado para ${slug}: ${termName}`);
      continue;
    }

    attributeSlugs.push(attr.slug); // usamos el slug, no el ID del atributo
    attributeTermIds.push(term.id);
  }

  if (attributeSlugs.length) {
    params.attribute = attributeSlugs;      // array de slugs
    params.attribute_term = attributeTermIds; // array de IDs de términos
    console.log('Filtros de atributos aplicados:', params);
  }
}
    const response = await api.getProducts(params);
    console.log('Productos recibidos:', response.data.length);
    res.json(response.data);
  } catch (err: any) {
    console.error('Error obteniendo productos:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error obteniendo productos' });
  }
});

// Listar atributos
app.get('/wc/attributes', async (req: Request, res: Response) => {
  try {
    // Obtener todos los atributos
    const response = await api._request('GET', 'products/attributes');
    const attributes = response.data; // [{ id, name, slug, ... }]

    // Para cada atributo, obtener sus términos
    const attributesWithTerms = await Promise.all(
      attributes.map(async (attr: any) => {
        try {
          const termsResp = await api._request('GET', `products/attributes/${attr.id}/terms`);
          return {
            id: attr.id,
            name: attr.name,
            slug: attr.slug,
            options: termsResp.data.map((t: any) => t.name),
          };
        } catch (err) {
          return { id: attr.id, name: attr.name, slug: attr.slug, options: [] };
        }
      })
    );

    res.json(attributesWithTerms);
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error obteniendo atributos' });
  }
});
// Endpoint de checkout
app.post('/checkout', async (req: Request, res: Response) => {
  const { customer, items, payment_method, set_paid } = req.body;

  try {
    const response = await api._request(
      'POST',
      '/orders',
      {
        payment_method: payment_method || 'bacs',
        payment_method_title: payment_method ? undefined : 'Direct Bank Transfer',
        set_paid: set_paid || false,
        billing: customer,
        line_items: items,
      }
    );

    res.json({ order_id: response.data.id, link: response.data.link });
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error creando pedido' });
  }
});

app.listen(4000, () => console.log('Proxy WooCommerce corriendo en puerto 4000'));
