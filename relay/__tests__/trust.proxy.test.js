const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');

const { createApp } = require('../app');

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-trust-proxy-'));
}

function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function expectErrorBody(res, status, message) {
  expect(res.body).toEqual({ error: { code: status, message } });
}

describe('trust proxy configuration', () => {
  const RATE_LIMIT_WINDOW_MS = 10_000;
  const RATE_LIMIT_MAX = 1;
  let originalTrustProxy;

  beforeEach(() => {
    originalTrustProxy = process.env.TRUST_PROXY;
    delete process.env.TRUST_PROXY;
  });

  afterEach(() => {
    if (originalTrustProxy === undefined) {
      delete process.env.TRUST_PROXY;
    } else {
      process.env.TRUST_PROXY = originalTrustProxy;
    }
  });

  test('numeric trust proxy values are preserved', async () => {
    process.env.TRUST_PROXY = '1';
    const dataDir = createTempDir();
    const app = createApp({ dataDir });
    try {
      expect(app.get('trust proxy')).toBe(1);
    } finally {
      if (typeof app.__webhooksIdle === 'function') {
        await app.__webhooksIdle();
      }
      cleanupDir(dataDir);
    }
  });

  test('disabled trust proxy ignores spoofed X-Forwarded-For headers', async () => {
    process.env.TRUST_PROXY = 'false';
    const dataDir = createTempDir();
    const app = createApp({
      dataDir,
      apiKeys: [],
      rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
      rateLimitMax: RATE_LIMIT_MAX,
    });
    const request = supertest(app);
    try {
      const first = await request
        .get('/tasks/pull')
        .set('X-Forwarded-For', '203.0.113.5');
      expect(first.status).toBe(200);

      const second = await request
        .get('/tasks/pull')
        .set('X-Forwarded-For', '198.51.100.7');
      expect(second.status).toBe(429);
      expectErrorBody(second, 429, 'Too many requests');
    } finally {
      if (typeof app.__webhooksIdle === 'function') {
        await app.__webhooksIdle();
      }
      cleanupDir(dataDir);
    }
  });

  test('loopback trust proxy string is kept verbatim', async () => {
    process.env.TRUST_PROXY = 'loopback';
    const dataDir = createTempDir();
    const app = createApp({ dataDir });
    try {
      expect(app.get('trust proxy')).toBe('loopback');
    } finally {
      if (typeof app.__webhooksIdle === 'function') {
        await app.__webhooksIdle();
      }
      cleanupDir(dataDir);
    }
  });
});

