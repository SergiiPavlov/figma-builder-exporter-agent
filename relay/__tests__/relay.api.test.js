const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');
const JSZip = require('jszip');

const { createApp } = require('../app');

const SAMPLE_TASK_SPEC = {
  meta: {
    specVersion: '0.1',
    id: 'test-task',
  },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 1440, h: 900 },
  },
  grid: {
    container: 1200,
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

function createTempDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-data-'));
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('Relay API', () => {
  let dataDir;
  let app;
  let request;

  beforeEach(() => {
    dataDir = createTempDataDir();
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

  test('task lifecycle with artifacts and package contents', async () => {
    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    expect(createRes.status).toBe(200);
    const { taskId } = createRes.body;
    expect(typeof taskId).toBe('string');
    expect(taskId.length).toBeGreaterThan(0);

    const getTaskRes = await request.get(`/tasks/${taskId}`);
    expect(getTaskRes.status).toBe(200);
    expect(getTaskRes.body.status).toBe('pending');
    expect(getTaskRes.body.createdAt).toEqual(expect.any(Number));
    expect(getTaskRes.body.hasPreview).toBe(false);
    expect(getTaskRes.body.previewUrl).toBeNull();

    const latestRes = await request.get('/tasks/latest').query({ status: 'pending' });
    expect(latestRes.status).toBe(200);
    expect(latestRes.body).toEqual(
      expect.objectContaining({
        id: taskId,
        status: 'pending',
        createdAt: expect.any(Number),
        taskSpec: SAMPLE_TASK_SPEC,
      }),
    );

    const pullRes = await request.get('/tasks/pull');
    expect(pullRes.status).toBe(200);
    expect(pullRes.body).toEqual({ taskId, taskSpec: SAMPLE_TASK_SPEC });

    const runningTaskRes = await request.get(`/tasks/${taskId}`);
    expect(runningTaskRes.status).toBe(200);
    expect(runningTaskRes.body.status).toBe('running');

    const secondPull = await request.get('/tasks/pull');
    expect(secondPull.status).toBe(200);
    expect(secondPull.body).toEqual({ taskId: null, taskSpec: null });

    const logs = ['build started', { message: 'build done', ts: new Date().toISOString() }];
    const resultsRes = await request.post('/results').send({ taskId, exportSpec: SAMPLE_EXPORT_SPEC, logs });
    expect(resultsRes.status).toBe(200);
    expect(resultsRes.body).toEqual({ ok: true });

    const doneTaskRes = await request.get(`/tasks/${taskId}`);
    expect(doneTaskRes.status).toBe(200);
    expect(doneTaskRes.body.status).toBe('done');
    expect(doneTaskRes.body.result).toEqual(SAMPLE_EXPORT_SPEC);
    expect(doneTaskRes.body.logs).toEqual(expect.arrayContaining(['build started', 'build done']));
    expect(doneTaskRes.body.hasPreview).toBe(false);
    expect(doneTaskRes.body.previewUrl).toBeNull();

    const latestDoneRes = await request.get('/tasks/latest').query({ status: 'done' });
    expect(latestDoneRes.status).toBe(200);
    expect(latestDoneRes.body.id).toBe(taskId);

    const artifactRes = await request.get(`/tasks/${taskId}/artifact`);
    expect(artifactRes.status).toBe(200);
    expect(artifactRes.headers['content-type']).toContain('application/json');
    expect(artifactRes.headers['content-disposition']).toContain(`filename="${taskId}.json"`);
    expect(JSON.parse(artifactRes.text)).toEqual(SAMPLE_EXPORT_SPEC);

    const packageRes = await request
      .get(`/tasks/${taskId}/package.zip`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        res.on('error', (err) => {
          callback(err);
        });
        res.on('end', () => {
          callback(null, Buffer.concat(chunks));
        });
      });
    expect(packageRes.status).toBe(200);
    expect(packageRes.headers['content-type']).toBe('application/zip');
    expect(packageRes.headers['content-disposition']).toContain(`filename="${taskId}.zip"`);

    const zip = await JSZip.loadAsync(packageRes.body);
    expect(Object.keys(zip.files)).toEqual(
      expect.arrayContaining(['exportSpec.json', 'logs.txt', 'task.json', 'meta.json']),
    );

    const exportFile = await zip.file('exportSpec.json').async('string');
    expect(JSON.parse(exportFile)).toEqual(SAMPLE_EXPORT_SPEC);
    const logsText = await zip.file('logs.txt').async('string');
    expect(logsText).toContain('build started');
    expect(logsText).toContain('build done');
    const metaJson = await zip.file('meta.json').async('string');
    expect(JSON.parse(metaJson)).toEqual(
      expect.objectContaining({
        id: taskId,
        artifactPath: expect.any(String),
        artifactSize: expect.any(Number),
      }),
    );

    const artifactsRes = await request.get('/artifacts');
    expect(artifactsRes.status).toBe(200);
    expect(artifactsRes.body).toEqual(
      expect.objectContaining({
        items: [
          expect.objectContaining({
            id: taskId,
            createdAt: expect.any(Number),
            size: expect.any(Number),
            hasZip: true,
            hasPreview: false,
          }),
        ],
        total: expect.any(Number),
        offset: 0,
        limit: expect.any(Number),
      }),
    );
  });

  test('validate taskSpec endpoint handles valid and invalid specs', async () => {
    const validRes = await request.post('/validate/taskSpec').send({ taskSpec: SAMPLE_TASK_SPEC });
    expect(validRes.status).toBe(200);
    expect(validRes.body).toEqual({ valid: true, errors: [] });

    const invalidRes = await request.post('/validate/taskSpec').send({ taskSpec: { not: 'valid' } });
    expect(invalidRes.status).toBe(200);
    expect(invalidRes.body.valid).toBe(false);
    expect(Array.isArray(invalidRes.body.errors)).toBe(true);
    expect(invalidRes.body.errors.length).toBeGreaterThan(0);
  });

  test('watch endpoint streams status events over SSE', async () => {
    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    const { taskId } = createRes.body;
    expect(taskId).toBeDefined();

    await request.get('/tasks/pull');

    await new Promise((resolve, reject) => {
      let ssePayload = '';
      const req = request
        .get(`/tasks/${taskId}/watch`)
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
              ssePayload = collected;
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
            ssePayload = collected;
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
          expect(res.headers['content-type']).toContain('text/event-stream');
          expect(typeof ssePayload).toBe('string');
          expect(ssePayload).toContain('event: status');
          resolve();
        } catch (assertErr) {
          reject(assertErr);
        }
      });
    });
  });
});
