import 'dotenv/config';
import http from 'http';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { body, validationResult } from 'express-validator';
import compression from 'compression';

import verifyRoutes from './src/routes/verify.routes.js';
import japRoutes from './src/routes/jap.routes.js';
import cartRoutes from './src/routes/cart.routes.js';
import { connectDB } from './src/db.js';

const app = express();
await connectDB();

// npm run dev
app.set('trust proxy', 1);
app.disable('x-powered-by'); 

const isProd = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: isProd ? {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", ...String(process.env.CSP_SCRIPT_SRC || '').split(' ').filter(Boolean)],
      "connect-src": ["'self'", ...String(process.env.CSP_CONNECT_SRC || '').split(' ').filter(Boolean)],
      "style-src":   ["'self'", ...String(process.env.CSP_STYLE_SRC   || '').split(' ').filter(Boolean)],
      "font-src":    ["'self'", ...String(process.env.CSP_FONT_SRC    || '').split(' ').filter(Boolean)],
      "img-src":     ["'self'", "data:", ...String(process.env.CSP_IMG_SRC || '').split(' ').filter(Boolean)],
      "frame-ancestors": ["'none'"],
      "media-src": ["'self'"],
      "object-src": ["'none'"],
      "upgrade-insecure-requests": [],
      "report-uri": ["/csp-report"]
    },
    reportOnly: true
  } : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: true,
  frameguard: { action: 'deny' },
  hsts: isProd ? { maxAge: 15552000, includeSubDomains: true, preload: false } : false // ~180 dias
}));

app.use(hpp());
app.use(compression());


const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:4200'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  maxAge: 600,
}));


app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({ limit: '100kb' }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));



/* Routes */
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});


app.post(
  '/api/order',
  [
    body('platform').isIn(['instagram', 'tiktok', 'facebook', 'youtube']),
    body('service').isIn(['likes', 'views', 'comments']),
    body('link').isURL({ protocols: ['http', 'https'], require_protocol: true }).trim(),
    body('quantity').isInt({ min: 50, max: 10000 }).toInt(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    return next();
  },
  async (req, res) => {
    // TODO: criar pedido, enfileirar job, chamar fornecedor, etc.
    // const { platform, service, link, quantity } = req.body;
    res.status(201).json({ ok: true });
  }
);

app.post('/csp-report', express.json({ type: 'application/csp-report' }), (req, res) => {
  console.warn('CSP report:', JSON.stringify(req.body));
  res.sendStatus(204);
});

app.use('/api', verifyRoutes);
app.use('/api/jap', japRoutes);
app.use('/api/cart', cartRoutes);

/* 404 e handler de erros */
app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: 'Algo correu mal.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
server.headersTimeout = 65_000;
server.requestTimeout = 10_000;

server.listen(PORT, () =>
  console.log(`API running on :${PORT} (env: ${process.env.NODE_ENV || 'dev'})`)
);