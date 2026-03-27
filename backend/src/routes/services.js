const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/services
router.get('/', (req, res) => {
  const db = getDb();
  const services = db.prepare('SELECT * FROM services ORDER BY name').all();
  res.json({ services });
});

// POST /api/services
router.post('/', authenticateToken, (req, res) => {
  const { name, description, duration, price, category } = req.body;
  if (!name || !duration || price === undefined) {
    return res.status(400).json({ error: 'Nome, duração e preço são obrigatórios' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO services (id, name, description, duration, price, category) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, description || null, duration, price, category || null);

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.status(201).json({ service });
});

// PUT /api/services/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, duration, price, category, active } = req.body;

  const db = getDb();
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  db.prepare('UPDATE services SET name=?, description=?, duration=?, price=?, category=?, active=? WHERE id=?')
    .run(
      name || service.name,
      description !== undefined ? description : service.description,
      duration || service.duration,
      price !== undefined ? price : service.price,
      category !== undefined ? category : service.category,
      active !== undefined ? (active ? 1 : 0) : service.active,
      id
    );

  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  res.json({ service: updated });
});

// DELETE /api/services/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const service = db.prepare('SELECT id FROM services WHERE id = ?').get(id);
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  db.prepare('UPDATE services SET active = 0 WHERE id = ?').run(id);
  res.json({ message: 'Serviço desativado com sucesso' });
});

module.exports = router;
