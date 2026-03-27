const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/waiting-list
router.get('/', authenticateToken, (req, res) => {
  const { status } = req.query;
  const db = getDb();

  let query = `
    SELECT wl.*,
      c.name as client_name,
      c.phone as client_phone,
      u.name as professional_name,
      s.name as service_name
    FROM waiting_list wl
    LEFT JOIN clients c ON wl.client_id = c.id
    LEFT JOIN users u ON wl.professional_id = u.id
    LEFT JOIN services s ON wl.service_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND wl.status = ?';
    params.push(status);
  }

  query += ' ORDER BY wl.created_at ASC';
  const waiting = db.prepare(query).all(...params);
  res.json({ waiting_list: waiting });
});

// POST /api/waiting-list
router.post('/', authenticateToken, (req, res) => {
  const { client_id, professional_id, service_id, preferred_date, preferred_time } = req.body;

  if (!client_id || !service_id) {
    return res.status(400).json({ error: 'Cliente e serviço são obrigatórios' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO waiting_list (id, client_id, professional_id, service_id, preferred_date, preferred_time, status) VALUES (?, ?, ?, ?, ?, ?, \'waiting\')')
    .run(id, client_id, professional_id || null, service_id, preferred_date || null, preferred_time || null);

  const entry = db.prepare(`
    SELECT wl.*, c.name as client_name, c.phone as client_phone, u.name as professional_name, s.name as service_name
    FROM waiting_list wl
    LEFT JOIN clients c ON wl.client_id = c.id
    LEFT JOIN users u ON wl.professional_id = u.id
    LEFT JOIN services s ON wl.service_id = s.id
    WHERE wl.id = ?
  `).get(id);

  res.status(201).json({ waiting_entry: entry });
});

// PUT /api/waiting-list/:id/status
router.put('/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: 'Status é obrigatório' });

  const db = getDb();
  const entry = db.prepare('SELECT id FROM waiting_list WHERE id = ?').get(id);
  if (!entry) return res.status(404).json({ error: 'Entrada na lista de espera não encontrada' });

  db.prepare('UPDATE waiting_list SET status = ? WHERE id = ?').run(status, id);

  const updated = db.prepare(`
    SELECT wl.*, c.name as client_name, c.phone as client_phone, u.name as professional_name, s.name as service_name
    FROM waiting_list wl
    LEFT JOIN clients c ON wl.client_id = c.id
    LEFT JOIN users u ON wl.professional_id = u.id
    LEFT JOIN services s ON wl.service_id = s.id
    WHERE wl.id = ?
  `).get(id);

  res.json({ waiting_entry: updated });
});

// DELETE /api/waiting-list/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const entry = db.prepare('SELECT id FROM waiting_list WHERE id = ?').get(id);
  if (!entry) return res.status(404).json({ error: 'Entrada não encontrada' });

  db.prepare('DELETE FROM waiting_list WHERE id = ?').run(id);
  res.json({ message: 'Entrada removida com sucesso' });
});

module.exports = router;
