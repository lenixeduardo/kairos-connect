import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDb } from './db.js';

const app = express();
const PORT = process.env.PORT || 3333;
const JWT_SECRET = process.env.JWT_SECRET || 'kairos-connect-dev-secret-key';
const JWT_EXPIRES_IN = '24h';
const REFRESH_EXPIRES_IN_DAYS = 7;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function getUser(id) {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, role, avatar FROM users WHERE id = ?').get(id);
  return user || null;
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_IN_DAYS);
    db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, refreshToken, expiresAt.toISOString());

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token é obrigatório.' });
  }

  const db = getDb();
  const stored = db.prepare(
    'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > datetime("now")'
  ).get(refreshToken);

  if (!stored) {
    return res.status(401).json({ message: 'Refresh token inválido ou expirado.' });
  }

  const user = getUser(stored.user_id);
  if (!user) {
    return res.status(401).json({ message: 'Usuário não encontrado.' });
  }

  // Remove old token and generate new pair
  db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);

  const accessToken = signAccessToken(user);
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_IN_DAYS);
  db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, newRefreshToken, expiresAt.toISOString());

  res.json({ accessToken, refreshToken: newRefreshToken });
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Logout realizado.' });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = getUser(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado.' });
  }
  res.json(user);
});

// ─── MACHINES ────────────────────────────────────────────────────────────────
app.get('/api/machines', authenticate, (req, res) => {
  const db = getDb();
  const machines = db.prepare('SELECT * FROM machines ORDER BY name').all();
  // Count active work orders per machine
  const woCounts = db.prepare(
    'SELECT machine_id, COUNT(*) as count FROM work_orders WHERE status IN ("PENDING","IN_PROGRESS","PAUSED") GROUP BY machine_id'
  ).all();
  const countMap = {};
  for (const row of woCounts) countMap[row.machine_id] = row.count;

  const result = machines.map(m => ({
    ...m,
    activeWorkOrders: countMap[m.id] || 0,
  }));
  res.json(result);
});

app.get('/api/machines/maintenance-due', authenticate, (req, res) => {
  const db = getDb();
  const due = db.prepare(
    'SELECT * FROM machines WHERE next_preventive_maintenance <= datetime("now", "+30 days") ORDER BY next_preventive_maintenance'
  ).all();
  res.json(due);
});

// ─── WORK ORDERS ─────────────────────────────────────────────────────────────
app.get('/api/work-orders', authenticate, (req, res) => {
  const db = getDb();
  const { status } = req.query;

  let sql = `
    SELECT wo.*, m.name as machine_name, m.sector as machine_sector,
           u.name as assigned_name, u.email as assigned_email
    FROM work_orders wo
    LEFT JOIN machines m ON wo.machine_id = m.id
    LEFT JOIN users u ON wo.assigned_to_id = u.id
  `;
  const params = [];

  if (status) {
    sql += ' WHERE wo.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY wo.created_at DESC';

  const orders = db.prepare(sql).all(...params);

  const result = orders.map(o => ({
    id: o.id,
    title: o.title,
    description: o.description,
    status: o.status,
    priority: o.priority,
    serviceType: o.service_type,
    machine: o.machine_id ? { id: o.machine_id, name: o.machine_name, sector: o.machine_sector } : null,
    assignedTo: o.assigned_name ? { name: o.assigned_name, email: o.assigned_email } : null,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    completedAt: o.completed_at,
  }));

  res.json(result);
});

app.get('/api/work-orders/kpis', authenticate, (req, res) => {
  const db = getDb();

  // Status counts
  const statusCounts = {};
  const counts = db.prepare('SELECT status, COUNT(*) as count FROM work_orders GROUP BY status').all();
  for (const row of counts) statusCounts[row.status] = row.count;

  res.json({
    statusCounts,
    globalMttrMinutes: null, // Placeholder — requires time tracking
  });
});

// ─── START ───────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const seed = () => {
    const db = getDb();
    const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
    return count.count;
  };

  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║                                          ║');
  console.log('  ║   KairOS Connect  ●  Backend Local       ║');
  console.log('  ║                                          ║');
  console.log(`  ║   API: http://localhost:${PORT}              ║`);
  console.log(`  ║   DB:  SQLite (kairos.db)                ║`);
  console.log(`  ║   Users: ${seed()} cadastrados           ║`);
  console.log('  ║                                          ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
