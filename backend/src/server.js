const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

// Initialize database
const db = initDatabase();

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/professionals', require('./routes/professionals'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/blocked-times', require('./routes/blocked-times'));
app.use('/api/combos', require('./routes/combos'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/financial', require('./routes/financial'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/waiting-list', require('./routes/waiting-list'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Barbearia Biehl API running on http://localhost:${PORT}`);
});

module.exports = app;
