const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// GET /api/clients
router.get('/', authenticateToken, (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const db = getDb();
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM clients';
  let params = [];
  if (search) {
    query += ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }
  query += ` ORDER BY name LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const clients = db.prepare(query).all(...params);
  const total = db.prepare(`SELECT COUNT(*) as count FROM clients${search ? ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?' : ''}`).get(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : []));

  res.json({ clients, total: total.count });
});

// POST /api/clients
router.post('/', authenticateToken, (req, res) => {
  const { name, phone, email, birthdate, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO clients (id, name, phone, email, birthdate, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, phone, email || null, birthdate || null, notes || null);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  res.status(201).json({ client });
});

// PUT /api/clients/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, phone, email, birthdate, notes } = req.body;

  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

  db.prepare('UPDATE clients SET name=?, phone=?, email=?, birthdate=?, notes=? WHERE id=?')
    .run(
      name || client.name,
      phone || client.phone,
      email !== undefined ? email : client.email,
      birthdate !== undefined ? birthdate : client.birthdate,
      notes !== undefined ? notes : client.notes,
      id
    );

  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  res.json({ client: updated });
});

// DELETE /api/clients/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  res.json({ message: 'Cliente removido com sucesso' });
});

// GET /api/clients/:id/appointments
router.get('/:id/appointments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();

  const appointments = db.prepare(`
    SELECT a.*,
      u.name as professional_name,
      s.name as service_name
    FROM appointments a
    LEFT JOIN users u ON a.professional_id = u.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.client_id = ?
    ORDER BY a.date DESC, a.start_time DESC
  `).all(id);

  res.json({ appointments });
});

// POST /api/clients/login (client app)
router.post('/login', (req, res) => {
  const { phone, name } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Telefone é obrigatório' });
  }

  const db = getDb();
  let client = db.prepare('SELECT * FROM clients WHERE phone = ?').get(phone);

  if (!client) {
    if (!name) {
      return res.status(404).json({ error: 'Cliente não encontrado. Informe seu nome para cadastrar.' });
    }
    const id = uuidv4();
    db.prepare('INSERT INTO clients (id, name, phone) VALUES (?, ?, ?)').run(id, name, phone);
    client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  }

  const token = jwt.sign(
    { id: client.id, phone: client.phone, name: client.name, type: 'client' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({ token, client });
});

module.exports = router;
