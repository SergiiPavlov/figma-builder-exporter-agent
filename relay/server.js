/* Minimal Relay server for M2
 * Endpoints:
 *  POST /tasks        -> { taskSpec } => { taskId }
 *  GET  /tasks/:id    -> { status, taskSpec?, result? }
 *  POST /tasks/:id/result -> { exportSpec } => { ok:true }
 *  GET  /health       -> { ok:true }
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.jsonl');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, '', 'utf8');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

function appendJSONL(file, obj) {
  fs.appendFileSync(file, JSON.stringify(obj) + '\n', 'utf8');
}

function readAll() {
  const txt = fs.readFileSync(TASKS_FILE, 'utf8');
  const lines = txt ? txt.split('\n').filter(Boolean) : [];
  const byId = new Map();
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      byId.set(obj.id, obj); // last write wins
    } catch (_) {}
  }
  return byId;
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/tasks', (req, res) => {
  const { taskSpec } = req.body || {};
  if (!taskSpec) return res.status(400).json({ error: 'taskSpec required' });
  const id = uuidv4();
  const rec = { id, status: 'pending', taskSpec, createdAt: Date.now() };
  appendJSONL(TASKS_FILE, rec);
  res.json({ taskId: id });
});

app.get('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const byId = readAll();
  const rec = byId.get(id);
  if (!rec) return res.status(404).json({ error: 'not found' });
  res.json(rec);
});

app.post('/tasks/:id/result', (req, res) => {
  const id = req.params.id;
  const byId = readAll();
  const rec = byId.get(id);
  if (!rec) return res.status(404).json({ error: 'not found' });
  const result = req.body && req.body.result;
  if (!result) return res.status(400).json({ error: 'result required' });
  const updated = { ...rec, status: 'done', result, finishedAt: Date.now() };
  appendJSONL(TASKS_FILE, updated);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Relay listening on http://localhost:${PORT}`);
});
