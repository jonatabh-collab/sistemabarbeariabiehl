const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/combos
router.get('/', (req, res) => {
  const db = getDb();
  const combos = db.prepare('SELECT * FROM combos WHERE active = 1 ORDER BY name').all();

  // Get items for each combo
  const result = combos.map(combo => {
    const items = db.prepare(`
      SELECT ci.*, s.name as service_name, s.duration, s.price as service_price
      FROM combo_items ci
      LEFT JOIN services s ON ci.service_id = s.id
      WHERE ci.combo_id = ?
    `).all(combo.id);
    return { ...combo, items };
  });

  res.json({ combos: result });
});

// POST /api/combos
router.post('/', authenticateToken, (req, res) => {
  const { name, description, price, original_price, items } = req.body;
  if (!name || price === undefined || original_price === undefined) {
    return res.status(400).json({ error: 'Nome, preço e preço original são obrigatórios' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO combos (id, name, description, price, original_price) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, description || null, price, original_price);

  if (items && items.length > 0) {
    const insertItem = db.prepare('INSERT INTO combo_items (id, combo_id, service_id, quantity) VALUES (?, ?, ?, ?)');
    for (const item of items) {
      insertItem.run(uuidv4(), id, item.service_id, item.quantity || 1);
    }
  }

  const combo = db.prepare('SELECT * FROM combos WHERE id = ?').get(id);
  const comboItems = db.prepare(`
    SELECT ci.*, s.name as service_name, s.duration, s.price as service_price
    FROM combo_items ci
    LEFT JOIN services s ON ci.service_id = s.id
    WHERE ci.combo_id = ?
  `).all(id);

  res.status(201).json({ combo: { ...combo, items: comboItems } });
});

// PUT /api/combos/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, price, original_price, active, items } = req.body;

  const db = getDb();
  const combo = db.prepare('SELECT * FROM combos WHERE id = ?').get(id);
  if (!combo) return res.status(404).json({ error: 'Combo não encontrado' });

  db.prepare('UPDATE combos SET name=?, description=?, price=?, original_price=?, active=? WHERE id=?')
    .run(
      name || combo.name,
      description !== undefined ? description : combo.description,
      price !== undefined ? price : combo.price,
      original_price !== undefined ? original_price : combo.original_price,
      active !== undefined ? (active ? 1 : 0) : combo.active,
      id
    );

  if (items !== undefined) {
    db.prepare('DELETE FROM combo_items WHERE combo_id = ?').run(id);
    if (items.length > 0) {
      const insertItem = db.prepare('INSERT INTO combo_items (id, combo_id, service_id, quantity) VALUES (?, ?, ?, ?)');
      for (const item of items) {
        insertItem.run(uuidv4(), id, item.service_id, item.quantity || 1);
      }
    }
  }

  const updated = db.prepare('SELECT * FROM combos WHERE id = ?').get(id);
  const comboItems = db.prepare(`
    SELECT ci.*, s.name as service_name, s.duration, s.price as service_price
    FROM combo_items ci
    LEFT JOIN services s ON ci.service_id = s.id
    WHERE ci.combo_id = ?
  `).all(id);

  res.json({ combo: { ...updated, items: comboItems } });
});

// DELETE /api/combos/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const combo = db.prepare('SELECT id FROM combos WHERE id = ?').get(id);
  if (!combo) return res.status(404).json({ error: 'Combo não encontrado' });

  db.prepare('UPDATE combos SET active = 0 WHERE id = ?').run(id);
  res.json({ message: 'Combo desativado com sucesso' });
});

module.exports = router;
