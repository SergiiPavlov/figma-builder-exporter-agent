const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');
const JSZip = require('jszip');

const { createApp } = require('../app');

const SAMPLE_TASK_SPEC = {
  meta: {
    specVersion: '0.1',
    id: 'share-test-task',
  },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 1200, h: 800 },
  },
  sections: [{ type: 'hero', name: 'Hero' }],
};

const SAMPLE_EXPORT_SPEC = {
  meta: { generatedAt: new Date().toISOString() },
  target: { fileId: 'FILE', frameName: 'Frame' },
  summary: { sections: 1 },
};

function createTempDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-share-'));
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('Artifact sharing API', () => {
  let dataDir;
  let app;
  let request;

  beforeEach(() => {
    dataDir = createTempDataDir();
    app = createApp({
      dataDir,
      publicBaseUrl: 'https://relay.example.com',
      publicTokenTtlMin: 30,
    });
    request = supertest(app);
  });

  afterEach(async () => {
    if (app && typeof app.__webhooksIdle === 'function') {
      await app.__webhooksIdle();
    }
    app = null;
    if (dataDir) {
      removeDir(dataDir);
      dataDir = null;
    }
  });

  async function createCompletedTask() {
    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    expect(createRes.status).toBe(200);
    const { taskId } = createRes.body;
    expect(taskId).toBeDefined();

    const resultRes = await request
      .post(`/tasks/${taskId}/result`)
      .send({ result: SAMPLE_EXPORT_SPEC });
    expect(resultRes.status).toBe(200);
    expect(resultRes.body).toEqual({ ok: true });

    return taskId;
  }

  test('POST /tasks/:id/share creates JSON share link with default TTL', async () => {
    const taskId = await createCompletedTask();

    const shareRes = await request.post(`/tasks/${taskId}/share`).send({ type: 'json' });
    expect(shareRes.status).toBe(200);
    expect(typeof shareRes.body.url).toBe('string');
    expect(shareRes.body.url).toMatch(/^https:\/\/relay\.example\.com\/shared\//);
    expect(typeof shareRes.body.expiresAt).toBe('number');

    const ttlMs = shareRes.body.expiresAt - Date.now();
    const expectedMs = 30 * 60 * 1000;
    expect(ttlMs).toBeGreaterThan(0);
    expect(Math.abs(ttlMs - expectedMs)).toBeLessThanOrEqual(15 * 1000);

    const token = shareRes.body.url.split('/').pop();
    expect(token).toBeDefined();

    const sharedRes = await request.get(`/shared/${token}`);
    expect(sharedRes.status).toBe(200);
    expect(sharedRes.headers['content-type']).toContain('application/json');
    const payload = JSON.parse(sharedRes.text);
    expect(payload).toEqual(SAMPLE_EXPORT_SPEC);
  });

  test('ZIP share link streams package with correct headers', async () => {
    const taskId = await createCompletedTask();

    const shareRes = await request
      .post(`/tasks/${taskId}/share`)
      .send({ type: 'zip', ttlMin: 5 });
    expect(shareRes.status).toBe(200);
    const token = shareRes.body.url.split('/').pop();
    expect(token).toBeDefined();

    const sharedZipRes = await request
      .get(`/shared/${token}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('error', (err) => callback(err));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(sharedZipRes.status).toBe(200);
    expect(sharedZipRes.headers['content-type']).toBe('application/zip');
    expect(sharedZipRes.headers['content-disposition']).toContain(`${taskId}.zip`);

    const zip = await JSZip.loadAsync(sharedZipRes.body);
    expect(Object.keys(zip.files)).toEqual(
      expect.arrayContaining(['exportSpec.json', 'logs.txt', 'task.json', 'meta.json']),
    );
    const exportSpecJson = await zip.file('exportSpec.json').async('string');
    expect(JSON.parse(exportSpecJson)).toEqual(SAMPLE_EXPORT_SPEC);
  });

  test('Expired share token returns 410 and is removed from storage', async () => {
    const taskId = await createCompletedTask();

    const shareRes = await request
      .post(`/tasks/${taskId}/share`)
      .send({ type: 'json', ttlMin: 1 });
    expect(shareRes.status).toBe(200);
    const { url, expiresAt } = shareRes.body;
    const token = url.split('/').pop();
    expect(token).toBeDefined();

    const futureNow = expiresAt + 2 * 60 * 1000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => futureNow);
    try {
      const expiredRes = await request.get(`/shared/${token}`);
      expect(expiredRes.status).toBe(410);
    } finally {
      nowSpy.mockRestore();
    }

    const sharesFile = path.join(dataDir, 'shares.json');
    const stored = fs.existsSync(sharesFile) ? fs.readFileSync(sharesFile, 'utf8') : '[]';
    const entries = stored.trim() ? JSON.parse(stored) : [];
    const tokens = Array.isArray(entries) ? entries.map((entry) => entry.token) : [];
    expect(tokens).not.toContain(token);
  });
});
