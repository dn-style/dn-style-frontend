import express, { Request, Response } from 'express';
import WooCommerceRestApi from 'woocommerce-rest-ts-api';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import multer from 'multer';
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import "dotenv/config";

import nodemailer from 'nodemailer';
import hbs from 'handlebars';
import fs from 'fs';
import path from 'path';

// --- CONFIGURACIÓN EMAIL ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || 'ethereal_user',
    pass: process.env.SMTP_PASS || 'ethereal_pass',
  },
});

const sendEmail = async (to: string, subject: string, templateName: string, context: any) => {
  try {
    const templatePath = path.join(__dirname, 'email-templates', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = hbs.compile(templateSource);
    const html = template(context);

    const info = await transporter.sendMail({
      from: '"DN Style Store" <noreply@dnstyle.com>',
      to,
      subject,
      html,
    });

    console.log(`Email enviado a ${to}: ${info.messageId}`);
    // Si es Ethereal, mostrar URL de preview
    if (process.env.SMTP_HOST?.includes('ethereal')) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error enviando email:', error);
  }
};

const app = express();

// --- Configuración MinIO / S3 ---
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://host.docker.internal:9000',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true, // Necesario para MinIO
});

const BUCKET_NAME = 'pagos';

// Inicializar Bucket
const initBucket = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`Bucket '${BUCKET_NAME}' existe.`);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      try {
        console.log(`Creando bucket '${BUCKET_NAME}'...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`Bucket '${BUCKET_NAME}' creado exitosamente.`);
      } catch (err) {
        console.error("Error creando el bucket:", err);
      }
    } else {
      console.error("Error verificando el bucket:", error);
    }
  }
};
initBucket();

// Multer en memoria para pasar el buffer a S3
const upload = multer({ storage: multer.memoryStorage() });

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

// --- ENDPOINTS ---

// Endpoint Proxy para ver comprobantes privados
app.get('/orders/view-receipt/:key', async (req: Request, res: Response) => {
  const { key } = req.params;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    // Configurar headers para servir el archivo
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    
    // Pipear el stream de S3 directamente a la respuesta de Express
    const body = response.Body as any;
    body.pipe(res);
  } catch (error) {
    console.error("Error recuperando archivo de S3:", error);
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
});

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
    const { per_page, page, category, attributes, min_price, max_price, stock_status, search } = req.query;

    if (per_page) params.per_page = Number(per_page);
    if (page) params.page = Number(page);
    if (category) params.category = category;
    if (min_price) params.min_price = min_price;
    if (max_price) params.max_price = max_price;
    if (stock_status) params.stock_status = stock_status;
    if (search) params.search = search;

    // Filtrado por atributos
    if (attributes) {
      try {
        const attrs = JSON.parse(attributes as string);
        const attributeSlugs: string[] = [];
        const attributeTermIds: number[] = [];

        for (const [slug, termName] of Object.entries(attrs)) {
          const attr = ATTRIBUTES.find(a => a.slug === slug);
          if (!attr) continue;

          if (typeof termName === 'string') {
             const term = attr.options.find(o => o.name === termName);
             if (!term) continue;
             attributeSlugs.push(attr.slug);
             attributeTermIds.push(term.id);
          }
        }

        if (attributeSlugs.length) {
          params.attribute = attributeSlugs;
          params.attribute_term = attributeTermIds;
        }
      } catch (e) {
        console.error("Error parseando atributos", e);
      }
    }

    const response = await api.getProducts(params);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('WooCommerce no devolvió un array de productos:', response.data);
      return res.json([]);
    }

    // Reenviamos las cabeceras de paginación de WooCommerce al frontend
    if (response.headers['x-wp-total']) {
      res.setHeader('X-WP-Total', response.headers['x-wp-total']);
      res.setHeader('Access-Control-Expose-Headers', 'X-WP-Total'); // Importante para CORS
    }

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

app.get('/wc/products/:id/variations', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await api._request('GET', `products/${id}/variations`);
    res.json(response.data);
  } catch (err: any) {
    console.error(`Error obteniendo variaciones ${req.params.id}:`, err.response?.data || err.message);
    res.json([]); 
  }
});

app.get('/wc/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await api._request('GET', 'products/reviews', { product: [id] });
    res.json(response.data);
  } catch (err: any) {
    console.error(`Error obteniendo reviews ${req.params.id}:`, err.response?.data || err.message);
    res.json([]);
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

// Crear una reseña de producto
app.post('/wc/reviews', async (req: Request, res: Response) => {
  try {
    const { product_id, review, reviewer, reviewer_email, rating } = req.body;
    const response = await api._request('POST', 'products/reviews', {
      product_id,
      review,
      reviewer,
      reviewer_email,
      rating,
      status: 'approved' // O 'hold' si prefieres moderarlas
    });
    res.json(response.data);
  } catch (err: any) {
    console.error('Error creando reseña:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error al crear reseña' });
  }
});

// --- AUTHENTICATION ---

app.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    const response = await fetch(`${WP_URL}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error en el servidor de autenticación' });
  }
});

app.post('/auth/register', async (req: Request, res: Response) => {
  const { email, password, first_name, last_name } = req.body;
  try {
    const response = await api._request('POST', 'customers', {
      email,
      password,
      first_name,
      last_name,
      username: email.split('@')[0],
    });
    res.json(response.data);
  } catch (err: any) {
    console.error('Registration error:', err.response?.data);
    res.status(err.response?.status || 500).json({ error: err.response?.data?.message || 'Error registrando usuario' });
  }
});

app.get('/auth/customer', async (req: Request, res: Response) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  try {
    const response = await api._request('GET', 'customers', { email: email as string });
    if (!response.data || response.data.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(response.data[0]);
  } catch (err: any) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ error: 'Error al obtener datos del cliente' });
  }
});

app.put('/auth/customer/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const response = await api._request('PUT', `customers/${id}`, data);
    res.json(response.data);
  } catch (err: any) {
    console.error('Error updating customer:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error al actualizar cliente' });
  }
});

app.get('/auth/orders', async (req: Request, res: Response) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  try {
    const customerRes = await api._request('GET', 'customers', { email: email as string });
    if (!customerRes.data || customerRes.data.length === 0) {
      return res.json([]);
    }
    const customerId = customerRes.data[0].id;

    const ordersRes = await api._request('GET', 'orders', { customer: customerId });
    res.json(ordersRes.data);
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

// Subir comprobante a MinIO y vincular al pedido
app.post('/orders/upload-receipt', upload.single('file'), async (req: Request, res: Response) => {
  const { order_id } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  try {
    const fileName = `${Date.now()}-${file.originalname}`;
    
    // Subir a S3
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const backendHost = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${backendHost}/orders/view-receipt/${fileName}`;

    await api._request('POST', `orders/${order_id}/notes`, {
      note: `Comprobante de pago subido por el cliente. <br/><a href="${fileUrl}" target="_blank" style="display:inline-block; background:#007cba; color:white; padding:5px 10px; text-decoration:none; border-radius:4px;">Ver Comprobante</a>`,
      customer_note: false 
    });

    res.json({ success: true, message: 'Comprobante registrado', url: fileUrl });
  } catch (err: any) {
    console.error('Error subiendo comprobante a S3:', err);
    res.status(500).json({ error: 'Error al registrar comprobante' });
  }
});

app.post('/checkout', async (req: Request, res: Response) => {
  try {
    const { billing, shipping, line_items, payment_method, payment_method_title, set_paid, customer_note, customer_id } = req.body;
    
    const response = await api._request('POST', 'orders', {
      payment_method: payment_method || 'bacs',
      payment_method_title: payment_method_title || 'Transferencia Bancaria',
      set_paid: set_paid || false,
      customer_id: customer_id || 0,
      billing: billing,
      shipping: shipping || billing,
      line_items: line_items,
      customer_note: customer_note
    });

    res.json({ order_id: response.data.id, link: response.data.link });
  } catch (err: any) {
    console.error('Error creando pedido:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error creando pedido', details: err.response?.data });
  }
});

// --- PASSWORD RECOVERY ---

app.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    // 1. Verificar si el usuario existe en WP
    const usersRes = await api._request('GET', 'customers', { email });
    if (!usersRes.data || usersRes.data.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const user = usersRes.data[0];

    // 2. Generar token temporal (Simulado para este MVP, idealmente se guarda en Redis/DB con expiración)
    const resetToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`; // URL del Frontend

    // 3. Enviar email
    await sendEmail(email, 'Recuperación de Contraseña', 'reset-password', {
      name: user.first_name || 'Cliente',
      reset_link: resetLink,
      year: new Date().getFullYear()
    });

    res.json({ message: 'Correo de recuperación enviado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error procesando solicitud' });
  }
});

// --- WEBHOOKS (WooCommerce -> Node) ---

app.post('/webhooks/order-updated', async (req: Request, res: Response) => {
  const order = req.body;
  
  try {
    console.log(`Webhook recibido: Pedido #${order.id} está ${order.status}`);

    // Si el pedido pasa a "completed" o "shipped" (depende de tus estados custom)
    if (order.status === 'completed' || order.status === 'processing') {
        const trackingMeta = order.meta_data.find((m: any) => m.key === '_tracking_number' || m.key === 'tracking_number');
        const trackingNumber = trackingMeta ? trackingMeta.value : null;

        await sendEmail(order.billing.email, `Tu pedido #${order.id} está en camino`, 'order-shipped', {
          name: order.billing.first_name,
          order_id: order.id,
          tracking_number: trackingNumber,
          tracking_url: trackingNumber ? `https://correo.com/tracking/${trackingNumber}` : null // URL de ejemplo
        });
    }
    
    res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Error processing webhook');
  }
});

app.listen(4000, () => console.log('Proxy WooCommerce corriendo en puerto 4000'));
