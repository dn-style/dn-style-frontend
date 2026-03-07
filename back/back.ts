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

// --- CONFIGURACIÓN DE RUTAS ---
// Si estamos en la carpeta dist (producción), el root es un nivel arriba
const ROOT_DIR = __dirname.endsWith('dist') ? path.join(__dirname, '..') : __dirname;
const SITE_URL = process.env.SITE_URL || 'https://dnshop.com.ar'; // Default a producción

// --- CONFIGURACIÓN DEBUG ---
const isVerbose = process.env.VERBOSE_DEBUG === 'true' || process.argv.includes('--debug');

// --- CONFIGURACIÓN REDIS ---
const isTest = process.env.NODE_ENV === 'test';
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://host.docker.internal:6379'
});

if (!isTest) {
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.connect().then(() => console.log('✅ Conectado a Redis')).catch(() => {
    console.error('❌ Error conexión Redis. ¿Está el servicio arriba?');
  });
}

// --- CONFIGURACIÓN CORS ---
const allowedOrigins = [
  'https://dnshop.com.ar',
  'http://dnshop.com.ar',
  'https://dnshop.com.ar',
  'http://dnshop.com.ar',
  'https://www.dnshop.com.ar',
  'http://www.dnshop.com.ar',
  'http://10.10.0.3:3001',
  'http://localhost:3000',
  'http://localhost:3001'
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir peticiones sin origen (como apps móviles o curl) o que estén en la whitelist
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

export const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
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

const flushCacheByPattern = async (pattern: string) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[Cache] 🧹 Flushed ${keys.length} keys matching: ${pattern}`);
    }
  } catch (err) {
    console.error(`[Cache Error] ❌ Error flushing pattern ${pattern}:`, err);
  }
};

// --- REWRITE URLS ---
const rewriteUrls = (data: any) => {
  if (!data) return data;

  const siteUrlBase = SITE_URL;
  let s = JSON.stringify(data);

  // Capturar cualquier dominio que tenga wp-content/uploads y redirigirlo a nuestro proxy de imágenes
  const uploadsPattern = /https?:(\/\/|\\\/\\\/)[^"'\s]+?(\/|\\\/)wp-content(\/|\\\/)uploads/gi;
  s = s.replace(uploadsPattern, `${siteUrlBase}/images/uploads`);

  // Reemplazar hosts conocidos por nuestra SITE_URL para otros endpoints
  const hostPattern = /https?:(\/\/|\\\/\\\/)(wordpress|localhost|10\.10\.0\.3)(:[0-9]+)?/gi;
  s = s.replace(hostPattern, siteUrlBase);

  return JSON.parse(s);
};

// --- STORAGE & EMAIL ---
// Configuración optimizada para Brevo y otros proveedores modernos
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // false para puerto 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Ayuda con la compatibilidad de certificados en contenedores
  }
});

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://host.docker.internal:9000',
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin' },
  forcePathStyle: true,
});
const PRODUCTS_BUCKET = process.env.STORAGE_BUCKET_PRODUCTS || 'products';

// --- ASEGURAR BUCKET ---
const ensureBucketExists = async () => {
  if (isTest) return;
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: PRODUCTS_BUCKET }));
    console.log(`✅ Bucket "${PRODUCTS_BUCKET}" verificado.`);
  } catch (err: any) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      console.log(`🟡 Bucket "${PRODUCTS_BUCKET}" no existe. Creándolo...`);
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: PRODUCTS_BUCKET }));
        console.log(`✅ Bucket "${PRODUCTS_BUCKET}" creado con éxito.`);
      } catch (createErr: any) {
        console.error(`❌ Error al crear bucket: ${createErr.message}`);
      }
    } else {
      console.error(`❌ Error al verificar bucket: ${err.message}`);
    }
  }
};
ensureBucketExists();

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
app.use(cors(corsOptions));
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
    console.log(`[Customer] 🔍 Buscando perfil para: ${email}`);
    const auth = Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64');

    const response = await axios.get('http://wordpress/wp-json/wc/v3/customers', {
      params: { email: email as string },
      headers: { 'Authorization': `Basic ${auth}` }
    });

    const customer = Array.isArray(response.data) ? response.data[0] : null;
    if (customer) {
      console.log(`[Customer] ✅ Perfil encontrado ID: ${customer.id}`);
      res.json(rewriteUrls(customer));
    } else {
      console.log(`[Customer] ⚠️ No se encontró perfil para ${email}`);
      res.json({});
    }
  } catch (err: any) {
    console.error('[Customer Error] ❌ Fallo al obtener perfil:', err.response?.data || err.message);
    res.status(500).json({ message: 'Error' });
  }
});

app.put('/auth/customer/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`[Customer] 💾 Actualizando perfil ID: ${id}`);
    const auth = Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64');

    const response = await axios.put(`http://wordpress/wp-json/wc/v3/customers/${id}`, req.body, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    console.log(`[Customer] ✅ Perfil ID ${id} actualizado con éxito`);
    res.json(rewriteUrls(response.data));
  } catch (err: any) {
    console.error('[Customer Error] ❌ Fallo al actualizar:', err.response?.data || err.message);
    res.status(500).json({ message: 'Error al actualizar perfil' });
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

app.post('/auth/orders', async (req: Request, res: Response) => {
  try {
    const auth = Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64');
    const fullPayload = req.body;

    // Extraemos nuestros datos internos para que WooCommerce no se queje de campos desconocidos
    const { _conversion_data, ...orderPayload } = fullPayload;

    console.log('[Create Order] 🛒 Enviando a WooCommerce:', JSON.stringify(orderPayload, null, 2));

    const response = await axios.post('http://wordpress/wp-json/wc/v3/orders', orderPayload, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    console.log('[Create Order] ✅ WooCommerce respondió con Status:', response.status);

    // Si la orden se creó correctamente, proceder con notificaciones y notas
    if (response.data && response.data.id) {
      const orderId = response.data.id;

      // 1. NOTIFICACIÓN INMEDIATA AL ADMIN (Desde la API para mayor fiabilidad)
      const customerName = `${fullPayload.billing?.first_name || ''} ${fullPayload.billing?.last_name || ''}`.trim() || 'Cliente';
      await sendAdminNotification(
        `Nuevo Pedido #${orderId}`, 
        `Se ha recibido un nuevo pedido de <b>${customerName}</b> por un total de <b>${response.data.total} ${response.data.currency}</b>.`
      );

      // 2. Si tenemos datos de conversión, crear nota privada
      if (_conversion_data && Number(_conversion_data.rate) > 0) {
        const rateVal = _conversion_data.rate;
        const totalVal = _conversion_data.total_ars || 0;

        const noteContent = `ℹ️ DETALLES DE CONVERSIÓN (ARS):\n\n` +
          `• Cotización aplicada: $${rateVal}\n` +
          `• Total en Pesos: ARS $${Number(totalVal).toLocaleString('es-AR')}\n\n` +
          `Detalle de productos:\n${_conversion_data.details || 'No especificado'}`;

        try {
          await axios.post(`http://wordpress/wp-json/wc/v3/orders/${orderId}/notes`,
            { note: noteContent, customer_note: false },
            { headers: { 'Authorization': `Basic ${auth}` } }
          );
          console.log(`[Create Order] 📝 Nota de conversión creada en pedido #${orderId}`);
        } catch (noteErr: any) {
          console.error(`[Create Order] ⚠️ Error al crear nota de conversión:`, noteErr.message);
        }
      }
    }

    res.json(rewriteUrls(response.data));
  } catch (err: any) {
    console.error('[Create Order Error] ❌ Error detallado:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Mensaje:', err.message);
    }
    res.status(err.response?.status || 500).json(err.response?.data || { message: 'Error al crear pedido' });
  }
});

app.get('/wc/payment_gateways', async (req: Request, res: Response) => {
  try {
    const response = await api.get('payment_gateways');
    res.json(rewriteUrls(response.data));
  } catch { res.json([]); }
});

app.get('/wc/reviews/check', async (req: Request, res: Response) => {
  try {
    const { product_id, email } = req.query;
    const auth = Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64');

    // Usamos axios directamente para evitar problemas de tipos con la librería
    const response = await axios.get(`http://wordpress/wp-json/wc/v3/products/reviews`, {
      params: {
        product: Number(product_id),
        reviewer_email: email as string
      },
      headers: { 'Authorization': `Basic ${auth}` }
    });

    res.json({ hasReviewed: Array.isArray(response.data) && response.data.length > 0 });
  } catch (err) {
    res.json({ hasReviewed: false });
  }
});

app.post('/wc/reviews', async (req: Request, res: Response) => {
  try {
    const auth = Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64');
    const response = await axios.post('http://wordpress/wp-json/wc/v3/products/reviews', req.body, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    res.json(response.data);
  } catch (err: any) {
    console.error('[Review Error]', err.response?.data || err.message);
    res.status(err.response?.status || 500).json(err.response?.data || { message: 'Error al enviar reseña' });
  }
});

app.get('/wc/rate', async (req: Request, res: Response) => {
  const cacheKey = 'dolar_blue_rate';
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get('https://dolarapi.com/v1/dolares/blue');
    const data = response.data;
    if (data && data.venta) {
      // Aplicar el 2% de recargo sobre el precio de venta
      const rateWithMarkup = data.venta * 1.02;
      const result = { rate: rateWithMarkup, original: data.venta, timestamp: new Date() };

      // Cachear por 30 minutos (1800 segundos)
      await setCache(cacheKey, result, 1800);
      return res.json(result);
    }
    res.status(500).json({ error: 'Invalid rate data' });
  } catch (err) {
    console.error('[Rate Error]', err);
    res.status(500).json({ error: 'Error fetching rate' });
  }
});

app.post('/auth/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const templatePath = path.join(ROOT_DIR, 'email-templates', 'reset-password.hbs');
    if (!fs.existsSync(templatePath)) throw new Error('Template not found');

    const source = fs.readFileSync(templatePath, 'utf8');
    const template = hbs.compile(source);

    // En un sistema real generaríamos un token único. 
    // Por ahora simulamos el envío del enlace de recuperación.
    const resetLink = `${SITE_URL}/reset-password?email=${encodeURIComponent(email)}&token=simulated-token`;

    const html = template({
      email,
      reset_link: resetLink,
      year: new Date().getFullYear()
    });

    await transporter.sendMail({
      from: getSenderInfo(),
      to: email,
      subject: 'Recuperar Contraseña - DN shop',
      html
    });

    res.json({ sent: true });
  } catch (err) {
    console.error('[Forgot Password Error]', err);
    res.status(500).json({ message: 'Error al enviar el correo' });
  }
});

const upload = multer({ dest: '/tmp/' });
app.post('/orders/upload-receipt', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { order_id } = req.body;
    if (!req.file) {
      console.error('[Upload Receipt] No se recibió ningún archivo');
      return res.status(400).send('No file');
    }

    console.log(`[Upload Receipt] 📂 Recibido archivo para orden ${order_id}: ${req.file.originalname}`);

    const fileContent = fs.readFileSync(req.file.path);
    const key = `receipts/order-${order_id}-${Date.now()}-${req.file.originalname}`;

    console.log(`[Upload Receipt] ☁️ Subiendo a S3: ${key}...`);
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: PRODUCTS_BUCKET,
        Key: key,
        Body: fileContent,
        ContentType: req.file.mimetype
      }));
      console.log(`[Upload Receipt] ✅ Subida a S3 exitosa`);
    } catch (s3Err: any) {
      console.error('[Upload Receipt] ❌ Error en S3:', s3Err.message);
      throw new Error(`Error al subir a almacenamiento: ${s3Err.message}`);
    }

    console.log(`[Upload Receipt] 📝 Actualizando orden ${order_id} a 'on-hold' y creando nota...`);
    try {
      const auth = Buffer.from(`${process.env.WC_KEY}:${process.env.WC_SECRET}`).toString('base64');
      const noteContent = `Comprobante subido: ${SITE_URL}/images/${key}`;

      // 1. Actualizar estado a 'on-hold' (En espera de revisión)
      await axios.put(`http://wordpress/wp-json/wc/v3/orders/${order_id}`,
        { status: 'on-hold' },
        { headers: { 'Authorization': `Basic ${auth}` } }
      );

      // 2. Crear la nota privada (solo para admin)
      await axios.post(`http://wordpress/wp-json/wc/v3/orders/${order_id}/notes`,
        { note: noteContent, customer_note: false },
        { headers: { 'Authorization': `Basic ${auth}` } }
      );
      console.log(`[Upload Receipt] ✅ Orden actualizada y nota creada`);
    } catch (wcErr: any) {
      console.error('[Upload Receipt] ⚠️ Error al actualizar WC (pero el archivo se subió):', wcErr.response?.data || wcErr.message);
    }

    res.json({ success: true, key });
  } catch (err: any) {
    console.error('[Upload Receipt Error] ❌ Fallo total:', err.message);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
});

// --- 1. API ROUTES (MÁXIMA PRIORIDAD) ---

app.get(/^\/images\/(.*)/, async (req: Request, res: Response) => {
  let key = req.params[0];

  // Header de diagnóstico para confirmar que el backend está sirviendo el archivo
  res.setHeader('X-Served-By', 'dn-backend');

  // Normalizar key: eliminar barras iniciales y decodificar URI
  const cleanKey = decodeURIComponent(key.replace(/^\/+/, ''));

  if (isVerbose) console.log(`[Images] 📸 Request for: ${cleanKey} (Original: ${key})`);

  // --- SEGURIDAD PARA COMPROBANTES ---
  // Detección más flexible: si la ruta CONTIENE 'receipts/'
  if (cleanKey.includes('receipts/')) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log(`[SECURITY CHECK] ACCESO A COMPROBANTE DETECTADO: ${cleanKey}`);
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

    const authHeader = req.headers.authorization;
    const cookieHeader = req.headers.cookie;

    if (isVerbose) {
      console.log(`[Security] 🛡️ Verificando acceso a comprobante: ${cleanKey}`);
      console.log(`[Security] Auth Header: ${authHeader ? 'Presente' : 'Ausente'}`);
      console.log(`[Security] Cookie Header: ${cookieHeader ? 'Presente' : 'Ausente'}`);
    }

    if (!authHeader && !cookieHeader) {
      console.warn(`[Security] 🚫 Intento de acceso anónimo a comprobante: ${cleanKey}`);
      return res.status(401).send('No autorizado: Recurso privado');
    }

    if (isVerbose && cookieHeader) {
      const cookieNames = cookieHeader.split(';').map(c => c.split('=')[0].trim());
      console.log(`[Security] 🍪 Cookies recibidas: ${cookieNames.join(', ')}`);
    }

    try {
      // Usar nuestro puente de autenticación PHP que es más fiable con las cookies de sesión
      const targetHost = req.headers.host || 'dnshop.com.ar';

      const wpResponse = await axios.get('http://wordpress/auth-bridge.php', {
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
          'Host': targetHost,
          'X-Forwarded-Proto': 'https',
          'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (DN-Backend)'
        }
      });

      const { authenticated, is_privileged, user_login } = wpResponse.data;

      if (!authenticated) {
        console.warn(`[Security] 🚫 Intento de acceso a comprobante: No autenticado. Cookies: ${wpResponse.data.debug?.cookies_count || 0}`);
        return res.status(401).send('No autorizado: Debes iniciar sesión');
      }

      if (!is_privileged) {
        console.warn(`[Security] 🚫 Acceso denegado para usuario ${wpResponse.data.id} a comprobante: ${cleanKey}. No es Admin.`);
        return res.status(403).send('Prohibido: Permisos insuficientes (Se requiere rol de administrador)');
      }

      console.log(`[Security] ✅ Acceso concedido a admin (${user_login}) para comprobante: ${cleanKey}`);

      // Para comprobantes, forzar no-cache SIEMPRE, incluso si la respuesta es exitosa
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } catch (wpErr: any) {
      console.error(`[Security] ❌ Error de verificación de auth para ${cleanKey}: ${wpErr.message}`);
      if (wpErr.response) {
        console.error(`[Security] WP Response Status: ${wpErr.response.status}`);
        if (isVerbose) console.error(`[Security] WP Response Data:`, wpErr.response.data);
      }
      return res.status(401).send('No autorizado: Sesión inválida o expirada');
    }
  }

  // Usar la key limpia para el resto de la lógica
  key = cleanKey;

  // Limpiar cualquier cabecera previa que pudiera inyectar Nginx o Middlewares
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');

  // Forzar políticas laxas para evitar ORB (Opaque Response Blocking)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Timing-Allow-Origin', '*');

  try {
    const response = await s3Client.send(new GetObjectCommand({ Bucket: PRODUCTS_BUCKET, Key: key }));

    let contentType = response.ContentType;
    if (!contentType || contentType === 'application/octet-stream') {
      const ext = path.extname(key).toLowerCase();
      const mimeMap: any = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
        '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf'
      };
      contentType = mimeMap[ext] || 'image/jpeg';
    }
    if (isVerbose) console.log(`[Proxy] ☁️ S3 OK (${contentType}): ${key}`);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    return (response.Body as any).pipe(res);
  } catch (err) {
    if (isVerbose) console.log(`[Proxy] ⚠️ S3 FAIL: ${key}, reintentando local...`);

    const pathsToTry = [
      path.join(ROOT_DIR, 'wp_uploads', 'wp-content', key),
      path.join(ROOT_DIR, 'wp_uploads', key),
      path.join(ROOT_DIR, 'wp_uploads', key.replace(/^uploads\//, ''))
    ];

    for (const localPath of pathsToTry) {
      if (fs.existsSync(localPath) && !fs.lstatSync(localPath).isDirectory()) {
        if (isVerbose) console.log(`[Proxy] 🏠 LOCAL OK: ${localPath}`);
        // Intentar inferir content type también para local
        const ext = path.extname(localPath).toLowerCase();
        const mimeMap: any = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
        if (mimeMap[ext]) res.setHeader('Content-Type', mimeMap[ext]);
        return res.sendFile(localPath);
      }
    }

    if (isVerbose) console.log(`[Proxy] ❌ NOT FOUND: ${key}`);
    // Píxel transparente para evitar error ORB de consola
    res.status(404).setHeader('Content-Type', 'image/png').send(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
  }
});

app.get('/wc/products/:id/reviews', async (req: Request, res: Response) => {
  try {
    const response = await api._request('GET', 'products/reviews', { product: [req.params.id] });
    res.json(rewriteUrls(response.data));
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
  const isForce = req.query.force === 'true';
  const cacheKey = `categories:${JSON.stringify(req.query)}`;

  if (!isForce) {
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log(`[Categories] ⚡ Serving from cache: ${cacheKey}`);
      return res.json(cached);
    }
  } else {
    console.log(`[Categories] 🔄 Force refresh requested. Bypassing cache.`);
  }

  try {
    console.log(`[Categories] 🌐 Fetching from WordPress API...`);
    const response = await api._request('GET', 'products/categories', req.query);
    const categories = response.data.map((cat: any) => ({
      id: cat.id, name: cat.name, slug: cat.slug, parent: cat.parent, image: cat.image ? cat.image.src : null,
    }));
    const data = rewriteUrls(categories);
    await setCache(cacheKey, data, 3600);

    // Disable browser caching for categories
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json(data);
  } catch (err: any) {
    console.error(`[Categories Error] ❌ Fallo al obtener categorías:`, err.message);
    res.status(500).json({ error: true });
  }
});

// Endpoint para limpiar manualmente toda la caché (útil para desarrollo/troubleshooting)
app.post('/wc/cache/flush', async (req: Request, res: Response) => {
  try {
    console.log(`[Cache] 🧨 Manual flushAll requested.`);
    await redisClient.flushAll();
    res.json({ success: true, message: 'All cache flushed' });
  } catch (err) {
    res.status(500).json({ error: true });
  }
});

// --- 2. SSR ROUTES ---

const cleanText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Eliminar tags HTML
    .replace(/"/g, '&quot;') // Escapar comillas dobles
    .replace(/\n/g, ' ')     // Eliminar saltos de línea
    .trim();
};

const serveWithSEO = async (req: Request, res: Response, seoData: { title: string, description: string, image: string }) => {
  const indexPath = path.join(ROOT_DIR, 'public_html', 'index.html');
  if (!fs.existsSync(indexPath)) return res.status(500).send('Build not found');

  let html = fs.readFileSync(indexPath, 'utf8');
  const fullTitle = `${seoData.title} | DN shop`;
  const cleanDescription = cleanText(seoData.description);

  html = html.replace(/<title>.*?<\/title>/g, `<title>${fullTitle}</title>`);

  const metaTags = `
    <meta name="description" content="${cleanDescription}" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${cleanDescription}" />
    <meta property="og:image" content="${seoData.image}" />
    <meta property="og:type" content="product" />
    <meta name="twitter:card" content="summary_large_image" />
  `;

  res.send(html.replace('</head>', `${metaTags}</head>`));
};

app.get('/producto/:id', async (req: Request, res: Response) => {
  try {
    const response = await api.getProduct(Number(req.params.id));
    const p = rewriteUrls(response.data);
    await serveWithSEO(req, res, { title: p.name, description: p.short_description || '', image: p.images?.[0]?.src || '' });
  } catch { res.sendFile(path.join(ROOT_DIR, 'public_html', 'index.html')); }
});

// --- 3. STATIC & FALLBACK (MÍNIMA PRIORIDAD) ---
app.use(express.static(path.join(ROOT_DIR, 'public_html')));
app.get(/^\/(?!wc|auth|images|orders).*/, (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'public_html', 'index.html'));
});

// --- HELPER: OBTENER REMITENTE ---
const getSenderInfo = () => {
  const email = process.env.EMAIL_SENDER || process.env.SMTP_USER;
  const name = process.env.EMAIL_SENDER_NAME || "DN shop";
  return `"${name}" <${email}>`;
};

// --- HELPER: ENVIAR NOTIFICACIÓN AL ADMIN ---
const sendAdminNotification = async (subject: string, content: string) => {
  try {
    // El destinatario es ADMIN_EMAIL, o EMAIL_SENDER como fallback
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_SENDER || process.env.SMTP_USER;
    
    // Si el email parece ser un ID de Brevo, cancelamos para evitar rebotar
    if (!adminEmail || adminEmail.includes('smtp-brevo.com') || !adminEmail.includes('@')) {
       console.warn('[Email Admin] ⚠️ No hay una dirección de correo real para el admin. Configura ADMIN_EMAIL.');
       return;
    }

    await transporter.sendMail({
      from: getSenderInfo(),
      to: adminEmail,
      subject: `[ADMIN] ${subject}`,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333;">Notificación de Sistema</h2>
              <p style="font-size: 16px; color: #666;">${content}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999;">DN shop Backend - ${new Date().toLocaleString()}</p>
             </div>`
    });
    console.log(`[Email Admin] ✅ Notificación enviada: ${subject}`);
  } catch (err) {
    console.error('[Email Admin Error] ❌ No se pudo enviar notificación:', err);
  }
};

// --- HELPER: ENVIAR EMAILS DE PEDIDO ---
const sendOrderEmail = async (orderData: any, templateName: string) => {
  try {
    const templatePath = path.join(ROOT_DIR, 'email-templates', `${templateName}.hbs`);
    if (!fs.existsSync(templatePath)) {
      console.error(`[Email] ❌ No existe el template: ${templatePath}`);
      return;
    }

    const source = fs.readFileSync(templatePath, 'utf8');
    const template = hbs.compile(source);

    const html = template({
      name: orderData.billing?.first_name || 'Cliente',
      order_id: orderData.id,
      total: orderData.total,
      items: orderData.line_items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.total
      })),
      year: new Date().getFullYear()
    });

    const subjects: any = {
      'order-confirmation': `Pedido Recibido #${orderData.id} - DN shop`,
      'order-preparing': `Estamos preparando tu pedido #${orderData.id} - DN shop`,
      'order-cancelled': `Pedido Cancelado #${orderData.id} - DN shop`
    };

    const mailOptions = {
      from: getSenderInfo(),
      to: orderData.billing?.email,
      subject: subjects[templateName] || `Actualización de Pedido #${orderData.id}`,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] ✅ Enviado "${templateName}" a ${orderData.billing?.email}`);
  } catch (err) {
    console.error('[Email Error] ❌ No se pudo enviar el correo:', err);
  }
};

// --- WEBHOOKS WOOCOMMERCE ---
app.post('/webhooks/woocommerce', async (req: Request, res: Response) => {
  const topic = req.headers['x-wc-webhook-topic'] as string;
  const data = req.body;

  if (!data || Object.keys(data).length === 0) {
    console.warn(`[Webhook] ⚠️ Petición vacía recibida en /webhooks/woocommerce`);
    return res.status(200).send('OK (Empty)'); // Respondemos 200 para que WC no reintente si es un ping
  }

  console.log(`[Webhook] 🔔 Evento recibido: ${topic} (ID: ${data?.id || 'N/A'}, Status: ${data?.status || 'N/A'})`);

  try {
    switch (topic) {
      case 'order.created':
        if (data && data.id) {
          // SOLO enviamos el mail al cliente. 
          // El aviso al admin ya se envió desde la API para mayor velocidad y fiabilidad.
          await sendOrderEmail(data, 'order-confirmation');
        }
        break;

      case 'order.updated':
        // Mapeo de estados a templates
        if (data && data.status === 'processing') {
          await sendOrderEmail(data, 'order-preparing');
          await sendAdminNotification(`Pedido #${data.id} en Preparación`, `El pedido de <b>${data.billing?.first_name}</b> ha pasado a estado 'procesando'.`);
        } else if (data && data.status === 'cancelled') {
          await sendOrderEmail(data, 'order-cancelled');
          await sendAdminNotification(`Pedido #${data.id} CANCELADO`, `El pedido ha sido marcado como cancelado.`);
        } else if (data) {
          // Notificar cualquier otro cambio de estado al admin
          await sendAdminNotification(`Actualización Pedido #${data.id}`, `El pedido ha cambiado su estado a: <b>${data.status}</b>.`);
        }
        break;

      case 'category.created':
      case 'category.updated':
      case 'category.deleted':
        console.log(`[Webhook] 🧹 Flushing categories and products cache due to: ${topic}`);
        await flushCacheByPattern('categories:*');
        await flushCacheByPattern('products:*');
        await flushCacheByPattern('variations:*');
        await flushCacheByPattern('product:*');
        break;

      default:
        if (isVerbose) console.log(`[Webhook] Topic no manejado: ${topic}`);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Webhook Error] ❌ Error procesando evento:', err);
    res.status(500).send('Error');
  }
});

httpServer.listen(4000, () => console.log('Servidor 4000 listo'));
