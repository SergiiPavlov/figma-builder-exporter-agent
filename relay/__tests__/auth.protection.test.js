const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');

const { createApp } = require('../app');

const SAMPLE_TASK_SPEC = {
  meta: { specVersion: '0.1', id: 'auth-task' },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 1440, h: 900 },
  },
  grid: { container: 1200, columns: 12, gap: 24, margins: 24 },
  sections: [{ type: 'hero', name: 'Hero' }],
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-auth-'));
}

function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('Auth & Protection middleware', () => {
  const API_KEY = 'test-key';
  let dataDir;
  let app;
  let request;

  beforeEach(() => {
    dataDir = createTempDir();
    app = createApp({
      dataDir,
      apiKeys: [API_KEY],
      rateLimitWindowMs: 2000,
      rateLimitMax: 3,
    });
    request = supertest(app);
  });

  afterEach(async () => {
    if (app && typeof app.__webhooksIdle === 'function') {
      await app.__webhooksIdle();
    }
    app = null;
    if (dataDir) {
      cleanupDir(dataDir);
      dataDir = null;
    }
  });

  function authGet(url) {
    return request.get(url).set('Authorization', `Bearer ${API_KEY}`);
  }

  function authPost(url) {
    return request.post(url).set('Authorization', `Bearer ${API_KEY}`);
  }

  test('rejects protected endpoints without API key', async () => {
    const res = await request.get('/tasks/latest');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  test('allows public endpoints without API key', async () => {
    const healthRes = await request.get('/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body).toEqual({ ok: true });

    const sharedRes = await request.get('/shared/missing');
    expect(sharedRes.status).toBe(404);
    expect(sharedRes.body.error).toBeDefined();
  });

  test('accepts valid API key and enforces rate limits', async () => {
    const first = await authGet('/tasks/pull');
    const second = await authGet('/tasks/pull');
    const third = await authGet('/tasks/pull');
    const fourth = await authGet('/tasks/pull');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(200);
    expect(fourth.status).toBe(429);
    expect(fourth.body).toEqual({ error: 'Too many requests' });
    expect(fourth.headers['retry-after']).toBeDefined();
  });

  test('SSE watch endpoint bypasses rate limit but still requires key', async () => {
    const createRes = await authPost('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    const taskId = createRes.body.taskId;
    expect(taskId).toBeDefined();

    await authGet('/tasks/pull');
    const allowed = await authGet('/tasks/pull');
    const exhausted = await authGet('/tasks/pull');
    expect(allowed.status).toBe(200);
    expect(exhausted.status).toBe(429);

    await new Promise((resolve, reject) => {
      const req = authGet(`/tasks/${taskId}/watch`)
        .set('Accept', 'text/event-stream')
        .buffer(false)
        .parse((res, callback) => {
          let done = false;
          let collected = '';
          res.on('data', (chunk) => {
            if (done) return;
            collected += chunk.toString('utf8');
            if (collected.includes('\n\n')) {
              done = true;
              callback(null, collected);
              res.destroy();
            }
          });
          res.on('error', (err) => {
            if (done) return;
            done = true;
            callback(err);
          });
          res.on('end', () => {
            if (done) return;
            done = true;
            callback(null, collected);
          });
        });

      req.end((err, res) => {
        if (err && !res) {
          reject(err);
          return;
        }
        try {
          expect(res.status).toBe(200);
          resolve();
        } catch (assertErr) {
          reject(assertErr);
        }
      });
    });
  });

  test('CORS preflight exposes required headers', async () => {
    const corsApp = createApp({
      dataDir,
      apiKeys: [API_KEY],
      corsOrigin: ['https://allowed.example'],
    });
    const corsRequest = supertest(corsApp);
    const res = await corsRequest
      .options('/tasks/latest')
      .set('Origin', 'https://allowed.example')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Authorization,Content-Type');
    expect([200, 204]).toContain(res.status);
    expect(res.headers['access-control-allow-origin']).toBe('https://allowed.example');
    const allowHeaders = String(res.headers['access-control-allow-headers'] || '').toLowerCase();
    expect(allowHeaders).toContain('authorization');
    expect(allowHeaders).toContain('content-type');
    expect(allowHeaders).toContain('x-api-key');
    if (typeof corsApp.__webhooksIdle === 'function') {
      await corsApp.__webhooksIdle();
    }
  });
});
