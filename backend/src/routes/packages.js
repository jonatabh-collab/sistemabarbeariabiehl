const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { JWT_SECRET } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

function authenticateClient(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = decoded;
    next();
  });
}

// GET /api/packages
router.get('/', (req, res) => {
  const db = getDb();
  const packages = db.prepare(`
    SELECT p.*, s.name as service_name, s.duration as service_duration
    FROM packages p
    LEFT JOIN services s ON p.service_id = s.id
    WHERE p.active = 1
    ORDER BY p.name
  `).all();

  res.json({ packages });
});

// POST /api/packages
router.post('/', authenticateToken, (req, res) => {
  const { name, description, price, sessions, service_id, validity_days } = req.body;
  if (!name || price === undefined || !sessions || !service_id) {
    return res.status(400).json({ error: 'Nome, preço, sessões e serviço são obrigatórios' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO packages (id, name, description, price, sessions, service_id, validity_days) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, name, description || null, price, sessions, service_id, validity_days || 90);

  const pkg = db.prepare(`
    SELECT p.*, s.name as service_name
    FROM packages p LEFT JOIN services s ON p.service_id = s.id
    WHERE p.id = ?
  `).get(id);

  res.status(201).json({ package: pkg });
});

// PUT /api/packages/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, price, sessions, service_id, validity_days, active } = req.body;

  const db = getDb();
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(id);
  if (!pkg) return res.status(404).json({ error: 'Pacote não encontrado' });

  db.prepare('UPDATE packages SET name=?, description=?, price=?, sessions=?, service_id=?, validity_days=?, active=? WHERE id=?')
    .run(
      name || pkg.name,
      description !== undefined ? description : pkg.description,
      price !== undefined ? price : pkg.price,
      sessions || pkg.sessions,
      service_id || pkg.service_id,
      validity_days || pkg.validity_days,
      active !== undefined ? (active ? 1 : 0) : pkg.active,
      id
    );

  const updated = db.prepare(`
    SELECT p.*, s.name as service_name
    FROM packages p LEFT JOIN services s ON p.service_id = s.id
    WHERE p.id = ?
  `).get(id);

  res.json({ package: updated });
});

// DELETE /api/packages/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const pkg = db.prepare('SELECT id FROM packages WHERE id = ?').get(id);
  if (!pkg) return res.status(404).json({ error: 'Pacote não encontrado' });

  db.prepare('UPDATE packages SET active = 0 WHERE id = ?').run(id);
  res.json({ message: 'Pacote desativado com sucesso' });
});

// POST /api/packages/:id/purchase
router.post('/:id/purchase', authenticateClient, (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;

  const db = getDb();
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ? AND active = 1').get(id);
  if (!pkg) return res.status(404).json({ error: 'Pacote não encontrado' });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + pkg.validity_days);

  const cpId = uuidv4();
  db.prepare('INSERT INTO client_packages (id, client_id, package_id, sessions_used, sessions_total, expires_at) VALUES (?, ?, ?, 0, ?, ?)')
    .run(cpId, clientId, id, pkg.sessions, expiresAt.toISOString().split('T')[0]);

  const clientPackage = db.prepare('SELECT * FROM client_packages WHERE id = ?').get(cpId);
  res.status(201).json({ client_package: clientPackage });
});

module.exports = router;
