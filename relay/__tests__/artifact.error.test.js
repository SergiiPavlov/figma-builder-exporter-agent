const fs = require('fs');
const os = require('os');
const path = require('path');
const { Readable } = require('stream');
const supertest = require('supertest');

const { createApp } = require('../app');

const SAMPLE_TASK_SPEC = {
  meta: {
    specVersion: '0.1',
    id: 'artifact-error-test',
  },
  target: {
    fileId: 'FILE',
    pageName: 'Page',
    frameName: 'Frame',
    frameSize: { w: 1024, h: 768 },
  },
  grid: {
    container: 960,
    columns: 12,
    gap: 16,
    margins: 16,
  },
  sections: [{ type: 'hero', name: 'Hero' }],
};

const SAMPLE_EXPORT_SPEC = {
  meta: { generatedAt: new Date().toISOString() },
  target: { fileId: 'FILE', frameName: 'Frame' },
  summary: { sections: 1 },
};

function createTempDataDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'relay-artifact-'));
}

function removeDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('artifact package error handling', () => {
  let dataDir;
  let app;
  let request;

  beforeEach(() => {
    dataDir = createTempDataDir();
    app = createApp({ dataDir });
    request = supertest(app);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (dataDir) {
      removeDir(dataDir);
      dataDir = null;
    }
  });

  test('surface read errors when streaming package.zip', async () => {
    const createRes = await request.post('/tasks').send({ taskSpec: SAMPLE_TASK_SPEC });
    const { taskId } = createRes.body;
    await request.post('/results').send({ taskId, exportSpec: SAMPLE_EXPORT_SPEC, logs: [] });

    const error = new Error('mock read failure');
    jest.spyOn(fs, 'createReadStream').mockImplementation(() => {
      const stream = new Readable({ read() {} });
      setImmediate(() => {
        stream.emit('open');
        stream.emit('error', error);
      });
      return stream;
    });

    const res = await request.get(`/tasks/${taskId}/package.zip`);
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body).toEqual({ error: 'Artifact read error' });
  });
});
