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
const isTest = process.env.NODE_ENV === 'test';
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://host.docker.internal:6380'
});

if (!isTest) {
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.connect().then(() => console.log('✅ Conectado a Redis')).catch(console.error);
}

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
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'minio'; 

const s3Config: any = STORAGE_PROVIDER === 'r2' ? {
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
  if (STORAGE_PROVIDER !== 'minio' || isTest) return;
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
app.get(/^\/images\/(.*)/, async (req: Request, res: Response) => {
  const key = req.params[0]; 

  try {
    const command = new GetObjectCommand({
      Bucket: PRODUCTS_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    const body = response.Body as any;
    body.pipe(res);
  } catch (error: any) {
    if (error.name !== 'NoSuchKey') {
        console.error(`Error sirviendo imagen ${key}:`, error);
    }
    res.status(404).send('Imagen no encontrada');
  }
});

const WP_URL = process.env.WP_HOST || process.env.WC_BASE || 'http://wordpress/';

if (!isTest) {
  app.use('/wp-content', createProxyMiddleware({ target: WP_URL, changeOrigin: true }));
  app.use('/wp-includes', createProxyMiddleware({ target: WP_URL, changeOrigin: true }));
  app.use('/wp-json/wp/v2', createProxyMiddleware({ target: WP_URL, changeOrigin: true }));
}

app.use(express.json());

const api = new WooCommerceRestApi({
  url: 'http://wordpress/',
  consumerKey: process.env.WC_KEY!,
  consumerSecret: process.env.WC_SECRET!,
  version: 'wc/v3',
  queryStringAuth: false,
  axiosConfig: {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64')
    }
  }
});

// Helper para reescribir URLs de imágenes
const rewriteUrls = (data: any) => {
  if (!data) return data;
  const stringified = JSON.stringify(data);
  const proxied = stringified.replace(/http:\/\/localhost:8086/gi, 'https://test.system4us.com')
                             .replace(/https:\/\/localhost:8086/gi, 'https://test.system4us.com')
                             .replace(/http:\/\/wordpress/gi, 'https://test.system4us.com')
                             .replace(/https:\/\/wordpress/gi, 'https://test.system4us.com')
                             .replace(/http:\/\/10\.10\.0\.3:8086/gi, 'https://test.system4us.com');
  return JSON.parse(proxied);
};

// Supongamos que guardamos los atributos globales en memoria
const ATTRIBUTES: any[] = [];

const loadAttributes = async () => {
  if (isTest) return;
  try {
    const res = await api._request('GET', 'products/attributes');
    const attrs = res.data;
    if (Array.isArray(attrs)) {
      ATTRIBUTES.length = 0;
      for (const attr of attrs) {
        try {
          const termsResp = await api._request('GET', `products/attributes/${attr.id}/terms`);
          ATTRIBUTES.push({
            ...attr,
            options: Array.isArray(termsResp.data) ? termsResp.data.map((t: any) => t.name) : []
          });
        } catch {
          ATTRIBUTES.push({ ...attr, options: [] });
        }
      }
    }
    console.log('Atributos cargados');
  } catch (err) {
    console.error('Error cargando atributos:', err);
  }
};

const initialize = async () => {
  if (isTest) return;
  console.log('Iniciando Backend...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await loadAttributes();
};

// --- HELPER DE CACHÉ INTELIGENTE ---
const getCache = async (key: string) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data.toString()) : null;
  } catch (err) {
    console.error('Redis Get Error:', err);
    return null;
  }
};

const setCache = async (key: string, data: any, ttl = 3600) => {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (err) {
    console.error('Redis Set Error:', err);
  }
};

const clearCacheByPattern = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Caché limpiada para patrón: ${pattern}`);
    }
  } catch (err) {
    console.error('Redis Clear Error:', err);
  }
};

initialize();

// --- ENDPOINTS ---

app.get('/orders/view-receipt/:key', async (req: Request, res: Response) => {
  const { key } = req.params;
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const response = await s3Client.send(command);
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    const body = response.Body as any;
    body.pipe(res);
  } catch (error) {
    res.status(404).json({ error: 'Archivo no encontrado' });
  }
});

app.get('/wc/payment-gateways', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', 'payment_gateways');
    if (!response.data || !Array.isArray(response.data)) return res.json([]);
    const activeGateways = response.data.filter((g: any) => g.enabled);
    res.json(activeGateways);
  } catch (err: any) {
    res.status(500).json({ error: 'Error' });
  }
});

app.get('/wc/products', async (req: Request, res: Response) => {
  const cacheKey = `products:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await api.getProducts(req.query);
    if (!response.data || !Array.isArray(response.data)) return res.json([]);
    
    if (response.headers['x-wp-total']) {
      res.setHeader('X-WP-Total', response.headers['x-wp-total']);
      res.setHeader('Access-Control-Expose-Headers', 'X-WP-Total');
    }

    const data = rewriteUrls(response.data);
    await setCache(cacheKey, data);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Error obteniendo productos' });
  }
});

app.get('/wc/products/:id', async (req: Request, res: Response) => {
  const cacheKey = `product:${req.params.id}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await api.getProduct(Number(req.params.id));
    const data = rewriteUrls(response.data);
    await setCache(cacheKey, data);
    res.json(data);
  } catch (err: any) {
    res.status(404).json({ error: 'No encontrado' });
  }
});

app.get('/wc/products/:id/variations', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', `products/${req.params.id}/variations`);
    res.json(response.data);
  } catch (err: any) {
    res.json([]); 
  }
});

app.get('/wc/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', 'products/reviews', { product: [req.params.id] });
    res.json(response.data);
  } catch (err: any) {
    res.json([]);
  }
});

app.get('/wc/reviews/check', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', 'products/reviews', { product: [req.query.product_id], reviewer_email: req.query.email });
    res.json({ hasReviewed: Array.isArray(response.data) && response.data.length > 0 });
  } catch (err) {
    res.json({ hasReviewed: false });
  }
});

app.get('/wc/categories', async (req: Request, res: Response) => {
  const cacheKey = `categories:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await api._request('GET', 'products/categories', req.query);
    if (!response.data || !Array.isArray(response.data)) return res.json([]);
    
    const categories = response.data.map((cat: any) => ({
      id: cat.id, name: cat.name, slug: cat.slug, parent: cat.parent, image: cat.image ? cat.image.src : null,
    }));
    
    await setCache(cacheKey, categories, 7200);
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Error' });
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
          return { id: attr.id, name: attr.name, slug: attr.slug, options: Array.isArray(termsResp.data) ? termsResp.data.map((t: any) => t.name) : [] };
        } catch {
          return { id: attr.id, name: attr.name, slug: attr.slug, options: [] };
        }
      })
    );
    res.json(attributesWithTerms);
  } catch (err: any) {
    res.status(500).json({ error: 'Error obteniendo atributos' });
  }
});

app.post('/wc/reviews', async (req: Request, res: Response) => {
  try {
    const response = await api._request('POST', 'products/reviews', req.body);
    await clearCacheByPattern('product:*'); 
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al crear reseña' });
  }
});

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
      return res.status(response.status).json({ error: true, message: data.message });
    }
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: true, message: 'Auth Error' });
  }
});

app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const response = await api._request('POST', 'customers', req.body);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: 'Error registrando usuario' });
  }
});

app.get('/auth/customer', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', 'customers', { email: req.query.email as string });
    if (!response.data || response.data.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(response.data[0]);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener datos del cliente' });
  }
});

app.put('/auth/customer/:id', async (req: Request, res: Response) => {
  try {
    const response = await api._request('PUT', `customers/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

app.get('/auth/orders', async (req: Request, res: Response) => {
  try {
    const customerRes = await api._request('GET', 'customers', { email: req.query.email as string });
    if (!customerRes.data || customerRes.data.length === 0) return res.json([]);
    const ordersRes = await api._request('GET', 'orders', { customer: customerRes.data[0].id });
    res.json(ordersRes.data);
  } catch (err: any) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

app.post('/orders/upload-receipt', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
  try {
    const fileName = `${Date.now()}-${req.file.originalname}`;
    await s3Client.send(new PutObjectCommand({ Bucket: BUCKET_NAME, Key: fileName, Body: req.file.buffer, ContentType: req.file.mimetype }));
    const fileUrl = `https://test.system4us.com/orders/view-receipt/${fileName}`;
    await api._request('POST', `orders/${req.body.order_id}/notes`, {
      note: `Comprobante de pago subido por el cliente. <br/><a href="${fileUrl}" target="_blank" style="display:inline-block; background:#007cba; color:white; padding:5px 10px; text-decoration:none; border-radius:4px;">Ver Comprobante</a>`,
      customer_note: false 
    });
    res.json({ success: true, message: 'Comprobante registrado', url: fileUrl });
  } catch (err: any) {
    res.status(500).json({ error: 'Error al registrar comprobante' });
  }
});

app.post('/checkout', async (req: Request, res: Response) => {
  try {
    const response = await api._request('POST', 'orders', {
      payment_method: req.body.payment_method || 'bacs',
      payment_method_title: req.body.payment_method_title || 'Transferencia Bancaria',
      set_paid: req.body.set_paid || false,
      customer_id: req.body.customer_id || 0,
      billing: req.body.billing,
      shipping: req.body.shipping || req.body.billing,
      line_items: req.body.line_items,
      customer_note: req.body.customer_note
    });
    const newOrder = response.data;
    await sendEmail(req.body.billing.email, `Confirmación de pedido #${newOrder.id}`, 'order-confirmation', {
      name: req.body.billing.first_name,
      order_id: newOrder.id,
      items: newOrder.line_items.map((item: any) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      total: newOrder.total,
      year: new Date().getFullYear()
    });
    res.json({ order_id: newOrder.id, link: newOrder.link });
  } catch (err: any) {
    res.status(500).json({ error: 'Error creando pedido' });
  }
});

app.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const usersRes = await api._request('GET', 'customers', { email: req.body.email });
    if (!usersRes.data || usersRes.data.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const user = usersRes.data[0];
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await redisClient.set(`reset_token:${resetToken}`, user.id.toString(), { EX: 3600 });
    const resetLink = `https://test.system4us.com/reset-password?token=${resetToken}`;
    await sendEmail(req.body.email, 'Recuperación de Contraseña', 'reset-password', { name: user.first_name || 'Cliente', reset_link: resetLink, year: new Date().getFullYear() });
    res.json({ message: 'Correo enviado' });
  } catch (err) {
    res.status(500).json({ error: 'Error' });
  }
});

app.post('/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const userId = await redisClient.get(`reset_token:${req.body.token}`);
    if (!userId) return res.status(400).json({ error: 'El enlace ha expirado o es inválido' });
    await api._request('PUT', `customers/${userId}`, { password: req.body.password });
    await redisClient.del(`reset_token:${req.body.token}`);
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: 'Error interno al actualizar contraseña' });
  }
});

app.post('/webhooks/order-updated', async (req: Request, res: Response) => {
  const order = req.body;
  try {
    if (order.status === 'completed' || order.status === 'processing') {
        const trackingMeta = order.meta_data.find((m: any) => m.key === '_tracking_number' || m.key === 'tracking_number');
        const trackingNumber = trackingMeta ? trackingMeta.value : null;
        await sendEmail(order.billing.email, `Tu pedido #${order.id} está en camino`, 'order-shipped', { name: order.billing.first_name, order_id: order.id, tracking_number: trackingNumber, tracking_url: trackingNumber ? `https://correo.com/tracking/${trackingNumber}` : null });
    }
    res.status(200).send('Webhook processed');
  } catch (err) {
    res.status(500).send('Error processing webhook');
  }
});

export { app, httpServer };

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(4000, () => console.log('Servidor (HTTP + Socket.IO) corriendo en puerto 4000'));
}
