const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/barbearia.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'barber',
      phone TEXT,
      avatar TEXT,
      color TEXT DEFAULT '#10b981',
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      birthdate TEXT,
      notes TEXT,
      loyalty_points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL,
      price REAL NOT NULL,
      category TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS combos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL NOT NULL,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS combo_items (
      id TEXT PRIMARY KEY,
      combo_id TEXT REFERENCES combos(id) ON DELETE CASCADE,
      service_id TEXT REFERENCES services(id),
      quantity INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      sessions INTEGER NOT NULL,
      service_id TEXT REFERENCES services(id),
      validity_days INTEGER DEFAULT 90,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS client_packages (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      package_id TEXT REFERENCES packages(id),
      sessions_used INTEGER DEFAULT 0,
      sessions_total INTEGER NOT NULL,
      expires_at TEXT,
      purchased_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      professional_id TEXT REFERENCES users(id),
      service_id TEXT REFERENCES services(id),
      client_package_id TEXT REFERENCES client_packages(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      notes TEXT,
      price REAL,
      source TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blocked_times (
      id TEXT PRIMARY KEY,
      professional_id TEXT REFERENCES users(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reason TEXT DEFAULT 'Agenda Bloqueada',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waiting_list (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      professional_id TEXT REFERENCES users(id),
      service_id TEXT REFERENCES services(id),
      preferred_date TEXT,
      preferred_time TEXT,
      status TEXT DEFAULT 'waiting',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      appointment_id TEXT REFERENCES appointments(id),
      type TEXT NOT NULL,
      category TEXT,
      description TEXT,
      amount REAL NOT NULL,
      payment_method TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id),
      professional_id TEXT REFERENCES users(id),
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      payment_method TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
      service_id TEXT,
      product_name TEXT,
      quantity INTEGER DEFAULT 1,
      price REAL NOT NULL
    );
  `);

  // Check if seed data exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedData(db);
  }

  return db;
}

function seedData(db) {
  console.log('Seeding database...');

  const adminPassword = bcrypt.hashSync('admin123', 10);

  // Professionals
  const professionals = [
    { id: uuidv4(), name: 'Arthur Silva', email: 'arthur@barbearia.com', password: adminPassword, role: 'admin', phone: '(51) 99999-0001', color: '#10b981' },
    { id: uuidv4(), name: 'Beto Barbeiro', email: 'beto@barbearia.com', password: adminPassword, role: 'barber', phone: '(51) 99999-0002', color: '#3b82f6' },
    { id: uuidv4(), name: 'Jonata Costa', email: 'jonata@barbearia.com', password: adminPassword, role: 'barber', phone: '(51) 99999-0003', color: '#14b8a6' },
    { id: uuidv4(), name: 'Nathan Oliveira', email: 'nathan@barbearia.com', password: adminPassword, role: 'barber', phone: '(51) 99999-0004', color: '#8b5cf6' },
  ];

  const insertUser = db.prepare('INSERT INTO users (id, name, email, password, role, phone, color) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const p of professionals) {
    insertUser.run(p.id, p.name, p.email, p.password, p.role, p.phone, p.color);
  }

  // Services
  const services = [
    { id: uuidv4(), name: 'Corte', description: 'Corte de cabelo masculino', duration: 30, price: 35, category: 'Cabelo' },
    { id: uuidv4(), name: 'Barba', description: 'Aparar e modelar barba', duration: 30, price: 25, category: 'Barba' },
    { id: uuidv4(), name: 'Corte + Barba', description: 'Corte de cabelo e barba completa', duration: 60, price: 55, category: 'Combo' },
    { id: uuidv4(), name: 'Hidratação', description: 'Hidratação capilar profunda', duration: 30, price: 40, category: 'Tratamento' },
    { id: uuidv4(), name: 'Sobrancelha', description: 'Design e alinhamento de sobrancelha', duration: 15, price: 15, category: 'Estética' },
  ];

  const insertService = db.prepare('INSERT INTO services (id, name, description, duration, price, category) VALUES (?, ?, ?, ?, ?, ?)');
  for (const s of services) {
    insertService.run(s.id, s.name, s.description, s.duration, s.price, s.category);
  }

  // Combos
  const combos = [
    { id: uuidv4(), name: 'Combo Básico', description: 'Corte + Barba com desconto especial', price: 50, original_price: 60 },
    { id: uuidv4(), name: 'Combo Premium', description: 'Corte + Barba + Hidratação', price: 80, original_price: 100 },
    { id: uuidv4(), name: 'Combo Completo', description: 'Corte + Barba + Hidratação + Sobrancelha', price: 95, original_price: 115 },
  ];

  const insertCombo = db.prepare('INSERT INTO combos (id, name, description, price, original_price) VALUES (?, ?, ?, ?, ?)');
  for (const c of combos) {
    insertCombo.run(c.id, c.name, c.description, c.price, c.original_price);
  }

  // Combo items
  const insertComboItem = db.prepare('INSERT INTO combo_items (id, combo_id, service_id, quantity) VALUES (?, ?, ?, ?)');
  // Combo Básico: Corte + Barba
  insertComboItem.run(uuidv4(), combos[0].id, services[0].id, 1);
  insertComboItem.run(uuidv4(), combos[0].id, services[1].id, 1);
  // Combo Premium: Corte + Barba + Hidratação
  insertComboItem.run(uuidv4(), combos[1].id, services[0].id, 1);
  insertComboItem.run(uuidv4(), combos[1].id, services[1].id, 1);
  insertComboItem.run(uuidv4(), combos[1].id, services[3].id, 1);
  // Combo Completo: tudo
  insertComboItem.run(uuidv4(), combos[2].id, services[0].id, 1);
  insertComboItem.run(uuidv4(), combos[2].id, services[1].id, 1);
  insertComboItem.run(uuidv4(), combos[2].id, services[3].id, 1);
  insertComboItem.run(uuidv4(), combos[2].id, services[4].id, 1);

  // Packages
  const packages = [
    { id: uuidv4(), name: 'Pacote Corte 10x', description: '10 cortes com valor especial', price: 280, sessions: 10, service_id: services[0].id, validity_days: 180 },
    { id: uuidv4(), name: 'Pacote Barba 10x', description: '10 barbas com valor especial', price: 200, sessions: 10, service_id: services[1].id, validity_days: 180 },
    { id: uuidv4(), name: 'Pacote VIP 5x', description: '5x Corte+Barba completo VIP', price: 220, sessions: 5, service_id: services[2].id, validity_days: 90 },
  ];

  const insertPackage = db.prepare('INSERT INTO packages (id, name, description, price, sessions, service_id, validity_days) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const p of packages) {
    insertPackage.run(p.id, p.name, p.description, p.price, p.sessions, p.service_id, p.validity_days);
  }

  // Clients
  const clients = [
    { id: uuidv4(), name: 'Carlos Eduardo', phone: '(51) 98765-0001', email: 'carlos@email.com' },
    { id: uuidv4(), name: 'Marcos Vinícius', phone: '(51) 98765-0002', email: 'marcos@email.com' },
    { id: uuidv4(), name: 'Rafael Souza', phone: '(51) 98765-0003', email: 'rafael@email.com' },
    { id: uuidv4(), name: 'Diego Alves', phone: '(51) 98765-0004', email: 'diego@email.com' },
    { id: uuidv4(), name: 'Lucas Pereira', phone: '(51) 98765-0005', email: 'lucas@email.com' },
    { id: uuidv4(), name: 'Gustavo Lima', phone: '(51) 98765-0006', email: 'gustavo@email.com' },
    { id: uuidv4(), name: 'Felipe Martins', phone: '(51) 98765-0007', email: 'felipe@email.com' },
    { id: uuidv4(), name: 'André Santos', phone: '(51) 98765-0008', email: 'andre@email.com' },
    { id: uuidv4(), name: 'Bruno Costa', phone: '(51) 98765-0009', email: 'bruno@email.com' },
    { id: uuidv4(), name: 'Henrique Rocha', phone: '(51) 98765-0010', email: 'henrique@email.com' },
  ];

  const insertClient = db.prepare('INSERT INTO clients (id, name, phone, email) VALUES (?, ?, ?, ?)');
  for (const c of clients) {
    insertClient.run(c.id, c.name, c.phone, c.email);
  }

  // Appointments for today (2026-03-26)
  const today = '2026-03-26';
  const insertAppointment = db.prepare(`
    INSERT INTO appointments (id, client_id, professional_id, service_id, date, start_time, end_time, status, price, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const appointmentsData = [
    // Arthur Silva
    { client: clients[0], prof: professionals[0], service: services[0], start: '08:00', end: '08:30', status: 'confirmed', price: 35 },
    { client: clients[1], prof: professionals[0], service: services[2], start: '09:00', end: '10:00', status: 'confirmed', price: 55 },
    { client: clients[2], prof: professionals[0], service: services[1], start: '10:30', end: '11:00', status: 'scheduled', price: 25 },
    { client: clients[3], prof: professionals[0], service: services[0], start: '14:00', end: '14:30', status: 'scheduled', price: 35 },
    // Beto
    { client: clients[4], prof: professionals[1], service: services[0], start: '08:30', end: '09:00', status: 'confirmed', price: 35 },
    { client: clients[5], prof: professionals[1], service: services[3], start: '09:30', end: '10:00', status: 'scheduled', price: 40 },
    { client: clients[6], prof: professionals[1], service: services[2], start: '11:00', end: '12:00', status: 'scheduled', price: 55 },
    { client: clients[7], prof: professionals[1], service: services[0], start: '15:00', end: '15:30', status: 'scheduled', price: 35 },
    // Jonata
    { client: clients[8], prof: professionals[2], service: services[1], start: '08:00', end: '08:30', status: 'completed', price: 25 },
    { client: clients[9], prof: professionals[2], service: services[0], start: '09:00', end: '09:30', status: 'confirmed', price: 35 },
    { client: clients[0], prof: professionals[2], service: services[4], start: '10:00', end: '10:15', status: 'scheduled', price: 15 },
    { client: clients[1], prof: professionals[2], service: services[2], start: '13:00', end: '14:00', status: 'scheduled', price: 55 },
    // Nathan
    { client: clients[2], prof: professionals[3], service: services[0], start: '09:30', end: '10:00', status: 'confirmed', price: 35 },
    { client: clients[3], prof: professionals[3], service: services[3], start: '10:30', end: '11:00', status: 'scheduled', price: 40 },
    { client: clients[4], prof: professionals[3], service: services[1], start: '14:30', end: '15:00', status: 'scheduled', price: 25 },
  ];

  for (const apt of appointmentsData) {
    insertAppointment.run(
      uuidv4(), apt.client.id, apt.prof.id, apt.service.id,
      today, apt.start, apt.end, apt.status, apt.price, 'admin'
    );
  }

  // Some blocked times
  const insertBlocked = db.prepare('INSERT INTO blocked_times (id, professional_id, date, start_time, end_time, reason) VALUES (?, ?, ?, ?, ?, ?)');
  insertBlocked.run(uuidv4(), professionals[0].id, today, '12:00', '13:00', 'Almoço');
  insertBlocked.run(uuidv4(), professionals[1].id, today, '12:00', '13:30', 'Almoço');
  insertBlocked.run(uuidv4(), professionals[2].id, today, '11:30', '13:00', 'Almoço');
  insertBlocked.run(uuidv4(), professionals[3].id, today, '12:00', '13:00', 'Almoço');

  // Sample transactions
  const insertTransaction = db.prepare('INSERT INTO transactions (id, type, category, description, amount, payment_method, date) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const months = ['2026-01', '2026-02', '2026-03'];
  for (const month of months) {
    for (let day = 1; day <= 25; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      const income = Math.random() * 300 + 100;
      insertTransaction.run(uuidv4(), 'income', 'Serviços', 'Receita do dia', Math.round(income * 100) / 100, 'pix', dateStr);
      if (day % 7 === 0) {
        insertTransaction.run(uuidv4(), 'expense', 'Produtos', 'Compra de produtos', Math.round((Math.random() * 100 + 20) * 100) / 100, 'transfer', dateStr);
      }
    }
  }

  console.log('Database seeded successfully!');
}

module.exports = { getDb, initDatabase };
