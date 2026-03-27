const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/appointments
router.get('/', authenticateToken, (req, res) => {
  const { date, 'professionals[]': profIds } = req.query;
  const db = getDb();

  let query = `
    SELECT a.*,
      c.name as client_name,
      c.phone as client_phone,
      u.name as professional_name,
      u.color as professional_color,
      s.name as service_name,
      s.duration as service_duration
    FROM appointments a
    LEFT JOIN clients c ON a.client_id = c.id
    LEFT JOIN users u ON a.professional_id = u.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }

  if (profIds) {
    const ids = Array.isArray(profIds) ? profIds : [profIds];
    if (ids.length > 0) {
      query += ` AND a.professional_id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }
  }

  query += ' ORDER BY a.start_time ASC';

  const appointments = db.prepare(query).all(...params);
  res.json({ appointments });
});

// GET /api/appointments/available-slots
router.get('/available-slots', (req, res) => {
  const { date, professional_id, service_id } = req.query;

  if (!date || !professional_id || !service_id) {
    return res.status(400).json({ error: 'date, professional_id e service_id são obrigatórios' });
  }

  const db = getDb();
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  const duration = service.duration;

  // Get existing appointments for that day/professional
  const existing = db.prepare(`
    SELECT start_time, end_time FROM appointments
    WHERE date = ? AND professional_id = ? AND status NOT IN ('cancelled', 'no_show')
  `).all(date, professional_id);

  // Get blocked times
  const blocked = db.prepare(`
    SELECT start_time, end_time FROM blocked_times
    WHERE date = ? AND professional_id = ?
  `).all(date, professional_id);

  const busySlots = [...existing, ...blocked];

  // Generate slots from 07:00 to 20:00 in 30min intervals
  const slots = [];
  const startHour = 7;
  const endHour = 20;

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + duration;

      if (endMinutes > endHour * 60) break;

      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Check if slot is free
      const isBusy = busySlots.some(slot => {
        const slotStart = timeToMinutes(slot.start_time);
        const slotEnd = timeToMinutes(slot.end_time);
        return startMinutes < slotEnd && endMinutes > slotStart;
      });

      if (!isBusy) {
        slots.push({ start_time: startTime, end_time: endTime });
      }
    }
  }

  res.json({ slots, service });
});

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// POST /api/appointments
router.post('/', authenticateToken, (req, res) => {
  const { client_id, professional_id, service_id, date, start_time, notes, price, source, client_package_id } = req.body;

  if (!client_id || !professional_id || !service_id || !date || !start_time) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const db = getDb();
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
  if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

  const startMinutes = timeToMinutes(start_time);
  const endMinutes = startMinutes + service.duration;
  const endH = Math.floor(endMinutes / 60);
  const endM = endMinutes % 60;
  const end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  // Check for conflicts
  const conflict = db.prepare(`
    SELECT id FROM appointments
    WHERE date = ? AND professional_id = ? AND status NOT IN ('cancelled', 'no_show')
    AND start_time < ? AND end_time > ?
  `).get(date, professional_id, end_time, start_time);

  if (conflict) {
    return res.status(409).json({ error: 'Horário já ocupado para este profissional' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO appointments (id, client_id, professional_id, service_id, client_package_id, date, start_time, end_time, status, notes, price, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)
  `).run(id, client_id, professional_id, service_id, client_package_id || null, date, start_time, end_time, notes || null, price ?? service.price, source || 'admin');

  const appointment = db.prepare(`
    SELECT a.*,
      c.name as client_name,
      c.phone as client_phone,
      u.name as professional_name,
      u.color as professional_color,
      s.name as service_name,
      s.duration as service_duration
    FROM appointments a
    LEFT JOIN clients c ON a.client_id = c.id
    LEFT JOIN users u ON a.professional_id = u.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.id = ?
  `).get(id);

  res.status(201).json({ appointment });
});

// PUT /api/appointments/:id
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, notes, date, start_time, price } = req.body;

  const db = getDb();
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });

  let end_time = appointment.end_time;
  if (start_time && start_time !== appointment.start_time) {
    const service = db.prepare('SELECT duration FROM services WHERE id = ?').get(appointment.service_id);
    if (service) {
      const startMin = timeToMinutes(start_time);
      const endMin = startMin + service.duration;
      end_time = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
    }
  }

  db.prepare(`
    UPDATE appointments
    SET status=?, notes=?, date=?, start_time=?, end_time=?, price=?
    WHERE id=?
  `).run(
    status || appointment.status,
    notes !== undefined ? notes : appointment.notes,
    date || appointment.date,
    start_time || appointment.start_time,
    end_time,
    price !== undefined ? price : appointment.price,
    id
  );

  const updated = db.prepare(`
    SELECT a.*,
      c.name as client_name,
      c.phone as client_phone,
      u.name as professional_name,
      u.color as professional_color,
      s.name as service_name,
      s.duration as service_duration
    FROM appointments a
    LEFT JOIN clients c ON a.client_id = c.id
    LEFT JOIN users u ON a.professional_id = u.id
    LEFT JOIN services s ON a.service_id = s.id
    WHERE a.id = ?
  `).get(id);

  res.json({ appointment: updated });
});

// DELETE /api/appointments/:id
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const appointment = db.prepare('SELECT id FROM appointments WHERE id = ?').get(id);
  if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });

  db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ?").run(id);
  res.json({ message: 'Agendamento cancelado com sucesso' });
});

module.exports = router;
