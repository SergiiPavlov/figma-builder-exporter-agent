const path = require('path');
const express = require('express');
const cors = require('cors');

try {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch {}

const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;

const API_KEYS = (process.env.API_KEYS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const FREE_ENDPOINTS = [
  { method: 'GET', matcher: (pathname) => pathname === '/health' },
  { method: 'GET', matcher: (pathname) => /^\/shared\/[^/]+$/.test(pathname) },
  { method: 'POST', matcher: (pathname) => pathname === '/validate/taskSpec' },
  { method: 'POST', matcher: (pathname) => pathname === '/validate/exportSpec' },
];

function extractApiKey(req) {
  if (!req || typeof req.get !== 'function') {
    return null;
  }
  const headerKey = req.get('x-api-key');
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  const authHeader = req.get('authorization');
  if (typeof authHeader === 'string' && authHeader.trim()) {
    const match = authHeader.trim().match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function isFreeEndpoint(req) {
  if (!req) return false;
  const method = typeof req.method === 'string' ? req.method.toUpperCase() : 'GET';
  const rawPathname =
    typeof req.path === 'string' && req.path ? req.path : req.originalUrl || '/';
  const pathname = typeof rawPathname === 'string' ? rawPathname.split('?')[0] : '/';
  return FREE_ENDPOINTS.some((entry) => {
    if (entry.method !== method) {
      return false;
    }
    try {
      return entry.matcher(pathname);
    } catch {
      return false;
    }
  });
}

function requireKey(req, res, next) {
  if (!API_KEYS.length) {
    return next();
  }
  if (req.method === 'OPTIONS') {
    return next();
  }
  if (isFreeEndpoint(req)) {
    return next();
  }

  const provided = extractApiKey(req);
  if (provided && API_KEYS.includes(provided)) {
    return next();
  }

  res.status(401).json({ error: 'Unauthorized' });
}

const corsConfig = {
  origin: (_origin, callback) => callback(null, true),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  credentials: false,
};

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors(corsConfig));
app.options('*', cors(corsConfig));
app.use(requireKey);

const relayApp = createApp({ apiKeys: '', apiKeysRollover: '' });
app.use(relayApp);

app.listen(PORT, () => {
  console.log(`Relay listening on http://localhost:${PORT}`);
});
