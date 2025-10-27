const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Yazl = require('yazl');

const AjvModule = require('ajv/dist/2020');
const Ajv = typeof AjvModule === 'function' ? AjvModule : AjvModule.default;

const SAFE_TASK_ID_RE = /^[A-Za-z0-9._-]+$/;
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const KEEPALIVE_INTERVAL_MS = 30 * 1000;
const CLEANUP_MIN_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_ARTIFACTS = 200;
const DEFAULT_TTL_DAYS = 30;
const MAX_BULK_ARTIFACT_IDS = 50;
const BULK_ZIP_MAX_SIZE_BYTES = 100 * 1024 * 1024;

const DEFAULT_DATA_DIR = path.join(__dirname, 'data');
const TASK_SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'taskSpec.schema.json');
const EXPORT_SCHEMA_PATH = path.join(__dirname, '..', 'schemas', 'exportSpec.schema.json');

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
  return { tasksFile, resultsDir };
}

function parseInteger(value) {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.floor(num);
}

function createApp(options = {}) {
  const dataDir = resolveDataDir(options.dataDir);
  const { tasksFile, resultsDir } = ensureStorageStructure(dataDir);
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

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

  const cleanupState = {
    lastRunAt: 0,
    dirty: true,
    lastResult: null,
  };

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
      return { error: { status: 400, body: { error: 'Invalid task id' } } };
    }
    const { relative: artifactPath, absolute: artifactFile } = artifactPaths;
    try {
      const pretty = JSON.stringify(exportSpec, null, 2);
      fs.writeFileSync(artifactFile, pretty, 'utf8');
      cleanupState.dirty = true;
    } catch (err) {
      console.error('Failed to write artifact', err);
      return { error: { status: 500, body: { error: 'Failed to write artifact' } } };
    }
    let artifactSize = null;
    try {
      const stat = fs.statSync(artifactFile);
      artifactSize = stat.size;
    } catch (err) {
      console.error('Failed to stat artifact', err);
      return { error: { status: 500, body: { error: 'Failed to finalize artifact' } } };
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
      startedAt: task.startedAt ?? task.createdAt ?? Date.now(),
      error: null,
      artifactPath,
      artifactSize,
      logs,
    };
    return { updated, appended };
  }

  function findLatestTaskByStatuses(statuses) {
    const allowed = new Set(statuses);
    const byId = readAll();
    const arr = Array.from(byId.values()).filter((task) => allowed.has(task.status));
    if (arr.length === 0) {
      return null;
    }
    arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return arr[0];
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
    const { taskSpec } = req.body || {};
    if (!taskSpec) return res.status(400).json({ error: 'taskSpec required' });
    const id = uuidv4();
    const rec = {
      id,
      status: 'pending',
      taskSpec,
      createdAt: Date.now(),
      logs: [],
      error: null,
      runnerPluginId: null,
      startedAt: null,
      finishedAt: null,
    };
    writeOne(rec);
    res.json({ taskId: id });
  });

  app.get('/tasks/pull', (req, res) => {
    const pluginId =
      typeof req.query.pluginId === 'string' && req.query.pluginId.trim()
        ? req.query.pluginId.trim()
        : null;
    const next = findLatestTaskByStatuses(['pending', 'queued']);
    if (!next) {
      return res.json({ taskId: null, taskSpec: null });
    }
    const updated = {
      ...next,
      status: 'running',
      runnerPluginId: pluginId ?? next.runnerPluginId ?? null,
      startedAt: Date.now(),
      finishedAt: null,
      error: null,
    };
    writeOne(updated);
    broadcastTaskEvent(updated.id, 'status', {
      status: 'running',
      logs: normalizeLogs(updated.logs),
      exportSpec: updated.result ?? null,
      artifactPath: updated.artifactPath ?? null,
      artifactSize: updated.artifactSize ?? null,
    });
    res.json({ taskId: updated.id, taskSpec: updated.taskSpec ?? null });
  });

  app.get('/tasks/latest', (req, res) => {
    const status = String(req.query.status || 'pending');
    const latest = findLatestTaskByStatuses([status]);
    if (!latest) {
      return res.status(404).json({ error: `No ${status} tasks` });
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
    if (!rec) return res.status(404).json({ error: 'not found' });
    res.json({
      ...rec,
      logs: normalizeLogs(rec.logs).map((l) => l.message),
    });
  });

  app.post('/tasks/:id/result', (req, res) => {
    const id = req.params.id;
    const rec = readOne(id);
    if (!rec) return res.status(404).json({ error: 'not found' });
    const result = req.body && req.body.result;
    if (!result) return res.status(400).json({ error: 'result required' });
    const finalize = finalizeTaskResult(rec, result);
    if (finalize.error) {
      return res.status(finalize.error.status).json(finalize.error.body);
    }
    writeOne(finalize.updated);
    for (const entry of finalize.appended) {
      broadcastTaskEvent(id, 'log', entry);
    }
    broadcastTaskEvent(
      id,
      'result',
      {
        status: 'done',
        exportSpec: result,
        artifactPath: finalize.updated.artifactPath,
        artifactSize: finalize.updated.artifactSize,
      },
      { closeAfterMs: 3000 },
    );
    res.json({ ok: true });
  });

  app.post('/results', (req, res) => {
    const body = req.body || {};
    const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : '';
    if (!taskId) {
      return res.status(400).json({ error: 'taskId required' });
    }
    const exportSpec = body.exportSpec;
    if (exportSpec == null || typeof exportSpec !== 'object') {
      return res.status(400).json({ error: 'exportSpec required' });
    }
    const rec = readOne(taskId);
    if (!rec) {
      return res.status(404).json({ error: 'not found' });
    }
    const finalize = finalizeTaskResult(rec, exportSpec, { logs: body.logs });
    if (finalize.error) {
      return res.status(finalize.error.status).json(finalize.error.body);
    }
    writeOne(finalize.updated);
    for (const entry of finalize.appended) {
      broadcastTaskEvent(taskId, 'log', entry);
    }
    broadcastTaskEvent(
      taskId,
      'result',
      {
        status: 'done',
        exportSpec,
        artifactPath: finalize.updated.artifactPath,
        artifactSize: finalize.updated.artifactSize,
      },
      { closeAfterMs: 3000 },
    );
    res.json({ ok: true });
  });

  app.get('/tasks/:id/result', (req, res) => {
    const t = readOne(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    res.json({
      taskId: t.id,
      status: t.status,
      exportSpec: t.result ?? null,
      logs: normalizeLogs(t.logs).map((l) => l.message),
      error: t.error ?? null,
      artifactPath: t.artifactPath ?? null,
      artifactSize: t.artifactSize ?? null,
    });
  });

  app.get('/tasks/:id/artifact', (req, res) => {
    const id = req.params.id;
    const artifactPaths = getArtifactPaths(id);
    if (!artifactPaths) {
      return res.status(400).json({ error: 'Invalid task id' });
    }
    const { absolute: artifactFile } = artifactPaths;
    if (!fs.existsSync(artifactFile)) {
      return res.status(404).json({ error: 'No artifact' });
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.json"`);
    res.sendFile(artifactFile);
  });

  app.get('/tasks/:id/package.zip', (req, res) => {
    const id = req.params.id;
    const artifactPaths = getArtifactPaths(id);
    if (!artifactPaths) {
      return res.status(400).json({ error: 'Invalid task id' });
    }
    const { absolute: artifactFile, relative: artifactRelativePath } = artifactPaths;
    if (!fs.existsSync(artifactFile)) {
      return res.status(404).json({ error: 'No artifact' });
    }
    const task = readOne(id);
    if (!task) {
      return res.status(404).json({ error: 'not found' });
    }
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
    const metaInfo = {
      id: task.id,
      createdAt: task.createdAt ?? null,
      artifactPath: task.artifactPath ?? artifactRelativePath,
      artifactSize,
    };

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.zip"`);

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
        res.status(500).json({ error: 'Artifact read error' });
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
  });

  app.post('/artifacts/bulk.zip', (req, res) => {
    const body = req.body || {};
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return res.status(400).json({ error: 'ids must be an array' });
    }
    if (ids.length === 0) {
      return res.status(400).json({ error: 'ids must not be empty' });
    }
    if (ids.length > MAX_BULK_ARTIFACT_IDS) {
      return res
        .status(400)
        .json({ error: `Too many ids (max ${MAX_BULK_ARTIFACT_IDS})` });
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
      return res.status(400).json({ error: 'no valid ids provided' });
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
        return res.status(413).json({ error: 'Bulk payload too large' });
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
        return res.status(413).json({ error: 'Bulk payload too large' });
      }
    }

    if (entries.length === 0 && !logBuffer) {
      return res.status(404).json({ error: 'No artifacts found for provided ids' });
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
        res.status(500).json({ error: 'Artifact read error' });
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
      artifacts.push({
        id: task.id,
        task,
        createdAt: task.createdAt ?? 0,
        artifactFile: absolute,
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
      items.push({
        id: task.id,
        createdAt: task.createdAt ?? 0,
        size,
        hasZip: true,
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
      return res.status(400).json({ error: 'message required' });
    }
    const t = readOne(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
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
      return res.status(404).json({ error: 'not found' });
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
      client.send('status', {
        status: task.status || 'pending',
        logs: normalizeLogs(task.logs),
        exportSpec: task.result ?? null,
        artifactPath: task.artifactPath ?? null,
        artifactSize: task.artifactSize ?? null,
      });
    } catch {
      client.cleanup();
    }
  });

  maybeRunCleanup(true);

  app.cleanupArtifacts = cleanupArtifacts;
  app.locals.cleanup = {
    maxArtifacts,
    ttlDays,
    state: cleanupState,
  };

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
