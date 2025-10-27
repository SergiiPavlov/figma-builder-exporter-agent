const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');
const JSZip = require('jszip');

const { createApp } = require('../app');

const SAMPLE_TASK_SPEC = {
  meta: { specVersion: '0.1', id: 'security-task' },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 1280, h: 720 },
  },
  grid: { container: 960, columns: 12, gap: 24, margins: 24 },
  sections: [{ type: 'hero', name: 'Hero' }],
};

const SAMPLE_EXPORT_SPEC = {
  meta: { generatedAt: new Date().toISOString() },
  target: { fileId: 'FILE', frameName: 'Frame' },
  summary: { sections: 1 },
};

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-security-'));
}

function cleanupDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function expectErrorBody(res, status, message) {
  expect(res.body).toMatchObject({ error: { code: status, message } });
}

describe('security limits and headers', () => {
  let dataDir;
  let app;
  let request;
  let originalEnv;

  beforeEach(() => {
    dataDir = createTempDir();
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(async () => {
    if (app && typeof app.__webhooksIdle === 'function') {
      await app.__webhooksIdle();
    }
    app = null;
    jest.restoreAllMocks();
    if (dataDir) {
      cleanupDir(dataDir);
      dataDir = null;
    }
    if (originalEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalEnv;
    }
  });

  test('rejects JSON payloads exceeding configured limit', async () => {
    app = createApp({ dataDir, jsonBodyLimit: '1kb' });
    request = supertest(app);

    const oversizedValue = 'x'.repeat(2048);
    const res = await request.post('/tasks').send({
      taskSpec: { ...SAMPLE_TASK_SPEC, description: oversizedValue },
    });

    expect(res.status).toBe(413);
    expectErrorBody(res, 413, 'Payload too large');
  });

  test('rejects previews that exceed byte limit', async () => {
    app = createApp({ dataDir, previewMaxBytes: 1024 });
    request = supertest(app);

    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    const taskId = createRes.body.taskId;
    expect(taskId).toBeDefined();

    const largeBuffer = Buffer.alloc(2048, 0xff);
    const res = await request.post(`/tasks/${taskId}/preview`).send({
      contentType: 'image/png',
      base64: largeBuffer.toString('base64'),
    });

    expect(res.status).toBe(413);
    expectErrorBody(res, 413, 'Payload too large');
  });

  test('compare endpoints succeed within limits', async () => {
    app = createApp({ dataDir, compareMaxBytes: 1024 * 1024 });
    request = supertest(app);

    const leftRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    const rightRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    const leftId = leftRes.body.taskId;
    const rightId = rightRes.body.taskId;

    await request.post('/results').send({
      taskId: leftId,
      exportSpec: { ...SAMPLE_EXPORT_SPEC, meta: { generatedAt: new Date().toISOString(), side: 'left' } },
      logs: [],
    });
    await request.post('/results').send({
      taskId: rightId,
      exportSpec: { ...SAMPLE_EXPORT_SPEC, meta: { generatedAt: new Date().toISOString(), side: 'right' } },
      logs: [],
    });

    const htmlRes = await request
      .get('/artifacts/compare.html')
      .query({ leftId, rightId, mode: 'summary' });
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers['content-type']).toContain('text/html');

    const zipRes = await request
      .get('/artifacts/compare.zip')
      .query({ leftId, rightId, mode: 'summary' })
      .buffer(true)
      .parse((resStream, callback) => {
        const chunks = [];
        resStream.on('data', (chunk) => chunks.push(chunk));
        resStream.on('error', (err) => callback(err));
        resStream.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(zipRes.status).toBe(200);
    expect(zipRes.headers['content-type']).toBe('application/zip');
    const zip = await JSZip.loadAsync(zipRes.body);
    expect(Object.keys(zip.files)).toEqual(
      expect.arrayContaining(['diff.json', 'diff.html', 'meta.txt']),
    );
  });

  test('applies security headers to JSON and HTML responses only', async () => {
    app = createApp({ dataDir });
    request = supertest(app);

    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    expect(createRes.status).toBe(200);
    expect(createRes.headers['x-content-type-options']).toBe('nosniff');
    expect(createRes.headers['x-frame-options']).toBe('DENY');
    expect(createRes.headers['referrer-policy']).toBe('no-referrer');
    expect(createRes.headers['content-security-policy']).toBeUndefined();

    const taskId = createRes.body.taskId;
    await request.post('/results').send({ taskId, exportSpec: SAMPLE_EXPORT_SPEC, logs: [] });

    const htmlRes = await request
      .get('/artifacts/compare.html')
      .query({ leftId: taskId, rightId: taskId });
    expect(htmlRes.status).toBe(200);
    expect(htmlRes.headers['x-content-type-options']).toBe('nosniff');
    expect(htmlRes.headers['x-frame-options']).toBe('DENY');
    expect(htmlRes.headers['referrer-policy']).toBe('no-referrer');
    expect(htmlRes.headers['content-security-policy']).toBe(
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'",
    );

    const previewBuffer = Buffer.from('small-preview');
    await request.post(`/tasks/${taskId}/preview`).send({
      contentType: 'image/png',
      base64: previewBuffer.toString('base64'),
    });

    const imageRes = await request.get(`/tasks/${taskId}/preview.png`);
    expect(imageRes.status).toBe(200);
    expect(imageRes.headers['content-type']).toBe('image/png');
    expect(imageRes.headers['x-content-type-options']).toBeUndefined();
    expect(imageRes.headers['x-frame-options']).toBeUndefined();
    expect(imageRes.headers['referrer-policy']).toBeUndefined();
    expect(imageRes.headers['content-security-policy']).toBeUndefined();
  });

  test('allows rollover API keys until removed', async () => {
    app = createApp({
      dataDir,
      apiKeys: ['next-key'],
      apiKeysRollover: ['old-key'],
      rateLimitWindowMs: 0,
      rateLimitMax: 0,
    });
    request = supertest(app);

    const rolloverRes = await request
      .get('/tasks/pull')
      .set('Authorization', 'Bearer old-key');
    expect(rolloverRes.status).toBe(200);

    if (app && typeof app.__webhooksIdle === 'function') {
      await app.__webhooksIdle();
    }

    app = createApp({ dataDir, apiKeys: ['next-key'] });
    request = supertest(app);
    const rejectedRes = await request
      .get('/tasks/pull')
      .set('Authorization', 'Bearer old-key');
    expect(rejectedRes.status).toBe(401);
    expectErrorBody(rejectedRes, 401, 'Unauthorized');
  });

  test('omits stack traces from production error responses', async () => {
    process.env.NODE_ENV = 'production';
    app = createApp({ dataDir });
    request = supertest(app);

    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    const taskId = createRes.body.taskId;
    await request.post('/results').send({ taskId, exportSpec: SAMPLE_EXPORT_SPEC, logs: [] });

    const error = new Error('forced production failure');
    jest.spyOn(fs, 'createReadStream').mockImplementation(() => {
      throw error;
    });

    const res = await request.get(`/tasks/${taskId}/package.zip`);
    expect(res.status).toBeGreaterThanOrEqual(500);
    const payload =
      res.body && Object.keys(res.body).length > 0
        ? res.body
        : res.text
        ? JSON.parse(res.text)
        : {};
    expect(payload.error.code).toBe(res.status);
    expect(payload.error.message).toBe('Internal Server Error');
    expect(payload.error.details).toBeUndefined();
  });
});

