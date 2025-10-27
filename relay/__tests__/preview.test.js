const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');
const JSZip = require('jszip');

const { createApp } = require('../app');

const SAMPLE_TASK_SPEC = {
  meta: {
    specVersion: '0.1',
    id: 'preview-test',
  },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 1200, h: 800 },
  },
  grid: {
    container: 960,
    columns: 12,
    gap: 24,
    margins: 24,
  },
  sections: [
    { type: 'hero', name: 'Hero' },
  ],
};

const SAMPLE_EXPORT_SPEC = {
  meta: {
    generatedAt: new Date().toISOString(),
  },
  target: {
    fileId: 'FILE',
    frameName: 'Frame',
  },
  summary: {
    sections: 1,
  },
};

const ONE_BY_ONE_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottQAAAABJRU5ErkJggg==';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-preview-'));
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('Task preview API', () => {
  let dataDir;
  let app;
  let request;

  beforeEach(() => {
    dataDir = createTempDir();
    app = createApp({ dataDir });
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

  async function createTaskWithResult() {
    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    expect(createRes.status).toBe(200);
    const { taskId } = createRes.body;
    const resultRes = await request
      .post(`/tasks/${taskId}/result`)
      .send({ result: SAMPLE_EXPORT_SPEC });
    expect(resultRes.status).toBe(200);
    expect(resultRes.body).toEqual({ ok: true });
    return taskId;
  }

  test('uploads preview and exposes metadata', async () => {
    const taskId = await createTaskWithResult();

    const uploadRes = await request.post(`/tasks/${taskId}/preview`).send({
      contentType: 'image/png',
      base64: ONE_BY_ONE_PNG_BASE64,
    });
    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body).toEqual({ ok: true, size: expect.any(Number) });
    expect(uploadRes.body.size).toBeGreaterThan(0);

    const previewFile = path.join(dataDir, 'previews', `${taskId}.png`);
    expect(fs.existsSync(previewFile)).toBe(true);
    const stat = fs.statSync(previewFile);
    expect(stat.size).toBeGreaterThan(0);

    const previewRes = await request
      .get(`/tasks/${taskId}/preview.png`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('error', (err) => callback(err));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    expect(previewRes.status).toBe(200);
    expect(previewRes.headers['content-type']).toBe('image/png');
    expect(previewRes.body.length).toBeGreaterThan(0);

    const artifactsRes = await request.get('/artifacts');
    expect(artifactsRes.status).toBe(200);
    const artifactEntry = artifactsRes.body.items.find((item) => item.id === taskId);
    expect(artifactEntry).toBeDefined();
    expect(artifactEntry.hasPreview).toBe(true);

    const taskRes = await request.get(`/tasks/${taskId}`);
    expect(taskRes.status).toBe(200);
    expect(taskRes.body.hasPreview).toBe(true);
    expect(taskRes.body.previewUrl).toBe(`/tasks/${taskId}/preview.png`);

    const resultEnvelope = await request.get(`/tasks/${taskId}/result`);
    expect(resultEnvelope.status).toBe(200);
    expect(resultEnvelope.body.hasPreview).toBe(true);
    expect(resultEnvelope.body.previewUrl).toBe(`/tasks/${taskId}/preview.png`);

    const zipRes = await request
      .get(`/tasks/${taskId}/package.zip`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('error', (err) => callback(err));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    expect(zipRes.status).toBe(200);
    const zip = await JSZip.loadAsync(zipRes.body);
    expect(zip.file('preview.png')).toBeDefined();
    const previewFromZip = await zip.file('preview.png').async('nodebuffer');
    expect(previewFromZip.length).toBe(stat.size);
  });

  test('rejects previews with invalid content type or base64', async () => {
    const taskId = await createTaskWithResult();

    const wrongType = await request.post(`/tasks/${taskId}/preview`).send({
      contentType: 'image/jpeg',
      base64: ONE_BY_ONE_PNG_BASE64,
    });
    expect(wrongType.status).toBe(400);

    const badBase64 = await request.post(`/tasks/${taskId}/preview`).send({
      contentType: 'image/png',
      base64: 'not-base64',
    });
    expect(badBase64.status).toBe(400);
  });

  test('rejects previews that exceed the size limit', async () => {
    const taskId = await createTaskWithResult();
    const hugeBuffer = Buffer.alloc(2 * 1024 * 1024 + 1, 0xff);
    const hugeBase64 = hugeBuffer.toString('base64');

    const res = await request.post(`/tasks/${taskId}/preview`).send({
      contentType: 'image/png',
      base64: hugeBase64,
    });
    expect(res.status).toBe(413);
  });

  test('emits preview SSE event for watchers', async () => {
    const taskId = await createTaskWithResult();

    await new Promise((resolve, reject) => {
      let previewEventChunk = '';
      let uploadTriggered = false;
      let done = false;

      const req = request
        .get(`/tasks/${taskId}/watch`)
        .set('Accept', 'text/event-stream')
        .buffer(false)
        .parse((res, callback) => {
          let collected = '';
          const fail = (err) => {
            if (done) return;
            done = true;
            callback(err);
            try {
              res.destroy(err);
            } catch {}
          };

          res.on('data', (chunk) => {
            if (done) return;
            collected += chunk.toString('utf8');
            let marker = collected.indexOf('\n\n');
            while (marker !== -1) {
              const eventChunk = collected.slice(0, marker);
              collected = collected.slice(marker + 2);

              if (!uploadTriggered && eventChunk.includes('event: status')) {
                uploadTriggered = true;
                request
                  .post(`/tasks/${taskId}/preview`)
                  .send({
                    contentType: 'image/png',
                    base64: ONE_BY_ONE_PNG_BASE64,
                  })
                  .catch((err) => fail(err));
              }

              if (eventChunk.includes('event: preview')) {
                previewEventChunk = eventChunk;
                done = true;
                callback(null, eventChunk);
                try {
                  res.destroy();
                } catch {}
                return;
              }

              marker = collected.indexOf('\n\n');
            }
          });

          res.on('error', (err) => fail(err));
          res.on('end', () => {
            if (done) return;
            done = true;
            callback(new Error('SSE closed before preview event'));
          });
        });

      req.end((err, res) => {
        if (err && !res) {
          reject(err);
          return;
        }
        try {
          expect(res.status).toBe(200);
          expect(res.headers['content-type']).toContain('text/event-stream');
          expect(typeof previewEventChunk).toBe('string');
          expect(previewEventChunk).toContain('event: preview');
          expect(previewEventChunk).toContain(`/tasks/${taskId}/preview.png`);
          resolve();
        } catch (assertErr) {
          reject(assertErr);
        }
      });
    });
  });
});
