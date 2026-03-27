const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/professionals
router.get('/', (req, res) => {
  const db = getDb();
  const professionals = db.prepare('SELECT id, name, email, role, phone, avatar, color, active, created_at FROM users WHERE role IN (\'admin\', \'barber\') ORDER BY name').all();
  res.json({ professionals });
});

// POST /api/professionals
router.post('/', authenticateToken, (req, res) => {
  const { name, email, password, role, phone, color } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, name, email, password, role, phone, color) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, email, hashedPassword, role || 'barber', phone || null, color || '#10b981');

  const professional = db.prepare('SELECT id, name, email, role, phone, avatar, color, active, created_at FROM users WHERE id = ?').get(id);
  res.status(201).json({ professional });
});

// PUT /api/professionals/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, phone, color, active } = req.body;

  const db = getDb();
  const professional = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!professional) {
    return res.status(404).json({ error: 'Profissional não encontrado' });
  }

  if (email && email !== professional.email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });
  }

  const updates = {
    name: name || professional.name,
    email: email || professional.email,
    role: role || professional.role,
    phone: phone !== undefined ? phone : professional.phone,
    color: color || professional.color,
    active: active !== undefined ? (active ? 1 : 0) : professional.active,
  };

  if (password) {
    updates.password = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET name=?, email=?, password=?, role=?, phone=?, color=?, active=? WHERE id=?')
      .run(updates.name, updates.email, updates.password, updates.role, updates.phone, updates.color, updates.active, id);
  } else {
    db.prepare('UPDATE users SET name=?, email=?, role=?, phone=?, color=?, active=? WHERE id=?')
      .run(updates.name, updates.email, updates.role, updates.phone, updates.color, updates.active, id);
  }

  const updated = db.prepare('SELECT id, name, email, role, phone, avatar, color, active, created_at FROM users WHERE id = ?').get(id);
  res.json({ professional: updated });
});

// DELETE /api/professionals/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const professional = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });

  db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(id);
  res.json({ message: 'Profissional desativado com sucesso' });
});

module.exports = router;
