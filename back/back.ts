import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
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
import { createClient } from 'redis';

// --- CONFIGURACIÓN REDIS ---
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://host.docker.internal:6380'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.connect().then(() => console.log('✅ Conectado a Redis')).catch(console.error);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// --- SOCKET.IO LÓGICA ---
io.on('connection', (socket) => {
  console.log('Cliente conectado al chat:', socket.id);

  socket.on('join_chat', (data) => {
    console.log(`Usuario ${data?.name || 'Anónimo'} se unió al chat`);
    socket.emit('receive_message', {
      text: '¡Hola! Bienvenido a DN Style. ¿En qué podemos ayudarte hoy?',
      sender: 'agent',
      timestamp: new Date()
    });
  });

  socket.on('send_message', (msg) => {
    console.log('Mensaje recibido:', msg);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// --- CONFIGURACIÓN EMAIL ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to: string, subject: string, templateName: string, context: any) => {
  try {
    const templatePath = path.join(__dirname, 'email-templates', `${templateName}.hbs`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = hbs.compile(templateSource);
    const html = template(context);

    const fromAddress = process.env.EMAIL_FROM || '"DN Style Store" <ventas@hipotecatech.es>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });

    console.log(`✅ Email enviado a ${to}: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
};

// --- Configuración Storage (MinIO o Cloudflare R2) ---
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'minio'; // 'minio' o 'r2'

const s3Config = STORAGE_PROVIDER === 'r2' ? {
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: false,
} : {
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://host.docker.internal:9000',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true, 
};

const s3Client = new S3Client(s3Config);

const BUCKET_NAME = process.env.STORAGE_BUCKET_PAYMENTS || 'pagos';
const PRODUCTS_BUCKET = process.env.STORAGE_BUCKET_PRODUCTS || 'products';

// Inicializar Buckets (Solo si es MinIO)
const initBucket = async (bucketName: string) => {
  if (STORAGE_PROVIDER !== 'minio') return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket '${bucketName}' existe.`);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      try {
        console.log(`Creando bucket '${bucketName}'...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket '${bucketName}' creado exitosamente.`);
      } catch (err) {
        console.error(`Error creando el bucket ${bucketName}:`, err);
      }
    } else {
      console.error(`Error verificando el bucket ${bucketName}:`, error);
    }
  }
};

initBucket(BUCKET_NAME);
initBucket(PRODUCTS_BUCKET);

// Multer en memoria para pasar el buffer a S3
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors(
  {
    origin: ['http://localhost:3001', "http://10.10.0.3:3001", 'http://miamo.com.ar', 'http://localhost:3000', 'http://localhost:6000', 'https://test.system4us.com'],
    credentials: true,
  }
));

// --- PROXY DE IMÁGENES DE PRODUCTOS ---
// URL ejemplo: https://test.system4us.com/images/uploads/2026/02/zapatilla.jpg
app.get('/images/:key*', async (req: Request, res: Response) => {
  // Con :key*, Express captura el resto del path en req.params.key + req.params[0]
  // O más simple en versiones nuevas: req.params.key + (req.params[0] || "")
  const key = req.params.key + (req.params[0] || ""); 

  try {
    const command = new GetObjectCommand({
      Bucket: PRODUCTS_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache 1 año
    
    const body = response.Body as any;
    body.pipe(res);
  } catch (error: any) {
    // Si no es un error de "no encontrado", loguearlo
    if (error.name !== 'NoSuchKey') {
        console.error(`Error sirviendo imagen ${key}:`, error);
    }
    res.status(404).send('Imagen no encontrada');
  }
});

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

// Verificar si un usuario ya calificó un producto
app.get('/wc/reviews/check', async (req: Request, res: Response) => {
  const { product_id, email } = req.query;
  try {
    const response = await api._request('GET', 'products/reviews', { 
      product: [product_id],
      reviewer_email: email
    });
    // Si hay al menos una reseña, devolvemos true
    res.json({ hasReviewed: Array.isArray(response.data) && response.data.length > 0 });
  } catch (err) {
    res.json({ hasReviewed: false });
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
      status: 'approved' 
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

    const newOrder = response.data;

    // Enviar email de confirmación
    await sendEmail(billing.email, `Confirmación de pedido #${newOrder.id}`, 'order-confirmation', {
      name: billing.first_name,
      order_id: newOrder.id,
      items: newOrder.line_items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: newOrder.total,
      year: new Date().getFullYear()
    });

    res.json({ order_id: newOrder.id, link: newOrder.link });
  } catch (err: any) {
    console.error('Error creando pedido:', err.response?.data || err.message);
    res.status(err.response?.status || 500).json({ error: 'Error creando pedido', details: err.response?.data });
  }
});

httpServer.listen(4000, () => console.log('Servidor (HTTP + Socket.IO) corriendo en puerto 4000'));