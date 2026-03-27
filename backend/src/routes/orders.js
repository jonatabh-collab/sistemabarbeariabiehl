const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/orders
router.get('/', authenticateToken, (req, res) => {
  const { status, date } = req.query;
  const db = getDb();

  let query = `
    SELECT o.*,
      c.name as client_name,
      c.phone as client_phone,
      u.name as professional_name
    FROM orders o
    LEFT JOIN clients c ON o.client_id = c.id
    LEFT JOIN users u ON o.professional_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }
  if (date) {
    query += " AND DATE(o.date) = ?";
    params.push(date);
  }

  query += ' ORDER BY o.created_at DESC';
  const orders = db.prepare(query).all(...params);

  // Get items for each order
  const result = orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });

  res.json({ orders: result });
});

// POST /api/orders
router.post('/', authenticateToken, (req, res) => {
  const { client_id, professional_id, items } = req.body;

  if (!professional_id) {
    return res.status(400).json({ error: 'Profissional é obrigatório' });
  }

  const db = getDb();
  const id = uuidv4();
  const total = items ? items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) : 0;

  db.prepare('INSERT INTO orders (id, client_id, professional_id, total, status) VALUES (?, ?, ?, ?, \'open\')')
    .run(id, client_id || null, professional_id, total);

  if (items && items.length > 0) {
    const insertItem = db.prepare('INSERT INTO order_items (id, order_id, service_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)');
    for (const item of items) {
      insertItem.run(uuidv4(), id, item.service_id || null, item.product_name || null, item.quantity || 1, item.price);
    }
  }

  const order = db.prepare(`
    SELECT o.*, c.name as client_name, u.name as professional_name
    FROM orders o
    LEFT JOIN clients c ON o.client_id = c.id
    LEFT JOIN users u ON o.professional_id = u.id
    WHERE o.id = ?
  `).get(id);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

  res.status(201).json({ order: { ...order, items: orderItems } });
});

// PUT /api/orders/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { items, payment_method } = req.body;

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Comanda não encontrada' });

  if (items !== undefined) {
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(id);
    let total = 0;
    if (items.length > 0) {
      const insertItem = db.prepare('INSERT INTO order_items (id, order_id, service_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?, ?)');
      for (const item of items) {
        insertItem.run(uuidv4(), id, item.service_id || null, item.product_name || null, item.quantity || 1, item.price);
        total += item.price * (item.quantity || 1);
      }
    }
    db.prepare('UPDATE orders SET total = ?, payment_method = ? WHERE id = ?')
      .run(total, payment_method || order.payment_method, id);
  }

  const updated = db.prepare(`
    SELECT o.*, c.name as client_name, u.name as professional_name
    FROM orders o
    LEFT JOIN clients c ON o.client_id = c.id
    LEFT JOIN users u ON o.professional_id = u.id
    WHERE o.id = ?
  `).get(id);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

  res.json({ order: { ...updated, items: orderItems } });
});

// POST /api/orders/:id/close
router.post('/:id/close', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body;

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return res.status(404).json({ error: 'Comanda não encontrada' });
  if (order.status === 'closed') return res.status(400).json({ error: 'Comanda já fechada' });

  db.prepare("UPDATE orders SET status = 'closed', payment_method = ? WHERE id = ?")
    .run(payment_method || order.payment_method, id);

  // Register transaction
  if (order.total > 0) {
    db.prepare('INSERT INTO transactions (id, type, category, description, amount, payment_method, date) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), 'income', 'Comanda', `Comanda #${id.slice(0, 8)}`, order.total, payment_method || 'cash', new Date().toISOString().split('T')[0]);
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  res.json({ order: updated });
});

module.exports = router;
