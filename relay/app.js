const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Yazl = require('yazl');

const { diffExportSpecs } = require('./jsonDiff');

const AjvModule = require('ajv/dist/2020');
const Ajv = typeof AjvModule === 'function' ? AjvModule : AjvModule.default;

const SAFE_TASK_ID_RE = /^[A-Za-z0-9._-]+$/;
const MAX_TASK_ID_LENGTH = 200;
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const KEEPALIVE_INTERVAL_MS = 30 * 1000;
const CLEANUP_MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_ARTIFACTS = 200;
const DEFAULT_TTL_DAYS = 30;
const MAX_BULK_ARTIFACT_IDS = 50;
const BULK_ZIP_MAX_SIZE_BYTES = 100 * 1024 * 1024;
const DEFAULT_COMPARE_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_PREVIEW_MAX_BYTES = 2_000_000;
const MAX_PULL_LIMIT = 25;
const DEFAULT_JSON_BODY_LIMIT = '1mb';
const PREVIEW_CONTENT_TYPE = 'image/png';

const DEFAULT_WEBHOOK_RETRIES = 3;
const DEFAULT_WEBHOOK_TIMEOUT_MS = 5000;
const WEBHOOK_BACKOFF_BASE_MS = 500;

const DEFAULT_NOTIFICATION_BASE_URL = 'http://localhost:3000';

const SHARE_STORE_FILENAME = 'shares.json';
const DEFAULT_PUBLIC_TOKEN_TTL_MIN = 60;
const MIN_PUBLIC_TOKEN_TTL_MIN = 1;
const MAX_PUBLIC_TOKEN_TTL_MIN = 1440;
const SHARE_CLEANUP_INTERVAL_MS = 60 * 1000;
const EXPIRED_TOKEN_RETENTION_MS = 60 * 60 * 1000;

const DEFAULT_API_FREE_ENDPOINTS = [
  'GET /health',
  'GET /shared/:token',
  'POST /validate/taskSpec',
  'POST /validate/exportSpec',
];
const DEFAULT_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 100;
const WATCH_PATH_REGEX = /^\/tasks\/[^/]+\/watch$/;

const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const TASK_SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'taskSpec.schema.json');
const EXPORT_SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'exportSpec.schema.json');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeSensitiveQueryParams(html) {
  if (typeof html !== 'string') {
    return '';
  }

  let sanitized = html.replace(
    /([?&])(apiKey|x-api-key)=[^&"'\s>]*/gi,
    (match, separator) => (separator === '?' ? '?' : ''),
  );

  sanitized = sanitized
    .replace(/\?&/g, '?')
    .replace(/\?{2,}/g, '?')
    .replace(/&&+/g, '&')
    .replace(/\?($|#)/g, '$1');

  return sanitized;
}

function formatDiffValueForHtml(value, maxLength = 120) {
  let text;
  if (value === undefined) {
    text = 'undefined';
  } else if (value === null) {
    text = 'null';
  } else if (typeof value === 'string') {
    try {
      text = JSON.stringify(value);
    } catch {
      text = value;
    }
  } else if (typeof value === 'number') {
    text = Number.isFinite(value) ? String(value) : JSON.stringify(value);
  } else if (typeof value === 'boolean') {
    text = value ? 'true' : 'false';
  } else if (typeof value === 'bigint') {
    text = `${value.toString()}n`;
  } else {
    try {
      text = JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  if (text.length > maxLength) {
    text = `${text.slice(0, Math.max(0, maxLength - 1))}…`;
  }
  return escapeHtml(text);
}

function parseTrustProxy(value) {
  if (value == null) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    const entries = value
      .flatMap((entry) => {
        if (entry == null) {
          return [];
        }
        if (typeof entry === 'boolean') {
          return [entry];
        }
        if (typeof entry === 'number' && Number.isFinite(entry) && entry >= 0) {
          return [entry];
        }
        const strEntry = String(entry).trim();
        if (!strEntry) {
          return [];
        }
        return strEntry
          .split(',')
          .map((segment) => segment.trim())
          .filter(Boolean);
      })
      .map((entry) => {
        if (typeof entry === 'number') {
          return entry;
        }
        if (typeof entry === 'boolean') {
          return entry;
        }
        return /^\d+$/.test(entry) ? Number(entry) : entry;
      });
    if (entries.length === 0) {
      return false;
    }
    return entries.length === 1 ? entries[0] : entries;
  }
  const str = String(value).trim();
  if (!str) {
    return false;
  }
  const lower = str.toLowerCase();
  if (lower === 'false' || lower === 'no' || lower === 'off') {
    return false;
  }
  if (/^\d+$/.test(str)) {
    const num = Number(str);
    if (num >= 0) {
      return num;
    }
  }
  if (lower === 'true' || lower === 'yes' || lower === 'on') {
    return true;
  }
  if (lower === 'loopback' || lower === 'uniquelocal') {
    return lower;
  }
  const segments = str
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
  if (segments.length === 0) {
    return false;
  }
  return segments.length === 1 ? segments[0] : segments;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseWebhookEvents(value) {
  const defaultEvents = new Set(['done', 'error']);
  if (value == null) {
    return defaultEvents;
  }
  const raw = typeof value === 'string' ? value : String(value);
  if (!raw.trim()) {
    return defaultEvents;
  }
  const normalized = raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (normalized.length === 0) {
    return defaultEvents;
  }
  const allowed = new Set();
  for (const item of normalized) {
    if (item === 'done' || item === 'error') {
      allowed.add(item);
    }
  }
  return allowed.size > 0 ? allowed : defaultEvents;
}

function parsePositiveInteger(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    return fallback;
  }
  return Math.floor(num);
}

function parseByteLimit(value, fallback) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      return fallback;
    }
    return Math.floor(value);
  }
  const str = String(value).trim();
  if (!str) {
    return fallback;
  }
  const normalized = str.replace(/_/g, '');
  const num = Number(normalized);
  if (!Number.isFinite(num) || num < 0) {
    return fallback;
  }
  return Math.floor(num);
}

function resolveJsonBodyLimit(value, fallback = DEFAULT_JSON_BODY_LIMIT) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) {
      return fallback;
    }
    return Math.floor(value);
  }
  const str = String(value).trim();
  return str ? str : fallback;
}

function maskApiKey(key) {
  if (typeof key !== 'string') {
    return '';
  }
  const trimmed = key.trim();
  if (!trimmed) {
    return '';
  }
  if (trimmed.length <= 4) {
    return `****${trimmed}`;
  }
  return `****${trimmed.slice(-4)}`;
}

function shouldIncludeErrorDetails() {
  return process.env.NODE_ENV !== 'production';
}

function resolveErrorMessage(statusCode, message) {
  if (typeof message === 'string' && message.trim()) {
    return message.trim();
  }
  const normalizedStatus = Number.isInteger(statusCode) ? statusCode : 500;
  return http.STATUS_CODES[normalizedStatus] || 'Error';
}

function createErrorPayload(statusCode, message, details) {
  const normalizedStatus = Number.isInteger(statusCode) ? statusCode : 500;
  const payload = {
    error: {
      code: normalizedStatus,
      message: resolveErrorMessage(normalizedStatus, message),
    },
  };
  if (details != null && shouldIncludeErrorDetails()) {
    payload.error.details = details;
  }
  return payload;
}

function buildHttpError(statusCode, message, details) {
  const normalizedStatus = Number.isInteger(statusCode) ? statusCode : 500;
  return {
    status: normalizedStatus,
    body: createErrorPayload(normalizedStatus, message, details),
  };
}

function sendJsonError(res, statusCode, message, details) {
  return res.status(statusCode).json(createErrorPayload(statusCode, message, details));
}

function setCommonSecurityHeaders(res) {
  if (!res || typeof res.setHeader !== 'function') {
    return;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
}

function setHtmlSecurityHeaders(res) {
  setCommonSecurityHeaders(res);
  if (!res || typeof res.setHeader !== 'function') {
    return;
  }
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'",
  );
}

function clampTtlMinutes(value, fallback = DEFAULT_PUBLIC_TOKEN_TTL_MIN) {
  if (value == null) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  const normalized = Math.floor(num);
  if (!Number.isFinite(normalized)) {
    return fallback;
  }
  if (normalized < MIN_PUBLIC_TOKEN_TTL_MIN) {
    return MIN_PUBLIC_TOKEN_TTL_MIN;
  }
  if (normalized > MAX_PUBLIC_TOKEN_TTL_MIN) {
    return MAX_PUBLIC_TOKEN_TTL_MIN;
  }
  return normalized;
}

function sanitizeShareType(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'json') {
      return 'json';
    }
  }
  return 'zip';
}

function generateShareToken(byteLength = 24) {
  const size = Number.isFinite(byteLength) && byteLength >= 24 ? Math.floor(byteLength) : 24;
  return crypto
    .randomBytes(size)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function summarizeToken(token) {
  if (typeof token !== 'string') return '';
  if (token.length <= 6) return token;
  return `${token.slice(0, 6)}…`;
}

function splitCsv(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((entry) => splitCsv(entry));
  }
  if (value instanceof Set) {
    return splitCsv(Array.from(value));
  }
  const str = String(value);
  if (!str.trim()) return [];
  return str
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizePathname(pathname) {
  if (typeof pathname !== 'string') return '/';
  const queryIndex = pathname.indexOf('?');
  const base = queryIndex >= 0 ? pathname.slice(0, queryIndex) : pathname;
  const trimmed = base.replace(/\s+/g, '');
  if (!trimmed) return '/';
  const normalized = trimmed.endsWith('/') && trimmed !== '/' ? trimmed.slice(0, -1) : trimmed;
  return normalized || '/';
}

function normalizeTaskId(candidate) {
  if (typeof candidate !== 'string') {
    return null;
  }
  const trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > MAX_TASK_ID_LENGTH) {
    return null;
  }
  if (!SAFE_TASK_ID_RE.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function escapeRegexSegment(segment) {
  return segment.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function createPathMatcher(pattern) {
  if (typeof pattern !== 'string') {
    return () => false;
  }
  const trimmed = pattern.trim();
  if (!trimmed) {
    return () => false;
  }
  const ensured = trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\/+/, '')}`;
  const withoutTrailing = ensured.endsWith('/') && ensured !== '/' ? ensured.slice(0, -1) : ensured;
  const segments = withoutTrailing.split('/');
  const regexParts = segments.map((segment, index) => {
    if (index === 0 && segment === '') {
      return '';
    }
    if (segment.startsWith(':')) {
      return '[^/]+';
    }
    if (segment === '*') {
      return '.*';
    }
    return escapeRegexSegment(segment);
  });
  const regex = new RegExp(`^${regexParts.join('/')}$`);
  return (pathname) => regex.test(normalizePathname(pathname));
}

function parseFreeEndpointEntry(entry) {
  if (!entry) return null;
  if (typeof entry !== 'string') {
    return parseFreeEndpointEntry(String(entry));
  }
  const trimmed = entry.trim();
  if (!trimmed) return null;
  const spaceIndex = trimmed.indexOf(' ');
  let method = null;
  let pathPart = trimmed;
  if (spaceIndex > -1) {
    method = trimmed.slice(0, spaceIndex).trim().toUpperCase();
    pathPart = trimmed.slice(spaceIndex + 1);
  }
  const matcher = createPathMatcher(pathPart);
  return {
    method: method && method.length > 0 ? method : null,
    matcher,
  };
}

function parseFreeEndpoints(config, defaults = DEFAULT_API_FREE_ENDPOINTS) {
  const entries = splitCsv(config);
  const source = entries.length > 0 ? entries : defaults;
  const result = [];
  for (const entry of source) {
    const parsed = parseFreeEndpointEntry(entry);
    if (parsed) {
      result.push(parsed);
    }
  }
  return result;
}

function parseApiKeys(config) {
  const entries = splitCsv(config);
  const set = new Set();
  for (const entry of entries) {
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (trimmed) {
        set.add(trimmed);
      }
    }
  }
  return set;
}

function extractApiKeyFromRequest(req) {
  if (!req || typeof req.get !== 'function') return null;
  const authHeader = req.get('authorization');
  if (typeof authHeader === 'string' && authHeader.trim()) {
    const match = authHeader.trim().match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  const headerKey = req.get('x-api-key');
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  if (req.query && typeof req.query.apiKey === 'string' && req.query.apiKey.trim()) {
    return req.query.apiKey.trim();
  }
  return null;
}

function parseCorsOrigins(config) {
  if (config == null) return [];
  if (Array.isArray(config)) {
    return config.flatMap((entry) => parseCorsOrigins(entry));
  }
  if (config instanceof Set) {
    return parseCorsOrigins(Array.from(config));
  }
  const str = String(config).trim();
  if (!str) return [];
  if (str === '*') return ['*'];
  return str
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function loadShareRecords(file, logger = console) {
  if (!fs.existsSync(file)) {
    return { active: [], expired: [] };
  }
  try {
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) {
      return { active: [], expired: [] };
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { active: [], expired: [] };
    }
    const now = Date.now();
    const active = [];
    const expired = [];
    for (const entry of parsed) {
      const normalized = {
        token: typeof entry.token === 'string' ? entry.token : '',
        taskId: typeof entry.taskId === 'string' ? entry.taskId : '',
        type: sanitizeShareType(entry.type),
        expiresAt: Number(entry.expiresAt) || 0,
      };
      if (!normalized.token || !normalized.taskId || !Number.isFinite(normalized.expiresAt)) {
        continue;
      }
      if (normalized.expiresAt > now) {
        active.push(normalized);
      } else if (now - normalized.expiresAt <= EXPIRED_TOKEN_RETENTION_MS) {
        expired.push(normalized);
      }
    }
    return { active, expired };
  } catch (err) {
    if (logger && typeof logger.error === 'function') {
      logger.error('[relay] Failed to load share tokens', err);
    }
    return { active: [], expired: [] };
  }
}

function persistShareRecords(file, records, logger = console) {
  try {
    const payload = JSON.stringify(records, null, 2);
    fs.writeFileSync(file, payload, 'utf8');
  } catch (err) {
    if (logger && typeof logger.error === 'function') {
      logger.error('[relay] Failed to persist share tokens', err);
    }
  }
}

function sendJson(urlString, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(urlString);
    } catch (err) {
      reject(err);
      return;
    }

    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;
    const payload = typeof body === 'string' ? body : JSON.stringify(body);
    const requestOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : isHttps ? 443 : 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload, 'utf8'),
      },
    };

    const req = transport.request(requestOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        const statusCode = res.statusCode || 0;
        const responseBody = Buffer.concat(chunks).toString('utf8');
        if (statusCode >= 200 && statusCode < 300) {
          resolve({ statusCode, body: responseBody });
        } else {
          const error = new Error(`Unexpected status ${statusCode}`);
          error.statusCode = statusCode;
          error.body = responseBody;
          reject(error);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
      req.setTimeout(timeoutMs, () => {
        req.destroy(new Error('Request timed out'));
      });
    }

    req.write(payload);
    req.end();
  });
}

function createNotificationDispatcher({
  webhookUrl,
  webhookEvents,
  webhookRetries,
  webhookTimeoutMs,
  slackWebhookUrl,
  defaultBaseUrl,
  logger = console,
  onDispatchStart,
  onDispatchEnd,
} = {}) {
  const normalizedWebhookUrl = typeof webhookUrl === 'string' ? webhookUrl.trim() : '';
  const normalizedSlackUrl = typeof slackWebhookUrl === 'string' ? slackWebhookUrl.trim() : '';
  const allowedEvents = webhookEvents instanceof Set && webhookEvents.size > 0 ? webhookEvents : parseWebhookEvents();
  const maxAttempts = parsePositiveInteger(webhookRetries, DEFAULT_WEBHOOK_RETRIES);
  const timeoutMs = parsePositiveInteger(webhookTimeoutMs, DEFAULT_WEBHOOK_TIMEOUT_MS);
  const baseUrlFallback =
    typeof defaultBaseUrl === 'string' && defaultBaseUrl.trim()
      ? defaultBaseUrl.trim()
      : DEFAULT_NOTIFICATION_BASE_URL;

  function shouldSend(eventKey) {
    return allowedEvents.has(eventKey);
  }

  async function dispatchHttp(targetUrl, payload, label) {
    const attempts = Math.max(1, maxAttempts);
    let attempt = 0;
    if (typeof onDispatchStart === 'function') {
      try {
        onDispatchStart(label);
      } catch {
        // ignore logger errors
      }
    }
    try {
      while (attempt < attempts) {
        if (attempt > 0) {
          const delay = WEBHOOK_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);
          await wait(delay);
        }
        try {
          await sendJson(targetUrl, payload, timeoutMs);
          return true;
        } catch (err) {
          const attemptNumber = attempt + 1;
          if (logger && typeof logger.error === 'function') {
            logger.error(`[relay] ${label} attempt ${attemptNumber} failed`, err);
          }
          if (attemptNumber >= attempts) {
            if (logger && typeof logger.error === 'function') {
              logger.error(`[relay] ${label} giving up after ${attemptNumber} attempts`, err);
            }
            return false;
          }
        }
        attempt += 1;
      }
      return false;
    } finally {
      if (typeof onDispatchEnd === 'function') {
        try {
          onDispatchEnd(label);
        } catch {
          // ignore errors from callbacks
        }
      }
    }
  }

  function buildArtifactLinks(taskId) {
    return {
      json: `/tasks/${taskId}/artifact`,
      zip: `/tasks/${taskId}/package.zip`,
    };
  }

  function computeBaseUrl(candidate) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
    return baseUrlFallback;
  }

  function sendSlack(eventKey, taskId, baseUrl, errorMessage) {
    if (!normalizedSlackUrl || !shouldSend(eventKey)) {
      return Promise.resolve(false);
    }
    const origin = computeBaseUrl(baseUrl);
    let text;
    if (eventKey === 'done') {
      text = `[task.done] ${taskId} ✅\nJSON: ${origin}/tasks/${taskId}/artifact\nZIP:  ${origin}/tasks/${taskId}/package.zip`;
    } else {
      text = `[task.error] ${taskId} ❌`;
      if (errorMessage) {
        text += `\nError: ${errorMessage}`;
      }
    }
    const payload = JSON.stringify({ text });
    return dispatchHttp(normalizedSlackUrl, payload, `slack webhook (${eventKey})`);
  }

  function sendWebhook(eventKey, payload) {
    if (!normalizedWebhookUrl || !shouldSend(eventKey)) {
      return Promise.resolve(false);
    }
    const label = `task webhook (${payload.event || eventKey})`;
    return dispatchHttp(normalizedWebhookUrl, JSON.stringify(payload), label);
  }

  function taskDone({ task, artifactSize, baseUrl } = {}) {
    if (!task || !shouldSend('done')) {
      return Promise.resolve(false);
    }
    const payload = {
      event: 'task.done',
      taskId: task.id,
      createdAt: task.createdAt ?? Date.now(),
      status: 'done',
      artifact: buildArtifactLinks(task.id),
      summary: {
        artifactSize: artifactSize ?? null,
      },
    };
    const operations = [];
    if (normalizedWebhookUrl) {
      operations.push(sendWebhook('done', payload));
    }
    if (normalizedSlackUrl) {
      operations.push(sendSlack('done', task.id, baseUrl, null));
    }
    if (operations.length === 0) {
      return Promise.resolve(false);
    }
    return Promise.all(operations).then(() => true);
  }

  function taskError({ task, errorMessage, artifactSize, baseUrl } = {}) {
    if (!task || !shouldSend('error')) {
      return Promise.resolve(false);
    }
    const payload = {
      event: 'task.error',
      taskId: task.id,
      createdAt: task.createdAt ?? Date.now(),
      status: 'error',
      artifact: buildArtifactLinks(task.id),
      summary: {
        artifactSize: artifactSize ?? null,
      },
    };
    if (errorMessage) {
      payload.errorMessage = errorMessage;
    }
    const operations = [];
    if (normalizedWebhookUrl) {
      operations.push(sendWebhook('error', payload));
    }
    if (normalizedSlackUrl) {
      operations.push(sendSlack('error', task.id, baseUrl, errorMessage));
    }
    if (operations.length === 0) {
      return Promise.resolve(false);
    }
    return Promise.all(operations).then(() => true);
  }

  return {
    taskDone,
    taskError,
    allowedEvents,
    hasWebhook: Boolean(normalizedWebhookUrl),
    hasSlack: Boolean(normalizedSlackUrl),
  };
}

function normalizeLogs(logs) {
  if (!Array.isArray(logs)) return [];
  return logs.map((entry) => {
    if (entry && typeof entry === 'object' && 'message' in entry) {
      return entry;
    }
    return { message: String(entry), ts: null };
  });
}

function toLogEntry(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return { message: trimmed, ts: new Date().toISOString() };
  }
  if (typeof raw === 'object') {
    const messageValue =
      typeof raw.message === 'string'
        ? raw.message
        : raw.message != null
        ? String(raw.message)
        : '';
    const trimmed = messageValue.trim();
    if (!trimmed) return null;
    const tsValue =
      typeof raw.ts === 'string' && raw.ts.trim() ? raw.ts : new Date().toISOString();
    return { message: trimmed, ts: tsValue };
  }
  const message = String(raw).trim();
  if (!message) return null;
  return { message, ts: new Date().toISOString() };
}

function formatLogLine(entry) {
  if (!entry) return '';
  const normalized =
    typeof entry.message === 'string'
      ? entry.message.replace(/\r?\n/g, ' ').trim()
      : String(entry.message ?? '').replace(/\r?\n/g, ' ').trim();
  if (entry.ts) {
    const trimmed = normalized || '';
    return `${entry.ts}${trimmed ? ' ' + trimmed : ''}`;
  }
  return normalized;
}

function resolveDataDir(dir) {
  const candidate = dir || process.env.DATA_DIR || DEFAULT_DATA_DIR;
  return path.resolve(candidate);
}

function ensureStorageStructure(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const tasksFile = path.join(dataDir, 'tasks.jsonl');
  if (!fs.existsSync(tasksFile)) {
    fs.writeFileSync(tasksFile, '', 'utf8');
  }
  const resultsDir = path.join(dataDir, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  const previewsDir = path.join(dataDir, 'previews');
  fs.mkdirSync(previewsDir, { recursive: true });
  const sharesFile = path.join(dataDir, SHARE_STORE_FILENAME);
  if (!fs.existsSync(sharesFile)) {
    fs.writeFileSync(sharesFile, '[]\n', 'utf8');
  }
  return { tasksFile, resultsDir, previewsDir, sharesFile };
}

function parseInteger(value) {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.floor(num);
}

function createApp(options = {}) {
  const dataDir = resolveDataDir(options.dataDir);
  const { tasksFile, resultsDir, previewsDir, sharesFile } = ensureStorageStructure(dataDir);
  const trustProxyConfig =
    options.trustProxy != null ? options.trustProxy : process.env.TRUST_PROXY;
  const trustProxySetting = parseTrustProxy(trustProxyConfig);
  const app = express();
  app.set('trust proxy', trustProxySetting);

  app.use((req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      setCommonSecurityHeaders(res);
      return originalJson(body);
    };

    const originalSend = res.send.bind(res);
    res.send = (body) => {
      const headerValue =
        (typeof res.getHeader === 'function' && res.getHeader('Content-Type')) ||
        (typeof res.get === 'function' && res.get('Content-Type'));
      if (typeof headerValue === 'string') {
        const lowered = headerValue.toLowerCase();
        if (lowered.includes('application/json')) {
          setCommonSecurityHeaders(res);
        } else if (lowered.includes('text/html')) {
          setHtmlSecurityHeaders(res);
        }
      }
      return originalSend(body);
    };

    const originalSendFile = res.sendFile.bind(res);
    res.sendFile = (filePath, options, callback) => {
      if (typeof filePath === 'string') {
        const lowerPath = filePath.toLowerCase();
        if (lowerPath.endsWith('.json')) {
          setCommonSecurityHeaders(res);
        } else if (lowerPath.endsWith('.html')) {
          setHtmlSecurityHeaders(res);
        }
      }
      return originalSendFile(filePath, options, callback);
    };

    next();
  });

  const jsonBodyLimit = resolveJsonBodyLimit(
    options.jsonBodyLimit != null ? options.jsonBodyLimit : process.env.JSON_BODY_LIMIT,
  );
  const previewMaxBytes = parseByteLimit(
    options.previewMaxBytes != null ? options.previewMaxBytes : process.env.PREVIEW_MAX_BYTES,
    DEFAULT_PREVIEW_MAX_BYTES,
  );
  const compareMaxBytes = parseByteLimit(
    options.compareMaxBytes != null ? options.compareMaxBytes : process.env.COMPARE_MAX_BYTES,
    DEFAULT_COMPARE_MAX_BYTES,
  );

  app.locals.limits = {
    jsonBodyLimit,
    previewMaxBytes,
    compareMaxBytes,
  };

  let activeWebhookRequests = 0;
  const webhookIdleWaiters = new Set();

  function resolveWebhookIdle() {
    app.emit('webhooks:idle');
    if (webhookIdleWaiters.size > 0) {
      for (const resolver of webhookIdleWaiters) {
        try {
          resolver();
        } catch {
          // ignore resolver errors
        }
      }
      webhookIdleWaiters.clear();
    }
  }

  function onWebhookDispatchStart() {
    activeWebhookRequests += 1;
  }

  function onWebhookDispatchEnd() {
    if (activeWebhookRequests > 0) {
      activeWebhookRequests -= 1;
    }
    if (activeWebhookRequests === 0) {
      resolveWebhookIdle();
    }
  }

  app.__webhooksIdle = () => {
    if (activeWebhookRequests === 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const resolver = () => resolve();
      webhookIdleWaiters.add(resolver);
    });
  };

  const activeApiKeys = parseApiKeys(
    options.apiKeys != null ? options.apiKeys : process.env.API_KEYS,
  );
  const rolloverApiKeys = parseApiKeys(
    options.apiKeysRollover != null
      ? options.apiKeysRollover
      : process.env.API_KEYS_ROLLOVER,
  );
  const apiKeys = new Set([...activeApiKeys, ...rolloverApiKeys]);
  const freeEndpoints = parseFreeEndpoints(
    options.apiFreeEndpoints != null ? options.apiFreeEndpoints : process.env.API_FREE_ENDPOINTS,
  );
  const requireApiKey = apiKeys.size > 0;

  const corsOrigins = parseCorsOrigins(
    options.corsOrigin != null ? options.corsOrigin : process.env.CORS_ORIGIN,
  );
  const allowAnyOrigin = corsOrigins.length === 0 || corsOrigins.includes('*');
  const corsOptions = {
    origin: allowAnyOrigin ? '*' : corsOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-API-Key'],
    maxAge: 86400,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use((req, res, next) => {
    if (!req.relayAuth) {
      req.relayAuth = {};
    }
    if (req.method === 'OPTIONS') {
      req.relayAuth.apiKey = null;
      return next();
    }

    const providedKey = extractApiKeyFromRequest(req);
    if (providedKey && apiKeys.has(providedKey)) {
      req.relayAuth.apiKey = providedKey;
      req.relayAuth.apiKeyMasked = maskApiKey(providedKey);
    } else {
      req.relayAuth.apiKey = null;
      req.relayAuth.apiKeyMasked = providedKey ? maskApiKey(providedKey) : null;
    }

    if (!requireApiKey) {
      return next();
    }

    const method = typeof req.method === 'string' ? req.method.toUpperCase() : 'GET';
    const pathname = normalizePathname(req.path || req.originalUrl || '/');
    const isFree = freeEndpoints.some((entry) => {
      if (entry.method && entry.method !== method) {
        return false;
      }
      return entry.matcher(pathname);
    });
    if (isFree) {
      return next();
    }

    if (req.relayAuth.apiKey) {
      return next();
    }

    sendJsonError(res, 401, 'Unauthorized');
  });

  const rawRateLimitWindow =
    options.rateLimitWindowMs != null
      ? options.rateLimitWindowMs
      : process.env.RATE_LIMIT_WINDOW_MS;
  const rawRateLimitMax =
    options.rateLimitMax != null ? options.rateLimitMax : process.env.RATE_LIMIT_MAX;
  const hasCustomRateLimit =
    rawRateLimitWindow != null || rawRateLimitMax != null || options.rateLimitWindowMs != null;
  const configuredWindowMs =
    Number(rawRateLimitWindow) === 0
      ? 0
      : parsePositiveInteger(rawRateLimitWindow, DEFAULT_RATE_LIMIT_WINDOW_MS);
  const configuredMax =
    Number(rawRateLimitMax) === 0
      ? 0
      : parsePositiveInteger(rawRateLimitMax, DEFAULT_RATE_LIMIT_MAX);
  const rateLimitWindowMs =
    configuredWindowMs === 0 ? 0 : configuredWindowMs || DEFAULT_RATE_LIMIT_WINDOW_MS;
  const rateLimitMax = configuredMax === 0 ? 0 : configuredMax || DEFAULT_RATE_LIMIT_MAX;
  const rateLimitEnabled =
    rateLimitWindowMs > 0 && rateLimitMax > 0 && (requireApiKey || hasCustomRateLimit);
  const rateLimitBuckets = new Map();

  app.use((req, res, next) => {
    if (!rateLimitEnabled) {
      return next();
    }
    if (req.method === 'OPTIONS') {
      return next();
    }
    const pathname = normalizePathname(req.path || req.originalUrl || '/');
    if (WATCH_PATH_REGEX.test(pathname)) {
      return next();
    }
    const behindProxy = Boolean(app.get('trust proxy'));
    const ipRaw = behindProxy ? req.ip : req.socket && req.socket.remoteAddress;
    const identity = req.relayAuth && req.relayAuth.apiKey
      ? `key:${req.relayAuth.apiKey}`
      : `ip:${ipRaw || 'unknown'}`;
    const keyHash = crypto.createHash('sha256').update(identity).digest('hex');
    const key = `sha256:${keyHash}`;
    const now = Date.now();
    if (rateLimitBuckets.size > 1000) {
      for (const [bucketKey, bucketValue] of rateLimitBuckets.entries()) {
        if (!bucketValue || now - bucketValue.windowStart >= rateLimitWindowMs) {
          rateLimitBuckets.delete(bucketKey);
        }
      }
    }
    const bucket = rateLimitBuckets.get(key);
    if (!bucket || now - bucket.windowStart >= rateLimitWindowMs) {
      rateLimitBuckets.set(key, { windowStart: now, count: 1 });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > rateLimitMax) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((bucket.windowStart + rateLimitWindowMs - now) / 1000),
      );
      res.set('Retry-After', String(retryAfterSeconds));
      return sendJsonError(res, 429, 'Too many requests');
    }
    return next();
  });

  app.use(express.json({ limit: jsonBodyLimit }));

  app.locals.dataDir = dataDir;

  const clientsByTask = new Map();

  const configuredMaxArtifacts = parseInteger(
    options.maxArtifacts != null ? options.maxArtifacts : process.env.MAX_ARTIFACTS,
  );
  const maxArtifacts =
    configuredMaxArtifacts != null && configuredMaxArtifacts >= 0
      ? configuredMaxArtifacts
      : DEFAULT_MAX_ARTIFACTS;

  const configuredTtlDays = parseInteger(
    options.ttlDays != null ? options.ttlDays : process.env.TTL_DAYS,
  );
  const ttlDays =
    configuredTtlDays != null && configuredTtlDays >= 0 ? configuredTtlDays : DEFAULT_TTL_DAYS;

  const configuredPublicBaseUrl =
    options.publicBaseUrl != null ? options.publicBaseUrl : process.env.PUBLIC_BASE_URL;
  const normalizedPublicBaseUrl =
    typeof configuredPublicBaseUrl === 'string' ? configuredPublicBaseUrl.trim() : '';
  const publicBaseUrl = normalizedPublicBaseUrl || null;

  const configuredDefaultShareTtl =
    options.publicTokenTtlMin != null ? options.publicTokenTtlMin : process.env.PUBLIC_TOKEN_TTL_MIN;
  const defaultShareTtlMin = clampTtlMinutes(
    configuredDefaultShareTtl != null ? configuredDefaultShareTtl : DEFAULT_PUBLIC_TOKEN_TTL_MIN,
    DEFAULT_PUBLIC_TOKEN_TTL_MIN,
  );

  const shareTokens = new Map();
  const expiredShareTokens = new Map();

  const loadedShares = loadShareRecords(sharesFile, console);
  for (const entry of loadedShares.active) {
    shareTokens.set(entry.token, entry);
  }
  for (const entry of loadedShares.expired) {
    expiredShareTokens.set(entry.token, entry);
  }

  function persistShareTokens() {
    persistShareRecords(sharesFile, Array.from(shareTokens.values()), console);
  }

  function pruneExpiredShares({ persist = false } = {}) {
    const now = Date.now();
    let removed = false;
    for (const [token, entry] of shareTokens.entries()) {
      if (!entry || entry.expiresAt <= now) {
        if (entry && entry.expiresAt <= now) {
          expiredShareTokens.set(token, entry);
        }
        shareTokens.delete(token);
        removed = true;
      }
    }
    for (const [token, entry] of expiredShareTokens.entries()) {
      if (!entry || now - entry.expiresAt > EXPIRED_TOKEN_RETENTION_MS) {
        expiredShareTokens.delete(token);
      }
    }
    if (removed && persist) {
      persistShareTokens();
    }
    return removed;
  }

  pruneExpiredShares({ persist: true });

  const shareCleanupTimer = setInterval(() => {
    const removed = pruneExpiredShares({ persist: true });
    if (removed && console && typeof console.debug === 'function') {
      console.debug(`[relay] Removed expired share tokens; active=${shareTokens.size}`);
    }
  }, SHARE_CLEANUP_INTERVAL_MS);
  if (typeof shareCleanupTimer.unref === 'function') {
    shareCleanupTimer.unref();
  }

  const cleanupState = {
    lastRunAt: 0,
    dirty: true,
    lastResult: null,
  };

  const defaultBaseUrl =
    typeof options.notificationBaseUrl === 'string' && options.notificationBaseUrl.trim()
      ? options.notificationBaseUrl.trim()
      : DEFAULT_NOTIFICATION_BASE_URL;

  const webhookEventsConfig =
    options.webhookEvents != null ? options.webhookEvents : process.env.WEBHOOK_EVENTS;
  const webhookEventsSet =
    webhookEventsConfig instanceof Set
      ? webhookEventsConfig
      : parseWebhookEvents(webhookEventsConfig);

  const notifications = createNotificationDispatcher({
    webhookUrl:
      options.webhookUrl != null ? options.webhookUrl : process.env.WEBHOOK_URL,
    webhookEvents: webhookEventsSet,
    webhookRetries:
      options.webhookRetries != null ? options.webhookRetries : process.env.WEBHOOK_RETRIES,
    webhookTimeoutMs:
      options.webhookTimeoutMs != null
        ? options.webhookTimeoutMs
        : process.env.WEBHOOK_TIMEOUT_MS,
    slackWebhookUrl:
      options.slackWebhookUrl != null
        ? options.slackWebhookUrl
        : process.env.SLACK_WEBHOOK_URL,
    defaultBaseUrl,
    onDispatchStart: onWebhookDispatchStart,
    onDispatchEnd: onWebhookDispatchEnd,
  });

  function deriveBaseUrl(req) {
    if (!req || typeof req.get !== 'function') {
      return defaultBaseUrl;
    }
    const forwardedHost = req.get('x-forwarded-host');
    const host = forwardedHost && forwardedHost.trim() ? forwardedHost.trim() : req.get('host');
    if (!host) {
      return defaultBaseUrl;
    }
    const protoHeader = req.get('x-forwarded-proto');
    const proto = protoHeader
      ? protoHeader.split(',')[0].trim()
      : req.protocol || (req.secure ? 'https' : 'http') || 'http';
    return `${proto}://${host}`;
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  const taskSchema = JSON.parse(fs.readFileSync(TASK_SCHEMA_PATH, 'utf8'));
  const exportSchema = JSON.parse(fs.readFileSync(EXPORT_SCHEMA_PATH, 'utf8'));
  const validateTask = ajv.compile(taskSchema);
  const validateExport = ajv.compile(exportSchema);

  function registerClient(taskId, req, res) {
    let set = clientsByTask.get(taskId);
    if (!set) {
      set = new Set();
      clientsByTask.set(taskId, set);
    }
    const client = {
      res,
      taskId,
      closed: false,
      inactivityTimer: null,
      keepAliveTimer: null,
      cleanup: () => {},
    };

    const cleanup = () => {
      if (client.closed) return;
      client.closed = true;
      clearTimeout(client.inactivityTimer);
      clearInterval(client.keepAliveTimer);
      set.delete(client);
      if (set.size === 0) {
        clientsByTask.delete(taskId);
      }
      try {
        res.end();
      } catch {}
    };

    client.resetInactivity = () => {
      clearTimeout(client.inactivityTimer);
      client.inactivityTimer = setTimeout(() => {
        cleanup();
      }, INACTIVITY_TIMEOUT_MS);
    };

    client.send = (event, payload) => {
      if (client.closed) return;
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        client.resetInactivity();
      } catch {
        cleanup();
      }
    };

    client.keepAliveTimer = setInterval(() => {
      if (client.closed) return;
      try {
        res.write(`: keep-alive ${Date.now()}\n\n`);
      } catch {
        cleanup();
      }
    }, KEEPALIVE_INTERVAL_MS);

    client.resetInactivity();
    client.cleanup = cleanup;
    req.on('close', cleanup);
    req.on('error', cleanup);
    set.add(client);
    return client;
  }

  function broadcastTaskEvent(taskId, event, payload, { closeAfterMs } = {}) {
    const set = clientsByTask.get(taskId);
    if (!set || set.size === 0) return;
    for (const client of Array.from(set)) {
      client.send(event, payload);
      if (typeof closeAfterMs === 'number' && closeAfterMs >= 0) {
        setTimeout(() => {
          client.cleanup();
        }, closeAfterMs);
      }
    }
  }

  function appendJSONL(file, obj) {
    fs.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8');
  }

  function writeOne(task) {
    appendJSONL(tasksFile, task);
  }

  function readAllRaw() {
    if (!fs.existsSync(tasksFile)) return new Map();
    const txt = fs.readFileSync(tasksFile, 'utf8');
    const lines = txt ? txt.split('\n').filter(Boolean) : [];
    const byId = new Map();
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        byId.set(obj.id, obj);
      } catch {}
    }
    return byId;
  }

  function readAll(includeDeleted = false) {
    const byId = readAllRaw();
    if (includeDeleted) return byId;
    for (const [id, task] of byId.entries()) {
      if (!task || task.deleted) {
        byId.delete(id);
      }
    }
    return byId;
  }

  function readOne(id) {
    const byId = readAll();
    return byId.get(id);
  }

  function closeTaskClients(taskId) {
    const set = clientsByTask.get(taskId);
    if (!set || set.size === 0) return;
    for (const client of Array.from(set)) {
      try {
        client.cleanup();
      } catch {}
    }
  }

  function getArtifactPaths(taskId) {
    if (typeof taskId !== 'string' || !SAFE_TASK_ID_RE.test(taskId)) {
      return null;
    }
    const filename = `${taskId}.json`;
    const base = path.resolve(resultsDir);
    const absolute = path.resolve(base, filename);
    const relativeToBase = path.relative(base, absolute);
    if (relativeToBase.startsWith('..') || path.isAbsolute(relativeToBase)) {
      return null;
    }
    return {
      relative: path.posix.join('data', 'results', filename),
      absolute,
    };
  }

  function getPreviewPaths(taskId) {
    if (typeof taskId !== 'string' || !SAFE_TASK_ID_RE.test(taskId)) {
      return null;
    }
    const filename = `${taskId}.png`;
    const base = path.resolve(previewsDir);
    const absolute = path.resolve(base, filename);
    const relativeToBase = path.relative(base, absolute);
    if (relativeToBase.startsWith('..') || path.isAbsolute(relativeToBase)) {
      return null;
    }
    return {
      relative: path.posix.join('data', 'previews', filename),
      absolute,
    };
  }

  function buildPreviewUrl(taskId) {
    if (typeof taskId !== 'string' || !SAFE_TASK_ID_RE.test(taskId)) {
      return null;
    }
    return `/tasks/${encodeURIComponent(taskId)}/preview.png`;
  }

  function getPreviewInfo(taskId, task) {
    const previewPaths = getPreviewPaths(taskId);
    const hasPreview = !!(previewPaths && fs.existsSync(previewPaths.absolute));
    const previewUrl = hasPreview ? buildPreviewUrl(taskId) : null;
    const previewUpdatedAt =
      hasPreview && task && Number.isFinite(task.previewUpdatedAt)
        ? Math.floor(task.previewUpdatedAt)
        : null;
    return { hasPreview, previewUrl, previewUpdatedAt };
  }

  function ensureJsonArtifact(taskId) {
    const artifactPaths = getArtifactPaths(taskId);
    if (!artifactPaths) {
      return { error: buildHttpError(400, 'Invalid task id') };
    }
    if (!fs.existsSync(artifactPaths.absolute)) {
      return { error: buildHttpError(404, 'No artifact') };
    }
    return { artifactPaths };
  }

  function ensureZipArtifact(taskId) {
    const ensured = ensureJsonArtifact(taskId);
    if (ensured.error) {
      return ensured;
    }
    const task = readOne(taskId);
    if (!task) {
      return { error: buildHttpError(404, 'not found') };
    }
    return { ...ensured, task };
  }

  function readExportSpecForCompare(taskId) {
    const ensured = ensureJsonArtifact(taskId);
    if (ensured.error) {
      return ensured;
    }
    const { artifactPaths } = ensured;
    let stat = null;
    try {
      stat = fs.statSync(artifactPaths.absolute);
    } catch (err) {
      console.error('Failed to stat artifact for compare', artifactPaths.absolute, err);
      return { error: buildHttpError(500, 'Failed to read artifact') };
    }
    if (compareMaxBytes > 0 && stat && stat.size > compareMaxBytes) {
      return { error: buildHttpError(413, 'Payload too large') };
    }
    let text;
    try {
      text = fs.readFileSync(artifactPaths.absolute, 'utf8');
    } catch (err) {
      console.error('Failed to read artifact for compare', artifactPaths.absolute, err);
      return { error: buildHttpError(500, 'Failed to read artifact') };
    }
    let exportSpec;
    try {
      exportSpec = JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse artifact JSON for compare', artifactPaths.absolute, err);
      return { error: buildHttpError(500, 'Failed to parse artifact') };
    }
    return { exportSpec, size: stat ? stat.size : null };
  }

  function computeCompareContext({ leftId, rightId, mode }) {
    const normalizedLeft = typeof leftId === 'string' ? leftId.trim() : '';
    const normalizedRight = typeof rightId === 'string' ? rightId.trim() : '';
    const normalizedMode = mode === 'full' ? 'full' : 'summary';

    if (!normalizedLeft || !normalizedRight) {
      return { error: buildHttpError(400, 'leftId and rightId are required') };
    }

    const left = readExportSpecForCompare(normalizedLeft);
    if (left.error) {
      return { error: left.error };
    }

    const right = readExportSpecForCompare(normalizedRight);
    if (right.error) {
      return { error: right.error };
    }

    const includeUnchanged = normalizedMode === 'full';
    const diffResult = diffExportSpecs(left.exportSpec, right.exportSpec, {
      includeUnchanged,
    });

    const diffEntries = Array.isArray(diffResult.diff) ? diffResult.diff : [];
    const filteredEntries = includeUnchanged
      ? diffEntries
      : diffEntries.filter((entry) => entry && entry.type !== 'unchanged');

    const summary =
      diffResult && diffResult.summary && typeof diffResult.summary === 'object'
        ? diffResult.summary
        : { added: 0, removed: 0, changed: 0, unchanged: 0 };

    const normalizedSummary = {
      added: Number(summary.added) || 0,
      removed: Number(summary.removed) || 0,
      changed: Number(summary.changed) || 0,
      unchanged: Number(summary.unchanged) || 0,
    };

    const responseDiff = includeUnchanged ? diffEntries : filteredEntries;

    return {
      leftId: normalizedLeft,
      rightId: normalizedRight,
      mode: normalizedMode,
      includeUnchanged,
      diffEntries,
      filteredEntries,
      summary,
      normalizedSummary,
      responseDiff,
    };
  }

  function buildCompareHtmlDocument(context, { generatedAt } = {}) {
    const {
      leftId,
      rightId,
      mode,
      filteredEntries,
      normalizedSummary,
    } = context;

    const summaryItems = [
      { key: 'added', label: 'Added' },
      { key: 'removed', label: 'Removed' },
      { key: 'changed', label: 'Changed' },
      { key: 'unchanged', label: 'Unchanged' },
    ];

    const summaryHtml = summaryItems
      .map((item) => {
        const value = Number(normalizedSummary[item.key]) || 0;
        return `
          <div class="summary-card">
            <span class="summary-label">${escapeHtml(item.label)}</span>
            <span class="summary-value">${escapeHtml(String(value))}</span>
          </div>
        `;
      })
      .join('');

    const changeItemsHtml = filteredEntries
      .map((entry, index) => {
        if (!entry || typeof entry !== 'object') {
          return '';
        }
        const anchorId = `change-${index + 1}`;
        const rawType = typeof entry.type === 'string' ? entry.type.toLowerCase() : '';
        const normalizedType =
          rawType === 'added' || rawType === 'removed' || rawType === 'unchanged'
            ? rawType
            : 'changed';
        const badgeLabel = normalizedType.toUpperCase();
        const pathText = entry.path ? String(entry.path) : '(root)';
        const leftValue = formatDiffValueForHtml(
          Object.prototype.hasOwnProperty.call(entry, 'left') ? entry.left : undefined,
        );
        const rightValue = formatDiffValueForHtml(
          Object.prototype.hasOwnProperty.call(entry, 'right') ? entry.right : undefined,
        );
        return `
          <li id="${anchorId}" class="change-item change-item--${normalizedType}">
            <div class="change-item__header">
              <span class="change-item__badge">${escapeHtml(badgeLabel)}</span>
              <a class="change-item__path" href="#${anchorId}">${escapeHtml(pathText)}</a>
            </div>
            <div class="change-item__values">
              <div class="change-item__value">
                <span class="change-item__label">Left</span>
                <code>${leftValue}</code>
              </div>
              <div class="change-item__value">
                <span class="change-item__label">Right</span>
                <code>${rightValue}</code>
              </div>
            </div>
          </li>
        `;
      })
      .filter(Boolean)
      .join('');

    const changesHtml = changeItemsHtml
      ? `<ol class="changes-list">${changeItemsHtml}</ol>`
      : '<p class="no-changes">No changes detected.</p>';

    const effectiveGeneratedAt =
      typeof generatedAt === 'string' && generatedAt ? generatedAt : new Date().toISOString();
    const compareAction = '/artifacts/compare';

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(leftId)} vs ${escapeHtml(rightId)} — diff report</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background-color: #f5f6f8;
        color: #111827;
        line-height: 1.5;
      }
      header,
      footer {
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        padding: 24px 32px;
      }
      footer {
        border-top: 1px solid #e5e7eb;
        border-bottom: none;
      }
      main {
        max-width: 960px;
        margin: 0 auto;
        padding: 24px 32px 48px;
        display: grid;
        gap: 24px;
      }
      h1 {
        margin: 0;
        font-size: 1.75rem;
      }
      h2 {
        margin-top: 0;
        font-size: 1.25rem;
      }
      .header-meta {
        margin-top: 8px;
        color: #4b5563;
        font-size: 0.95rem;
      }
      section {
        background: #ffffff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 16px;
      }
      .summary-card {
        background: #f3f4f6;
        border-radius: 10px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .summary-label {
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        color: #6b7280;
      }
      .summary-value {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
      }
      .changes-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 16px;
      }
      .change-item {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 16px;
        background: #ffffff;
      }
      .change-item__header {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
      }
      .change-item__badge {
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        padding: 4px 8px;
        border-radius: 999px;
        background: #1d4ed8;
        color: #ffffff;
      }
      .change-item--added .change-item__badge {
        background: #047857;
      }
      .change-item--removed .change-item__badge {
        background: #dc2626;
      }
      .change-item--unchanged .change-item__badge {
        background: #6b7280;
      }
      .change-item__path {
        font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
          monospace;
        color: #1f2937;
        text-decoration: none;
        word-break: break-all;
      }
      .change-item__path:hover,
      .change-item__path:focus {
        text-decoration: underline;
      }
      .change-item__values {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }
      .change-item__value {
        display: flex;
        flex-direction: column;
        gap: 8px;
        background: #f9fafb;
        border-radius: 8px;
        padding: 12px;
      }
      .change-item__label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #6b7280;
        letter-spacing: 0.08em;
      }
      code {
        display: block;
        font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
          monospace;
        font-size: 0.85rem;
        white-space: pre-wrap;
        word-break: break-word;
        color: #111827;
      }
      .no-changes {
        margin: 0;
        color: #4b5563;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
      }
      .actions form {
        margin: 0;
      }
      .api-key-input {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin: 12px 0;
        font-size: 0.9rem;
      }
      .api-key-input input {
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #d1d5db;
        font-size: 0.95rem;
        background: #f9fafb;
        color: inherit;
      }
      .api-key-input input:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
      }
      .api-key-input small {
        color: #6b7280;
        font-size: 0.75rem;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 10px 18px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        background: #1d4ed8;
        color: #ffffff;
        text-decoration: none;
        transition: background 0.2s ease;
      }
      .button:focus,
      .button:hover {
        background: #1e40af;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background-color: #0f172a;
          color: #e2e8f0;
        }
        header,
        footer,
        section {
          background: #111c34;
          border-color: #1e293b;
          color: inherit;
        }
        .summary-card {
          background: #1f2a44;
        }
        .change-item {
          background: #16213b;
          border-color: #1e293b;
        }
        .change-item__value {
          background: #1e293b;
        }
        .change-item__path {
          color: #cbd5f5;
        }
        .no-changes {
          color: #94a3b8;
        }
        .button {
          background: #2563eb;
        }
        .button:focus,
        .button:hover {
          background: #1d4ed8;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>${escapeHtml(leftId)} vs ${escapeHtml(rightId)}</h1>
      <div class="header-meta">
        Generated at ${escapeHtml(effectiveGeneratedAt)} · Mode: ${escapeHtml(mode)}
      </div>
    </header>
    <main>
      <section id="summary">
        <h2>Summary</h2>
        <div class="summary-grid">
          ${summaryHtml}
        </div>
      </section>
      <section id="changes">
        <h2>Changes (${filteredEntries.length})</h2>
        ${changesHtml}
      </section>
    </main>
    <footer>
      <div class="actions">
        <form method="post" action="${escapeHtml(compareAction)}" target="_blank">
          <input type="hidden" name="leftId" value="${escapeHtml(leftId)}" />
          <input type="hidden" name="rightId" value="${escapeHtml(rightId)}" />
          <input type="hidden" name="mode" value="${escapeHtml(mode)}" />
          <label class="api-key-input">
            <span>API key (optional for rerun)</span>
            <input
              type="password"
              name="apiKey"
              autocomplete="off"
              placeholder="Enter API key before submitting"
            />
            <small>Without an API key the server will reject the request (HTTP 401).</small>
          </label>
          <button type="submit" class="button">Download JSON diff</button>
        </form>
      </div>
    </footer>
  </body>
</html>`;
  }

  function sanitizeFilenameSegment(value) {
    const normalized = String(value ?? '')
      .replace(/[^A-Za-z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 64);
    return normalized || 'artifact';
  }

  function buildCompareMetaText(context, generatedAt) {
    const lines = [
      `Generated: ${generatedAt}`,
      `Mode: ${context.mode}`,
      `Left: ${context.leftId}`,
      `Right: ${context.rightId}`,
    ];
    return `${lines.join('\n')}\n`;
  }

  function sendJsonArtifact(res, taskId) {
    const ensured = ensureJsonArtifact(taskId);
    if (ensured.error) {
      return res.status(ensured.error.status).json(ensured.error.body);
    }
    const { artifactPaths } = ensured;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${taskId}.json"`);
    return res.sendFile(artifactPaths.absolute);
  }

  function sendZipArtifact(res, taskId) {
    const ensured = ensureZipArtifact(taskId);
    if (ensured.error) {
      return res.status(ensured.error.status).json(ensured.error.body);
    }
    const { artifactPaths, task } = ensured;
    const { absolute: artifactFile, relative: artifactRelativePath } = artifactPaths;
    const logs = normalizeLogs(task.logs);
    const logsText = logs.map((entry) => formatLogLine(entry)).join('\n');
    let artifactSize = task.artifactSize ?? null;
    try {
      const stat = fs.statSync(artifactFile);
      artifactSize = stat.size;
    } catch (err) {
      console.error('Failed to stat artifact for zip', artifactFile, err);
    }
    const taskInfo = {
      id: task.id,
      createdAt: task.createdAt ?? null,
      status: task.status ?? null,
    };
    const previewPaths = getPreviewPaths(taskId);
    let previewBuffer = null;
    let previewRelativePath = null;
    let previewSize = null;
    if (previewPaths) {
      try {
        if (fs.existsSync(previewPaths.absolute)) {
          const file = fs.readFileSync(previewPaths.absolute);
          if (file && file.length > 0) {
            previewBuffer = file;
            previewRelativePath = previewPaths.relative;
            previewSize = file.length;
          }
        }
      } catch (err) {
        console.error('Failed to read preview for zip', previewPaths.absolute, err);
        previewBuffer = null;
        previewRelativePath = null;
        previewSize = null;
      }
    }

    const metaInfo = {
      id: task.id,
      createdAt: task.createdAt ?? null,
      artifactPath: task.artifactPath ?? artifactRelativePath,
      artifactSize,
    };
    if (previewRelativePath) {
      metaInfo.previewPath = previewRelativePath;
    }
    if (previewSize != null) {
      metaInfo.previewSize = previewSize;
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${taskId}.zip"`);

    const zip = new Yazl.ZipFile();
    let responseClosed = false;
    let exportSpecStream = null;
    let zipStarted = false;

    const abortWithError = (err) => {
      if (responseClosed) return;
      responseClosed = true;
      const reason = err || new Error('Artifact read error');
      console.error('Failed to stream artifact zip', reason);
      try {
        if (exportSpecStream) {
          exportSpecStream.destroy();
        }
      } catch {}
      try {
        zip.outputStream.unpipe(res);
      } catch {}
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.removeHeader('Content-Disposition');
        sendJsonError(res, 500, 'Artifact read error');
      } else {
        res.destroy(reason);
      }
    };

    zip.outputStream.on('error', abortWithError);
    res.on('close', () => {
      responseClosed = true;
    });

    const startZipStream = () => {
      if (zipStarted || responseClosed) return;
      zipStarted = true;
      zip.addReadStream(exportSpecStream, 'exportSpec.json');
      zip.addBuffer(Buffer.from(logsText, 'utf8'), 'logs.txt');
      zip.addBuffer(Buffer.from(JSON.stringify(taskInfo, null, 2), 'utf8'), 'task.json');
      zip.addBuffer(Buffer.from(JSON.stringify(metaInfo, null, 2), 'utf8'), 'meta.json');
      if (previewBuffer) {
        zip.addBuffer(previewBuffer, 'preview.png');
      }
      zip.outputStream.pipe(res);
      zip.end();
    };

    exportSpecStream = fs.createReadStream(artifactFile);
    exportSpecStream.once('open', () => {
      startZipStream();
    });
    exportSpecStream.on('error', (err) => {
      console.error('Failed to read artifact for zip', artifactFile, err);
      abortWithError(err);
    });
  }

  function appendTaskLogs(task, newLogs) {
    const currentLogs = normalizeLogs(task.logs);
    const appended = [];
    if (Array.isArray(newLogs)) {
      for (const entry of newLogs) {
        const normalized = toLogEntry(entry);
        if (!normalized) continue;
        currentLogs.push(normalized);
        appended.push(normalized);
      }
    }
    return { logs: currentLogs, appended };
  }

  function persistExportSpec(taskId, exportSpec) {
    const artifactPaths = getArtifactPaths(taskId);
    if (!artifactPaths) {
      return { error: buildHttpError(400, 'Invalid task id') };
    }
    const { relative: artifactPath, absolute: artifactFile } = artifactPaths;
    try {
      const pretty = JSON.stringify(exportSpec, null, 2);
      fs.writeFileSync(artifactFile, pretty, 'utf8');
      cleanupState.dirty = true;
    } catch (err) {
      console.error('Failed to write artifact', err);
      return { error: buildHttpError(500, 'Failed to write artifact') };
    }
    let artifactSize = null;
    try {
      const stat = fs.statSync(artifactFile);
      artifactSize = stat.size;
    } catch (err) {
      console.error('Failed to stat artifact', err);
      return { error: buildHttpError(500, 'Failed to finalize artifact') };
    }
    return { artifactPath, artifactFile, artifactSize };
  }

  function finalizeTaskResult(task, exportSpec, { logs: logEntries } = {}) {
    const persistResult = persistExportSpec(task.id, exportSpec);
    if (persistResult.error) {
      return { error: persistResult.error };
    }
    const { artifactPath, artifactSize } = persistResult;
    const { logs, appended } = appendTaskLogs(task, logEntries);
    const updated = {
      ...task,
      status: 'done',
      result: exportSpec,
      finishedAt: Date.now(),
      error: null,
      artifactPath,
      artifactSize,
      logs,
    };
    return { updated, appended };
  }

  function finalizeTaskError(task, errorMessage, { logs: logEntries } = {}) {
    const normalizedMessage =
      typeof errorMessage === 'string' && errorMessage.trim() ? errorMessage.trim() : null;
    const { logs, appended } = appendTaskLogs(task, logEntries);
    const updated = {
      ...task,
      status: 'error',
      finishedAt: Date.now(),
      error: normalizedMessage,
      logs,
    };
    return { updated, appended };
  }

  function findTasksByStatuses(statuses, { limit = null, order = 'desc' } = {}) {
    const allowed = new Set(statuses);
    const byId = readAll();
    const arr = Array.from(byId.values()).filter((task) => allowed.has(task.status));
    if (arr.length === 0) {
      return [];
    }
    const normalizeTs = (value) => (Number.isFinite(value) ? value : 0);
    arr.sort((a, b) => {
      const aCreated = normalizeTs(a && a.createdAt);
      const bCreated = normalizeTs(b && b.createdAt);
      const idA = a && a.id != null ? String(a.id) : '';
      const idB = b && b.id != null ? String(b.id) : '';
      if (order === 'asc') {
        if (aCreated !== bCreated) {
          return aCreated - bCreated;
        }
        return idA.localeCompare(idB);
      }
      if (bCreated !== aCreated) {
        return bCreated - aCreated;
      }
      return idB.localeCompare(idA);
    });
    if (typeof limit === 'number' && limit >= 0) {
      return arr.slice(0, limit);
    }
    return arr;
  }

  function findLatestTaskByStatuses(statuses) {
    const tasks = findTasksByStatuses(statuses, { limit: 1, order: 'desc' });
    return tasks.length > 0 ? tasks[0] : null;
  }

  function transitionTaskToRunning(task, { pluginId } = {}) {
    if (!task) {
      return null;
    }
    const now = Date.now();
    const updated = {
      ...task,
      status: 'running',
      runnerPluginId: pluginId ?? task.runnerPluginId ?? null,
      startedAt: task.startedAt ?? now,
      finishedAt: null,
      error: null,
    };
    writeOne(updated);
    const statusPreviewInfo = getPreviewInfo(updated.id, updated);
    broadcastTaskEvent(updated.id, 'status', {
      status: 'running',
      logs: normalizeLogs(updated.logs),
      exportSpec: updated.result ?? null,
      artifactPath: updated.artifactPath ?? null,
      artifactSize: updated.artifactSize ?? null,
      ...statusPreviewInfo,
    });
    return updated;
  }

  function markTaskError(taskId, errorMessage, { logs: logEntries, baseUrl } = {}) {
    const current = readOne(taskId);
    if (!current) {
      return false;
    }
    const finalize = finalizeTaskError(current, errorMessage, { logs: logEntries });
    writeOne(finalize.updated);
    for (const entry of finalize.appended) {
      broadcastTaskEvent(taskId, 'log', entry);
    }
    const errorPreviewInfo = getPreviewInfo(taskId, finalize.updated);
    broadcastTaskEvent(
      taskId,
      'result',
      {
        status: 'error',
        exportSpec: finalize.updated.result ?? null,
        artifactPath: finalize.updated.artifactPath ?? null,
        artifactSize: finalize.updated.artifactSize ?? null,
        error: finalize.updated.error ?? null,
        ...errorPreviewInfo,
      },
      { closeAfterMs: 3000 },
    );
    notifications.taskError({
      task: finalize.updated,
      errorMessage: finalize.updated.error ?? null,
      artifactSize: finalize.updated.artifactSize ?? null,
      baseUrl: baseUrl ?? defaultBaseUrl,
    });
    return true;
  }

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.post('/validate/taskSpec', (req, res) => {
    const taskSpec = req.body && req.body.taskSpec;
    const valid = validateTask(taskSpec);
    if (valid) return res.json({ valid: true, errors: [] });
    res.json({
      valid: false,
      errors: (validateTask.errors || []).map((e) => ({
        instancePath: e.instancePath,
        message: e.message,
      })),
    });
  });

  app.post('/validate/exportSpec', (req, res) => {
    const exportSpec = req.body && req.body.exportSpec;
    const valid = validateExport(exportSpec);
    if (valid) return res.json({ valid: true, errors: [] });
    res.json({
      valid: false,
      errors: (validateExport.errors || []).map((e) => ({
        instancePath: e.instancePath,
        message: e.message,
      })),
    });
  });

  app.post('/tasks', (req, res) => {
    const body = req.body || {};
    const taskSpec = body.taskSpec;
    if (!taskSpec || typeof taskSpec !== 'object') {
      return sendJsonError(res, 400, 'taskSpec required');
    }

    const providedIdSource =
      body.taskId != null ? body.taskId : taskSpec && taskSpec.meta && taskSpec.meta.id;
    const normalizedId = providedIdSource != null ? normalizeTaskId(String(providedIdSource)) : null;
    if (providedIdSource != null && !normalizedId) {
      return sendJsonError(res, 400, 'Invalid task id');
    }

    const taskId = normalizedId || uuidv4();
    const existing = readOne(taskId);
    if (existing) {
      return res.json({
        taskId: existing.id,
        status: existing.status ?? null,
        createdAt: existing.createdAt ?? null,
      });
    }

    const now = Date.now();
    const rec = {
      id: taskId,
      status: 'pending',
      taskSpec,
      createdAt: now,
      logs: [],
      error: null,
      runnerPluginId: null,
      startedAt: null,
      finishedAt: null,
    };
    writeOne(rec);
    res.json({ taskId, status: rec.status, createdAt: now });
  });

  app.get('/tasks/pull', (req, res) => {
    const pluginIdRaw = typeof req.query.pluginId === 'string' ? req.query.pluginId.trim() : '';
    const pluginId = pluginIdRaw ? pluginIdRaw : null;
    const limitRaw = typeof req.query.limit === 'string' ? req.query.limit.trim() : null;
    const parsedLimit = limitRaw ? Number.parseInt(limitRaw, 10) : Number.NaN;
    let limit = Number.isFinite(parsedLimit) ? parsedLimit : 1;
    if (limit < 0) {
      limit = 0;
    }
    if (limit > MAX_PULL_LIMIT) {
      limit = MAX_PULL_LIMIT;
    }
    const effectiveLimit = limit === 0 ? 0 : limit || 1;

    const pendingTasks = findTasksByStatuses(['pending', 'queued'], { order: 'asc' });
    const toPull = effectiveLimit === 0 ? [] : pendingTasks.slice(0, effectiveLimit);
    const pulled = [];
    for (const task of toPull) {
      const updated = transitionTaskToRunning(task, { pluginId });
      if (updated) {
        pulled.push({ taskId: updated.id, taskSpec: updated.taskSpec ?? null });
      }
    }
    const remaining = Math.max(0, pendingTasks.length - toPull.length);
    const response = {
      items: pulled,
      pulled: pulled.length,
      remaining,
      hasMore: remaining > 0,
    };
    if (pulled.length > 0) {
      response.taskId = pulled[0].taskId;
      response.taskSpec = pulled[0].taskSpec;
    } else {
      response.taskId = null;
      response.taskSpec = null;
    }
    return res.json(response);
  });

  app.get('/tasks/latest', (req, res) => {
    const status = String(req.query.status || 'pending');
    const latest = findLatestTaskByStatuses([status]);
    if (!latest) {
      return sendJsonError(res, 404, `No ${status} tasks`);
    }
    res.json({
      id: latest.id,
      status: latest.status,
      createdAt: latest.createdAt,
      taskSpec: latest.taskSpec,
    });
  });

  app.get('/tasks/:id', (req, res) => {
    const id = req.params.id;
    const rec = readOne(id);
    if (!rec) return sendJsonError(res, 404, 'not found');
    const previewInfo = getPreviewInfo(id, rec);
    res.json({
      ...rec,
      logs: normalizeLogs(rec.logs).map((l) => l.message),
      ...previewInfo,
    });
  });

  app.post('/tasks/:id/result', (req, res) => {
    const id = req.params.id;
    const rec = readOne(id);
    if (!rec) return sendJsonError(res, 404, 'not found');
    const result = req.body && req.body.result;
    if (!result) return sendJsonError(res, 400, 'result required');
    const finalize = finalizeTaskResult(rec, result);
    if (finalize.error) {
      return res.status(finalize.error.status).json(finalize.error.body);
    }
    writeOne(finalize.updated);
    for (const entry of finalize.appended) {
      broadcastTaskEvent(id, 'log', entry);
    }
    const resultPreviewInfo = getPreviewInfo(id, finalize.updated);
    broadcastTaskEvent(
      id,
      'result',
      {
        status: 'done',
        exportSpec: result,
        artifactPath: finalize.updated.artifactPath,
        artifactSize: finalize.updated.artifactSize,
        ...resultPreviewInfo,
      },
      { closeAfterMs: 3000 },
    );
    notifications.taskDone({
      task: finalize.updated,
      artifactSize: finalize.updated.artifactSize ?? null,
      baseUrl: deriveBaseUrl(req),
    });
    res.json({ ok: true });
  });

  app.post('/tasks/:id/preview', (req, res) => {
    const id = req.params.id;
    const task = readOne(id);
    if (!task) {
      return sendJsonError(res, 404, 'not found');
    }
    const body = req.body || {};
    if (body.contentType !== PREVIEW_CONTENT_TYPE) {
      return sendJsonError(res, 400, 'contentType must be image/png');
    }
    const base64Input = typeof body.base64 === 'string' ? body.base64.trim() : '';
    if (!base64Input) {
      return sendJsonError(res, 400, 'base64 required');
    }
    const normalizedInput = base64Input.replace(/\s+/g, '');
    let buffer;
    try {
      buffer = Buffer.from(normalizedInput, 'base64');
    } catch {
      return sendJsonError(res, 400, 'Invalid base64');
    }
    if (!buffer || buffer.length === 0) {
      return sendJsonError(res, 400, 'Invalid preview payload');
    }
    const reconstructed = buffer.toString('base64').replace(/=+$/g, '');
    const normalizedComparable = normalizedInput.replace(/=+$/g, '');
    if (!reconstructed || reconstructed !== normalizedComparable) {
      return sendJsonError(res, 400, 'Invalid base64');
    }
    if (previewMaxBytes > 0 && buffer.length > previewMaxBytes) {
      return sendJsonError(res, 413, 'Payload too large');
    }

    const previewPaths = getPreviewPaths(id);
    if (!previewPaths) {
      return sendJsonError(res, 400, 'Invalid task id');
    }

    try {
      fs.writeFileSync(previewPaths.absolute, buffer);
      cleanupState.dirty = true;
    } catch (err) {
      console.error('Failed to write preview', err);
      return sendJsonError(res, 500, 'Failed to store preview');
    }

    const updated = {
      ...task,
      previewPath: previewPaths.relative,
      previewSize: buffer.length,
      previewUpdatedAt: Date.now(),
    };
    writeOne(updated);

    const previewInfo = getPreviewInfo(id, updated);
    broadcastTaskEvent(id, 'preview', {
      size: buffer.length,
      ...previewInfo,
    });

    res.json({ ok: true, size: buffer.length });
  });

  app.get('/tasks/:id/preview.png', (req, res) => {
    const id = req.params.id;
    const previewPaths = getPreviewPaths(id);
    if (!previewPaths) {
      return sendJsonError(res, 404, 'Not found');
    }
    let exists = false;
    try {
      const stat = fs.statSync(previewPaths.absolute);
      exists = stat.isFile();
    } catch (err) {
      if (err && err.code !== 'ENOENT') {
        console.error('Failed to access preview', previewPaths.absolute, err);
      }
    }
    if (!exists) {
      return sendJsonError(res, 404, 'Not found');
    }
    res.type(PREVIEW_CONTENT_TYPE);
    res.sendFile(previewPaths.absolute);
  });

  app.post('/results', (req, res) => {
    const body = req.body || {};
    const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : '';
    if (!taskId) {
      return sendJsonError(res, 400, 'taskId required');
    }
    const exportSpec = body.exportSpec;
    if (exportSpec == null || typeof exportSpec !== 'object') {
      return sendJsonError(res, 400, 'exportSpec required');
    }
    const rec = readOne(taskId);
    if (!rec) {
      return sendJsonError(res, 404, 'not found');
    }
    const finalize = finalizeTaskResult(rec, exportSpec, { logs: body.logs });
    if (finalize.error) {
      return res.status(finalize.error.status).json(finalize.error.body);
    }
    writeOne(finalize.updated);
    for (const entry of finalize.appended) {
      broadcastTaskEvent(taskId, 'log', entry);
    }
    const resultPreviewInfo = getPreviewInfo(taskId, finalize.updated);
    broadcastTaskEvent(
      taskId,
      'result',
      {
        status: 'done',
        exportSpec,
        artifactPath: finalize.updated.artifactPath,
        artifactSize: finalize.updated.artifactSize,
        ...resultPreviewInfo,
      },
      { closeAfterMs: 3000 },
    );
    notifications.taskDone({
      task: finalize.updated,
      artifactSize: finalize.updated.artifactSize ?? null,
      baseUrl: deriveBaseUrl(req),
    });
    res.json({ ok: true });
  });

  app.get('/tasks/:id/result', (req, res) => {
    const t = readOne(req.params.id);
    if (!t) return sendJsonError(res, 404, 'Not found');
    const previewInfo = getPreviewInfo(t.id, t);
    res.json({
      taskId: t.id,
      status: t.status,
      exportSpec: t.result ?? null,
      logs: normalizeLogs(t.logs).map((l) => l.message),
      error: t.error ?? null,
      artifactPath: t.artifactPath ?? null,
      artifactSize: t.artifactSize ?? null,
      ...previewInfo,
    });
  });

  app.get('/tasks/:id/artifact', (req, res) => {
    return sendJsonArtifact(res, req.params.id);
  });

  app.get('/tasks/:id/package.zip', (req, res) => {
    return sendZipArtifact(res, req.params.id);
  });

  app.post('/tasks/:id/share', (req, res) => {
    const taskId = req.params.id;
    pruneExpiredShares({ persist: true });

    const body = req.body || {};
    const shareType = sanitizeShareType(body.type);
    const ttlCandidate = body.ttlMin != null ? body.ttlMin : defaultShareTtlMin;
    const ttlMinutes = clampTtlMinutes(ttlCandidate, defaultShareTtlMin);

    const ensured = shareType === 'json' ? ensureJsonArtifact(taskId) : ensureZipArtifact(taskId);
    if (ensured.error) {
      return res.status(ensured.error.status).json(ensured.error.body);
    }

    const token = generateShareToken();
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    const entry = { token, taskId, type: shareType, expiresAt };
    shareTokens.set(token, entry);
    expiredShareTokens.delete(token);
    persistShareTokens();

    const requestBase = deriveBaseUrl(req);
    const originCandidate = publicBaseUrl || requestBase || '';
    let normalizedOrigin = '';
    if (typeof originCandidate === 'string') {
      normalizedOrigin = originCandidate.trim().replace(/\/+$/, '');
    }
    if (!normalizedOrigin && typeof requestBase === 'string') {
      normalizedOrigin = requestBase.trim().replace(/\/+$/, '');
    }
    const shareUrlBase = normalizedOrigin || '';
    const shareUrl = `${shareUrlBase}/shared/${encodeURIComponent(token)}`;

    return res.json({ url: shareUrl, expiresAt });
  });

  app.get('/shared/:token', (req, res) => {
    const rawToken = typeof req.params.token === 'string' ? req.params.token.trim() : '';
    if (!rawToken) {
      return sendJsonError(res, 404, 'Not found');
    }

    const now = Date.now();
    const entry = shareTokens.get(rawToken);
    if (!entry) {
      const expired = expiredShareTokens.get(rawToken);
      if (expired) {
        if (now - expired.expiresAt > EXPIRED_TOKEN_RETENTION_MS) {
          expiredShareTokens.delete(rawToken);
        }
        return sendJsonError(res, 410, 'Expired');
      }
      pruneExpiredShares({ persist: true });
      return sendJsonError(res, 404, 'Not found');
    }

    if (entry.expiresAt <= now) {
      shareTokens.delete(rawToken);
      expiredShareTokens.set(rawToken, entry);
      persistShareTokens();
      return sendJsonError(res, 410, 'Expired');
    }

    const type = sanitizeShareType(entry.type);
    if (type === 'json') {
      return sendJsonArtifact(res, entry.taskId);
    }
    if (type === 'zip') {
      return sendZipArtifact(res, entry.taskId);
    }

    shareTokens.delete(rawToken);
    persistShareTokens();
    console.error('[relay] Unsupported share type for token', summarizeToken(rawToken), type);
    return sendJsonError(res, 500, 'Unsupported share type');
  });

  app.post('/artifacts/bulk.zip', (req, res) => {
    const body = req.body || {};
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return sendJsonError(res, 400, 'ids must be an array');
    }
    if (ids.length === 0) {
      return sendJsonError(res, 400, 'ids must not be empty');
    }
    if (ids.length > MAX_BULK_ARTIFACT_IDS) {
      return sendJsonError(res, 400, `Too many ids (max ${MAX_BULK_ARTIFACT_IDS})`);
    }

    const normalizedIds = [];
    const invalidIds = [];
    const duplicateIds = [];
    const seen = new Set();

    for (const raw of ids) {
      if (typeof raw !== 'string') {
        invalidIds.push(String(raw));
        continue;
      }
      const trimmed = raw.trim();
      if (!trimmed) {
        invalidIds.push(raw);
        continue;
      }
      if (!SAFE_TASK_ID_RE.test(trimmed)) {
        invalidIds.push(trimmed);
        continue;
      }
      if (seen.has(trimmed)) {
        duplicateIds.push(trimmed);
        continue;
      }
      seen.add(trimmed);
      normalizedIds.push(trimmed);
    }

    if (normalizedIds.length === 0) {
      return sendJsonError(res, 400, 'no valid ids provided');
    }

    const tasks = readAll(true);
    const entries = [];
    const missingIds = [];
    let totalSize = 0;

    for (const id of normalizedIds) {
      const artifactPaths = getArtifactPaths(id);
      if (!artifactPaths) {
        missingIds.push(id);
        continue;
      }
      const { absolute: artifactFile, relative: artifactRelative } = artifactPaths;
      if (!fs.existsSync(artifactFile)) {
        missingIds.push(id);
        continue;
      }
      let stat;
      try {
        stat = fs.statSync(artifactFile);
      } catch (err) {
        console.error('Failed to stat artifact for bulk zip', artifactFile, err);
        missingIds.push(id);
        continue;
      }
      const task = tasks.get(id);
      if (!task || task.deleted) {
        missingIds.push(id);
        continue;
      }
      const logs = normalizeLogs(task.logs);
      const logsText = logs.map((entry) => formatLogLine(entry)).join('\n');
      const logsBuffer = Buffer.from(logsText, 'utf8');
      const taskInfo = {
        id: task.id,
        createdAt: task.createdAt ?? null,
        status: task.status ?? null,
      };
      const taskBuffer = Buffer.from(JSON.stringify(taskInfo, null, 2), 'utf8');
      const metaInfo = {
        id: task.id,
        createdAt: task.createdAt ?? null,
        artifactPath: task.artifactPath ?? artifactRelative,
        artifactSize: stat.size,
      };
      const metaBuffer = Buffer.from(JSON.stringify(metaInfo, null, 2), 'utf8');

      totalSize += stat.size + logsBuffer.length + taskBuffer.length + metaBuffer.length;
      if (totalSize > BULK_ZIP_MAX_SIZE_BYTES) {
        return sendJsonError(res, 413, 'Payload too large');
      }

      entries.push({
        id,
        artifactFile,
        logsBuffer,
        taskBuffer,
        metaBuffer,
      });
    }

    const logLines = [];
    for (const value of invalidIds) {
      logLines.push(`invalid: ${value}`);
    }
    for (const value of duplicateIds) {
      logLines.push(`duplicate: ${value}`);
    }
    for (const value of missingIds) {
      logLines.push(`missing: ${value}`);
    }
    let logBuffer = null;
    if (logLines.length > 0) {
      logBuffer = Buffer.from(logLines.join('\n') + '\n', 'utf8');
      if (totalSize + logBuffer.length > BULK_ZIP_MAX_SIZE_BYTES) {
        return sendJsonError(res, 413, 'Payload too large');
      }
    }

    if (entries.length === 0 && !logBuffer) {
      return sendJsonError(res, 404, 'No artifacts found for provided ids');
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="artifacts-bulk.zip"');

    const zip = new Yazl.ZipFile();
    const activeStreams = new Set();
    let responseClosed = false;

    const abort = (err) => {
      if (responseClosed) return;
      responseClosed = true;
      const reason = err || new Error('Artifact read error');
      console.error('Failed to stream bulk artifacts zip', reason);
      for (const stream of Array.from(activeStreams)) {
        try {
          stream.destroy(reason);
        } catch {}
      }
      try {
        zip.outputStream.unpipe(res);
      } catch {}
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.removeHeader('Content-Disposition');
        sendJsonError(res, 500, 'Artifact read error');
      } else {
        res.destroy(reason);
      }
    };

    zip.outputStream.on('error', abort);
    res.on('close', () => {
      responseClosed = true;
      for (const stream of Array.from(activeStreams)) {
        try {
          stream.destroy();
        } catch {}
      }
    });

    for (const entry of entries) {
      const stream = fs.createReadStream(entry.artifactFile);
      activeStreams.add(stream);
      stream.on('error', abort);
      stream.on('close', () => {
        activeStreams.delete(stream);
      });
      stream.on('end', () => {
        activeStreams.delete(stream);
      });
      zip.addReadStream(stream, `${entry.id}/exportSpec.json`);
      zip.addBuffer(entry.logsBuffer, `${entry.id}/logs.txt`);
      zip.addBuffer(entry.taskBuffer, `${entry.id}/task.json`);
      zip.addBuffer(entry.metaBuffer, `${entry.id}/meta.json`);
    }

    if (logBuffer) {
      zip.addBuffer(logBuffer, 'bulk.log.txt');
    }

    zip.outputStream.pipe(res);
    zip.end();
  });

  app.get('/artifacts/compare.zip', (req, res) => {
    const context = computeCompareContext({
      leftId: req.query.leftId,
      rightId: req.query.rightId,
      mode: typeof req.query.mode === 'string' ? req.query.mode.trim().toLowerCase() : '',
    });

    if (context.error) {
      return res.status(context.error.status).json(context.error.body);
    }

    const generatedAt = new Date().toISOString();
    const html = sanitizeSensitiveQueryParams(
      buildCompareHtmlDocument(context, { generatedAt }),
    );
    const diffPayload = {
      leftId: context.leftId,
      rightId: context.rightId,
      summary: context.summary,
      diff: context.responseDiff,
    };

    const leftSegment = sanitizeFilenameSegment(context.leftId);
    const rightSegment = sanitizeFilenameSegment(context.rightId);
    const fileName = `compare-${leftSegment}-vs-${rightSegment}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const zip = new Yazl.ZipFile();
    let responseClosed = false;

    const abort = (err) => {
      if (responseClosed) return;
      responseClosed = true;
      const reason = err || new Error('Failed to generate compare zip');
      console.error('Failed to generate compare zip', reason);
      try {
        zip.outputStream.unpipe(res);
      } catch {}
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.removeHeader('Content-Disposition');
        sendJsonError(res, 500, 'Failed to generate compare zip');
      } else {
        res.destroy(reason);
      }
    };

    zip.outputStream.on('error', abort);
    res.on('close', () => {
      responseClosed = true;
    });

    try {
      zip.addBuffer(Buffer.from(JSON.stringify(diffPayload, null, 2), 'utf8'), 'diff.json');
      zip.addBuffer(Buffer.from(html, 'utf8'), 'diff.html');
      const metaText = buildCompareMetaText(context, generatedAt);
      zip.addBuffer(Buffer.from(metaText, 'utf8'), 'meta.txt');
    } catch (err) {
      return abort(err);
    }

    zip.outputStream.pipe(res);
    zip.end();
  });

  app.get('/artifacts/compare.html', (req, res) => {
    const context = computeCompareContext({
      leftId: req.query.leftId,
      rightId: req.query.rightId,
      mode: typeof req.query.mode === 'string' ? req.query.mode.trim().toLowerCase() : '',
    });

    if (context.error) {
      return res.status(context.error.status).json(context.error.body);
    }

    const html = sanitizeSensitiveQueryParams(buildCompareHtmlDocument(context));

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  });

  app.post('/artifacts/compare', (req, res) => {
    const body = req.body || {};
    const context = computeCompareContext({
      leftId: body.leftId,
      rightId: body.rightId,
      mode: typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : '',
    });

    if (context.error) {
      return res.status(context.error.status).json(context.error.body);
    }

    res.json({
      leftId: context.leftId,
      rightId: context.rightId,
      summary: context.summary,
      diff: context.responseDiff,
    });
  });

  function cleanupArtifacts({ max = maxArtifacts, ttlDays: ttl = ttlDays } = {}) {
    const now = Date.now();
    const ttlMs = Number.isFinite(ttl) && ttl > 0 ? Math.floor(ttl) * DAY_IN_MS : null;
    const normalizedMax =
      Number.isFinite(max) && max >= 0 ? Math.floor(max) : Math.max(0, maxArtifacts);

    const artifacts = [];
    const tasks = readAll();
    for (const task of tasks.values()) {
      const paths = getArtifactPaths(task.id);
      if (!paths) continue;
      const { absolute } = paths;
      if (!fs.existsSync(absolute)) continue;
      let stat;
      try {
        stat = fs.statSync(absolute);
      } catch (err) {
        console.error('Failed to stat artifact during cleanup', absolute, err);
        continue;
      }
      const previewPaths = getPreviewPaths(task.id);
      let previewFile = null;
      if (previewPaths && fs.existsSync(previewPaths.absolute)) {
        previewFile = previewPaths.absolute;
      }
      artifacts.push({
        id: task.id,
        task,
        createdAt: task.createdAt ?? 0,
        artifactFile: absolute,
        previewFile,
        size: stat.size,
      });
    }

    const removals = new Map();

    if (ttlMs != null) {
      for (const entry of artifacts) {
        if (!entry.createdAt) {
          continue;
        }
        if (now - entry.createdAt > ttlMs) {
          removals.set(entry.id, entry);
        }
      }
    }

    const remaining = artifacts
      .filter((entry) => !removals.has(entry.id))
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    while (remaining.length > normalizedMax) {
      const entry = remaining.shift();
      if (entry) {
        removals.set(entry.id, entry);
      }
    }

    for (const entry of removals.values()) {
      try {
        fs.unlinkSync(entry.artifactFile);
      } catch (err) {
        if (err && err.code !== 'ENOENT') {
          console.error('Failed to remove artifact', entry.artifactFile, err);
        }
      }
      if (entry.previewFile) {
        try {
          fs.unlinkSync(entry.previewFile);
        } catch (err) {
          if (err && err.code !== 'ENOENT') {
            console.error('Failed to remove preview', entry.previewFile, err);
          }
        }
      }
      closeTaskClients(entry.id);
      writeOne({ id: entry.id, deleted: true, deletedAt: now });
    }

    cleanupState.lastRunAt = now;
    cleanupState.dirty = false;
    cleanupState.lastResult = {
      total: artifacts.length,
      removed: removals.size,
    };
    return cleanupState.lastResult;
  }

  function maybeRunCleanup(force = false) {
    const now = Date.now();
    if (force) {
      return cleanupArtifacts();
    }
    if (!cleanupState.dirty && now - cleanupState.lastRunAt < CLEANUP_MIN_INTERVAL_MS) {
      return null;
    }
    return cleanupArtifacts();
  }

  app.get('/artifacts', (req, res) => {
    maybeRunCleanup(false);

    const tasks = readAll();
    const items = [];
    for (const task of tasks.values()) {
      const paths = getArtifactPaths(task.id);
      if (!paths) continue;
      const { absolute } = paths;
      if (!fs.existsSync(absolute)) continue;
      let size;
      try {
        const stat = fs.statSync(absolute);
        size = stat.size;
      } catch (err) {
        console.error('Failed to stat artifact', absolute, err);
        continue;
      }
      const previewInfo = getPreviewInfo(task.id, task);
      items.push({
        id: task.id,
        createdAt: task.createdAt ?? 0,
        size,
        hasZip: true,
        hasPreview: previewInfo.hasPreview,
        previewUpdatedAt: previewInfo.previewUpdatedAt,
      });
    }

    const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    items.sort((a, b) => {
      const aTs = a.createdAt || 0;
      const bTs = b.createdAt || 0;
      return order === 'asc' ? aTs - bTs : bTs - aTs;
    });

    const offsetRaw = parseInteger(req.query.offset);
    const limitRaw = parseInteger(req.query.limit);
    const offset = offsetRaw != null && offsetRaw >= 0 ? offsetRaw : 0;
    const limitCandidate = limitRaw != null && limitRaw > 0 ? limitRaw : 50;
    const limit = Math.min(200, limitCandidate);

    const sliced = items.slice(offset, offset + limit);
    res.json({
      items: sliced,
      total: items.length,
      offset,
      limit,
    });
  });

  app.post('/tasks/:id/log', (req, res) => {
    const { message } = req.body || {};
    if (typeof message !== 'string' || !message.trim()) {
      return sendJsonError(res, 400, 'message required');
    }
    const t = readOne(req.params.id);
    if (!t) return sendJsonError(res, 404, 'Not found');
    const logs = normalizeLogs(t.logs);
    const entry = {
      message: message.trim(),
      ts: new Date().toISOString(),
    };
    logs.push(entry);
    const updated = { ...t, logs };
    writeOne(updated);
    broadcastTaskEvent(req.params.id, 'log', entry);
    res.json({ ok: true });
  });

  app.get('/tasks/:id/watch', (req, res) => {
    const id = req.params.id;
    const task = readOne(id);
    if (!task) {
      return sendJsonError(res, 404, 'not found');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }
    if (req.socket) {
      req.socket.setKeepAlive(true);
      req.socket.setNoDelay(true);
      req.socket.setTimeout(0);
    }

    const client = registerClient(id, req, res);
    try {
      const previewInfo = getPreviewInfo(id, task);
      client.send('status', {
        status: task.status || 'pending',
        logs: normalizeLogs(task.logs),
        exportSpec: task.result ?? null,
        artifactPath: task.artifactPath ?? null,
        artifactSize: task.artifactSize ?? null,
        ...previewInfo,
      });
    } catch {
      client.cleanup();
    }
  });

  app.use((req, res) => {
    sendJsonError(res, 404, 'Not found');
  });

  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }

    if (err && typeof err === 'object' && Number.isInteger(err.status) && err.body) {
      return res.status(err.status).json(err.body);
    }

    const statusCandidate = err && (err.status || err.statusCode);
    const parsedStatus = Number(statusCandidate);
    const status = Number.isFinite(parsedStatus) ? Math.floor(parsedStatus) : 500;
    let message;
    if (status === 413) {
      message = 'Payload too large';
    } else if (status >= 500) {
      message = resolveErrorMessage(status);
    } else {
      message = resolveErrorMessage(status, err && err.message);
    }
    const details =
      err && err.details != null
        ? err.details
        : err && err.stack
        ? { stack: err.stack }
        : undefined;
    const maskedKey = req && req.relayAuth && req.relayAuth.apiKeyMasked;
    if (maskedKey) {
      console.error('[relay] Unhandled error', err, `key:${maskedKey}`);
    } else {
      console.error('[relay] Unhandled error', err);
    }

    sendJsonError(res, status, message, details);
  });

  maybeRunCleanup(true);

  app.cleanupArtifacts = cleanupArtifacts;
  app.locals.cleanup = {
    maxArtifacts,
    ttlDays,
    state: cleanupState,
  };
  app.locals.notifications = notifications;
  app.locals.markTaskError = (taskId, errorMessage, options = {}) =>
    markTaskError(taskId, errorMessage, options);

  return app;
}

function startRelayServer({ port, dataDir } = {}) {
  const app = createApp({ dataDir });
  const normalizedPort =
    typeof port === 'number'
      ? port
      : typeof port === 'string' && port.trim()
      ? Number(port)
      : Number(process.env.PORT || 3000);
  const actualPort = Number.isFinite(normalizedPort) && normalizedPort >= 0 ? normalizedPort : 3000;
  const server = app.listen(actualPort, () => {
    const address = server.address();
    const portToLog = address && typeof address.port === 'number' ? address.port : actualPort;
    console.log(`Relay listening on http://localhost:${portToLog}`);
  });
  return server;
}

module.exports = {
  createApp,
  startRelayServer,
  normalizeLogs,
  toLogEntry,
  formatLogLine,
};
