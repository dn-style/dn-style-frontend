import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import WooCommerceRestApi from 'woocommerce-rest-ts-api';
import cors from 'cors';
import axios from 'axios';
import { createProxyMiddleware } from 'http-proxy-middleware';
import multer from 'multer';
import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import "dotenv/config";

import nodemailer from 'nodemailer';
import hbs from 'handlebars';
import fs from 'fs';
import path from 'path';
import { createClient } from 'redis';

// --- CONFIGURACIÓN DEBUG ---
const isVerbose = process.env.VERBOSE_DEBUG === 'true' || process.argv.includes('--debug');

// --- CONFIGURACIÓN REDIS ---
const isTest = process.env.NODE_ENV === 'test';
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://host.docker.internal:6380'
});

if (!isTest) {
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.connect().then(() => console.log('✅ Conectado a Redis')).catch(console.error);
}

export const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  if (isVerbose) console.log('Cliente chat:', socket.id);
  socket.on('join_chat', () => socket.emit('receive_message', { text: '¡Hola! ¿Cómo podemos ayudarte?', sender: 'agent', timestamp: new Date() }));
});

// --- CACHÉ HELPER ---
const getCache = async (key: string) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data.toString()) : null;
  } catch { return null; }
};

const setCache = async (key: string, data: any, ttl = 60) => {
  try { await redisClient.set(key, JSON.stringify(data), { EX: ttl }); } catch { }
};

// --- REWRITE URLS ---
const rewriteUrls = (data: any) => {
  if (!data) return data;
  let s = JSON.stringify(data);
  const uploadsPattern = /https?:(\/\/|\\\/\\\/)(wordpress|localhost|10\.10\.0\.3|test\.system4us\.com)(:[0-9]+)?(\/|\\\/)wp-content(\/|\\\/)uploads/gi;
  s = s.replace(uploadsPattern, 'https://test.system4us.com/images/uploads');
  const hostPattern = /https?:(\/\/|\\\/\\\/)(wordpress|localhost|10\.10\.0\.3)(:[0-9]+)?/gi;
  s = s.replace(hostPattern, 'https://test.system4us.com');
  return JSON.parse(s);
};

// --- STORAGE & EMAIL ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://host.docker.internal:9000',
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin' },
  forcePathStyle: true,
});
const PRODUCTS_BUCKET = process.env.STORAGE_BUCKET_PRODUCTS || 'products';

// --- WOOCOMMERCE API ---
const api = new WooCommerceRestApi({
  url: 'http://wordpress',
  consumerKey: process.env.WC_KEY!,
  consumerSecret: process.env.WC_SECRET!,
  version: 'wc/v3',
  queryStringAuth: false,
  axiosConfig: { headers: { 'Authorization': 'Basic ' + Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64') } }
});

// --- MIDDLEWARES ---
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// --- LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.url}`);
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// --- AUTH & USER ROUTES ---

app.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const response = await axios.post('http://wordpress/wp-json/jwt-auth/v1/token', req.body);
    res.json(response.data);
  } catch (err: any) {
    console.error('[Login Error]', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { message: 'Error de autenticación' });
  }
});

app.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    const cleanEmail = email.trim();
    
    // Auth básica para WooCommerce API
    const auth = Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64');
    
    const response = await axios.post('http://wordpress/wp-json/wc/v3/customers', {
      email: cleanEmail,
      password,
      first_name: first_name?.trim(),
      last_name: last_name?.trim(),
      username: cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000)
    }, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    
    res.json(response.data);
  } catch (err: any) {
    console.error('[Register Error Full]', err.response?.data || err);
    const errorData = err.response?.data;
    res.status(err.response?.status || 500).json({
      message: errorData?.message || 'Error al registrar usuario',
      code: errorData?.code
    });
  }
});

app.get('/auth/customer', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    const response = await api.get('customers', { email: email as string });
    res.json(response.data[0] || {});
  } catch (err: any) {
    res.status(500).json({ message: 'Error' });
  }
});

app.put('/auth/customer/:id', async (req: Request, res: Response) => {
  try {
    const response = await api.put(`customers/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (err: any) {
    res.status(500).json({ message: 'Error' });
  }
});

app.get('/auth/orders', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    const customerRes = await api.get('customers', { email: email as string });
    const customerId = customerRes.data[0]?.id;
    const params: any = customerId ? { customer: customerId } : { search: email as string };
    const response = await api.get('orders', params);
    res.json(rewriteUrls(response.data));
  } catch (err: any) {
    res.status(500).json([]);
  }
});

app.post('/auth/forgot-password', async (req: Request, res: Response) => {
  res.json({ sent: true });
});

const upload = multer({ dest: '/tmp/' });
app.post('/orders/upload-receipt', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { order_id } = req.body;
    if (!req.file) return res.status(400).send('No file');
    const fileContent = fs.readFileSync(req.file.path);
    const key = `receipts/order-${order_id}-${Date.now()}-${req.file.originalname}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: PRODUCTS_BUCKET, Key: key, Body: fileContent, ContentType: req.file.mimetype
    }));
    await api.post(`orders/${order_id}/notes`, { note: `Comprobante subido: ${key}`, customer_note: true });
    res.json({ success: true, key });
  } catch (err) { res.status(500).send('Error'); }
});

// --- 1. API ROUTES (MÁXIMA PRIORIDAD) ---

app.get(/^\/images\/(.*)/, async (req: Request, res: Response) => {
  const key = req.params[0];
  try {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: PRODUCTS_BUCKET, Key: key }));
    console.log(`[Proxy] ☁️ SIRVIENDO DESDE MINIO/R2: ${key}`);
    if (response.ContentType) res.setHeader('Content-Type', response.ContentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return (response.Body as any).pipe(res);
  } catch {
    const localPath = path.join(__dirname, 'wp_uploads', 'wp-content', key);
    if (fs.existsSync(localPath)) {
      console.log(`[Proxy] 🏠 SIRVIENDO DESDE LOCAL (FALLBACK): ${key}`);
      return res.sendFile(localPath);
    }
    console.log(`[Proxy] ❌ IMAGEN NO ENCONTRADA: ${key}`);
    res.status(404).send('Not Found');
  }
});

app.get('/wc/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', 'products/reviews', { product: [req.params.id] });
    res.json(response.data);
  } catch { res.json([]); }
});

app.get('/wc/products/:id/variations', async (req: Request, res: Response) => {
  const cacheKey = `variations:${req.params.id}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);
  try {
    const response = await api._request('GET', `products/${req.params.id}/variations`);
    const data = rewriteUrls(response.data);
    await setCache(cacheKey, data);
    res.json(data);
  } catch { res.json([]); }
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
  } catch { res.status(404).json({ error: true }); }
});

app.get('/wc/products', async (req: Request, res: Response) => {
  const cacheKey = `products:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);
  try {
    const response = await api.getProducts(req.query);
    const data = rewriteUrls(response.data);
    await setCache(cacheKey, data);
    res.json(data);
  } catch { res.status(500).json({ error: true }); }
});

app.get('/wc/categories', async (req: Request, res: Response) => {
  const cacheKey = `categories:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);
  try {
    const response = await api._request('GET', 'products/categories', req.query);
    const categories = response.data.map((cat: any) => ({
      id: cat.id, name: cat.name, slug: cat.slug, parent: cat.parent, image: cat.image ? cat.image.src : null,
    }));
    const data = rewriteUrls(categories);
    await setCache(cacheKey, data, 7200);
    res.json(data);
  } catch { res.status(500).json({ error: true }); }
});

// --- 2. SSR ROUTES ---

const serveWithSEO = async (req: Request, res: Response, seoData: { title: string, description: string, image: string }) => {
  const indexPath = path.join(__dirname, 'public_html', 'index.html');
  if (!fs.existsSync(indexPath)) return res.status(500).send('Build not found');
  let html = fs.readFileSync(indexPath, 'utf8');
  const fullTitle = `${seoData.title} | DN STYLE`;
  html = html.replace(/<title>.*?<\/title>/g, `<title>${fullTitle}</title>`);
  const metaTags = `<meta name="description" content="${seoData.description}" /><meta property="og:title" content="${fullTitle}" /><meta property="og:image" content="${seoData.image}" /><meta property="og:type" content="product" />`;
  res.send(html.replace('</head>', `${metaTags}</head>`));
};

app.get('/producto/:id', async (req: Request, res: Response) => {
  try {
    const response = await api.getProduct(Number(req.params.id));
    const p = response.data;
    await serveWithSEO(req, res, { title: p.name, description: p.short_description || '', image: p.images?.[0]?.src || '' });
  } catch { res.sendFile(path.join(__dirname, 'public_html', 'index.html')); }
});

// --- 3. STATIC & FALLBACK (MÍNIMA PRIORIDAD) ---
app.use(express.static(path.join(__dirname, 'public_html')));
app.get(/^\/(?!wc|auth|images|orders).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public_html', 'index.html'));
});

httpServer.listen(4000, () => console.log('Servidor 4000 listo'));
