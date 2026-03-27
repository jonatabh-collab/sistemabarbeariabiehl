const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/blocked-times
router.get('/', authenticateToken, (req, res) => {
  const { date, professional_id } = req.query;
  const db = getDb();

  let query = `
    SELECT bt.*, u.name as professional_name, u.color as professional_color
    FROM blocked_times bt
    LEFT JOIN users u ON bt.professional_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    query += ' AND bt.date = ?';
    params.push(date);
  }
  if (professional_id) {
    query += ' AND bt.professional_id = ?';
    params.push(professional_id);
  }

  query += ' ORDER BY bt.start_time';
  const blocked = db.prepare(query).all(...params);
  res.json({ blocked_times: blocked });
});

// POST /api/blocked-times
router.post('/', authenticateToken, (req, res) => {
  const { professional_id, date, start_time, end_time, reason } = req.body;

  if (!professional_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO blocked_times (id, professional_id, date, start_time, end_time, reason) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, professional_id, date, start_time, end_time, reason || 'Agenda Bloqueada');

  const blocked = db.prepare(`
    SELECT bt.*, u.name as professional_name, u.color as professional_color
    FROM blocked_times bt
    LEFT JOIN users u ON bt.professional_id = u.id
    WHERE bt.id = ?
  `).get(id);

  res.status(201).json({ blocked_time: blocked });
});

// DELETE /api/blocked-times/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const blocked = db.prepare('SELECT id FROM blocked_times WHERE id = ?').get(id);
  if (!blocked) return res.status(404).json({ error: 'Bloqueio não encontrado' });

  db.prepare('DELETE FROM blocked_times WHERE id = ?').run(id);
  res.json({ message: 'Bloqueio removido com sucesso' });
});

module.exports = router;
