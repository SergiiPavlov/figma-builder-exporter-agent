const fs = require('fs');
const os = require('os');
const path = require('path');
const supertest = require('supertest');
const JSZip = require('jszip');

const { createApp } = require('../app');

function createTempDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-bulk-'));
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function buildTaskSpec(index) {
  return {
    meta: {
      specVersion: '0.1',
      id: `bulk-task-${index}`,
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
    sections: [{ type: 'hero', name: `Hero-${index}` }],
  };
}

function buildExportSpec(index) {
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      version: `v${index}`,
    },
    summary: {
      sections: index + 1,
    },
  };
}

describe('Artifacts bulk download', () => {
  let dataDir;
  let app;
  let request;

  beforeEach(() => {
    dataDir = createTempDataDir();
    app = createApp({ dataDir });
    request = supertest(app);
  });

  afterEach(() => {
    if (dataDir) {
      removeDir(dataDir);
      dataDir = null;
    }
  });

  test('returns combined zip for multiple artifacts', async () => {
    const ids = [];
    const exportById = new Map();
    const logById = new Map();

    for (let i = 0; i < 3; i += 1) {
      const taskSpec = buildTaskSpec(i);
      const createRes = await request.post('/tasks').send({ taskSpec });
      expect(createRes.status).toBe(200);
      const { taskId } = createRes.body;
      expect(typeof taskId).toBe('string');
      ids.push(taskId);

      const exportSpec = buildExportSpec(i);
      const logs = [`log-${i + 1}`];
      exportById.set(taskId, exportSpec);
      logById.set(taskId, logs[0]);

      const resultsRes = await request
        .post('/results')
        .send({ taskId, exportSpec, logs });
      expect(resultsRes.status).toBe(200);
      expect(resultsRes.body).toEqual({ ok: true });
    }

    const bulkRes = await request
      .post('/artifacts/bulk.zip')
      .send({ ids })
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

    expect(bulkRes.status).toBe(200);
    expect(bulkRes.headers['content-type']).toBe('application/zip');
    expect(bulkRes.headers['content-disposition']).toContain('artifacts-bulk.zip');

    const zip = await JSZip.loadAsync(bulkRes.body);
    expect(Object.keys(zip.files)).toEqual(
      expect.arrayContaining(
        ids.flatMap((id) => [
          `${id}/exportSpec.json`,
          `${id}/logs.txt`,
          `${id}/task.json`,
          `${id}/meta.json`,
        ]),
      ),
    );
    expect(zip.file('bulk.log.txt')).toBeNull();

    for (const id of ids) {
      const exportSpecContent = await zip.file(`${id}/exportSpec.json`).async('string');
      expect(JSON.parse(exportSpecContent)).toEqual(exportById.get(id));

      const logsText = await zip.file(`${id}/logs.txt`).async('string');
      expect(logsText).toContain(logById.get(id));

      const taskContent = await zip.file(`${id}/task.json`).async('string');
      const taskJson = JSON.parse(taskContent);
      expect(taskJson).toEqual(
        expect.objectContaining({
          id,
          status: 'done',
          createdAt: expect.any(Number),
        }),
      );

      const metaContent = await zip.file(`${id}/meta.json`).async('string');
      const metaJson = JSON.parse(metaContent);
      expect(metaJson).toEqual(
        expect.objectContaining({
          id,
          artifactSize: expect.any(Number),
        }),
      );
    }
  });

  test('rejects empty id list', async () => {
    const res = await request.post('/artifacts/bulk.zip').send({ ids: [] });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('rejects more than 50 ids', async () => {
    const ids = Array.from({ length: 51 }, (_, index) => `id-${index}`);
    const res = await request.post('/artifacts/bulk.zip').send({ ids });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

