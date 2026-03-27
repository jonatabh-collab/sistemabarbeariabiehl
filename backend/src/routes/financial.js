const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/financial/summary
router.get('/summary', authenticateToken, (req, res) => {
  const { period = 'month', year, month } = req.query;
  const db = getDb();

  let dateFilter = '';
  const now = new Date();
  const y = year || now.getFullYear();
  const m = month || (now.getMonth() + 1);

  if (period === 'month') {
    const monthStr = String(m).padStart(2, '0');
    dateFilter = `WHERE date LIKE '${y}-${monthStr}%'`;
  } else if (period === 'year') {
    dateFilter = `WHERE date LIKE '${y}%'`;
  } else if (period === 'week') {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];
    dateFilter = `WHERE date >= '${startStr}' AND date <= '${endStr}'`;
  }

  const income = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''}`).get();
  const expense = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense' ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''}`).get();

  // Daily breakdown for chart
  const dailyData = db.prepare(`
    SELECT date,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
    FROM transactions
    ${dateFilter}
    GROUP BY date
    ORDER BY date
  `).all();

  // Appointment stats
  const apptStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show
    FROM appointments
    ${period === 'month' ? `WHERE date LIKE '${y}-${String(m).padStart(2, '0')}%'` : ''}
  `).get();

  const newClients = db.prepare(`SELECT COUNT(*) as count FROM clients WHERE created_at >= date('now', '-30 days')`).get();

  res.json({
    income: income.total,
    expenses: expense.total,
    profit: income.total - expense.total,
    daily_data: dailyData,
    appointment_count: apptStats?.total || 0,
    new_clients: newClients?.count || 0,
    appointments: apptStats,
  });
});

// GET /api/financial/transactions
router.get('/transactions', authenticateToken, (req, res) => {
  const { type, page = 1, limit = 50, date_from, date_to } = req.query;
  const db = getDb();

  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (date_from) {
    query += ' AND date >= ?';
    params.push(date_from);
  }
  if (date_to) {
    query += ' AND date <= ?';
    params.push(date_to);
  }

  query += ' ORDER BY date DESC, created_at DESC';
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const transactions = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM transactions').get();

  res.json({ transactions, total: total.count });
});

// POST /api/financial/transactions
router.post('/transactions', authenticateToken, (req, res) => {
  const { type, category, description, amount, payment_method, date, appointment_id } = req.body;

  if (!type || amount === undefined || !date) {
    return res.status(400).json({ error: 'Tipo, valor e data são obrigatórios' });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare('INSERT INTO transactions (id, appointment_id, type, category, description, amount, payment_method, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, appointment_id || null, type, category || null, description || null, amount, payment_method || null, date);

  const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  res.status(201).json({ transaction });
});

module.exports = router;
