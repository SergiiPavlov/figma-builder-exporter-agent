import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.jsonl');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2)}`);

function readAll() {
  const tasks = new Map();
  if (!fs.existsSync(DATA_FILE)) return tasks;
  const content = fs.readFileSync(DATA_FILE, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && parsed.id) tasks.set(parsed.id, parsed);
    } catch (e) {
      console.warn('Failed to parse line', e);
    }
  }
  return tasks;
}

function writeAll(tasks) {
  const payload = Array.from(tasks.values())
    .map(t => JSON.stringify(t))
    .join('\n');
  fs.writeFileSync(DATA_FILE, payload ? payload + '\n' : '');
}

app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.post('/tasks', (req, res) => {
  const { taskSpec } = req.body || {};
  if (!taskSpec || typeof taskSpec !== 'object') {
    return res.status(400).json({ error: 'taskSpec must be an object' });
  }
  const tasks = readAll();
  const id = newId();
  const createdAt = Date.now();
  const task = { id, status: 'pending', createdAt, taskSpec };
  tasks.set(id, task);
  writeAll(tasks);
  res.status(201).json({ id, status: task.status, createdAt });
});

// GET /tasks/latest?status=pending|done (default: pending)
app.get('/tasks/latest', (req, res) => {
  const status = String(req.query.status || 'pending');
  const tasks = readAll();
  const matches = Array.from(tasks.values()).filter(t => t.status === status);
  if (matches.length === 0) {
    return res.status(404).json({ error: `No ${status} tasks` });
  }
  matches.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const latest = matches[0];
  res.json({
    id: latest.id,
    status: latest.status,
    createdAt: latest.createdAt,
    taskSpec: latest.taskSpec
  });
});

app.get('/tasks/:id', (req, res) => {
  const tasks = readAll();
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

app.post('/tasks/:id/result', (req, res) => {
  const tasks = readAll();
  const task = tasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.result = req.body || {};
  task.status = 'done';
  task.completedAt = Date.now();
  tasks.set(task.id, task);
  writeAll(tasks);
  res.json({ id: task.id, status: task.status, completedAt: task.completedAt });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Relay listening on http://localhost:${port}`);
});

export { readAll };
