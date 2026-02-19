const express = require('express');
const { requireManager } = require('../middleware/auth');

// In-memory: id, staffId, date (YYYY-MM-DD), hours, notes, status: 'pending' | 'approved' | 'disapproved'
let hoursLog = [
  { id: 1, staffId: 1, date: '2025-02-01', hours: 8, notes: 'Full day', status: 'approved' },
  { id: 2, staffId: 2, date: '2025-02-01', hours: 7.5, notes: '', status: 'approved' },
  { id: 3, staffId: 1, date: '2025-02-02', hours: 8, notes: '', status: 'approved' },
];

let nextId = 4;

// Normalize entry so status is always present
function withStatus(entry) {
  return { ...entry, status: entry.status || 'pending' };
}

// Router for GET/POST /hours/me (mounted at /hours/me so routes are / and POST /)
const meRouter = express.Router();
meRouter.get('/', (req, res) => {
  const myId = Number(req.user?.id) || req.user?.id;
  if (myId == null || myId === '') {
    return res.status(401).json({ error: 'Login required' });
  }
  let list = hoursLog.filter((h) => Number(h.staffId) === Number(myId)).map(withStatus);
  const { from, to } = req.query;
  if (from) list = list.filter((h) => h.date >= from);
  if (to) list = list.filter((h) => h.date <= to);
  list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id - b.id);
  res.json(list);
});
meRouter.post('/', (req, res) => {
  const { date, hours, notes } = req.body;
  if (!date || hours == null) {
    return res.status(400).json({ error: 'date and hours required' });
  }
  const entry = {
    id: nextId++,
    staffId: req.user.id,
    date: String(date).slice(0, 10),
    hours: Number(hours),
    notes: notes || '',
    status: 'pending',
  };
  hoursLog.push(entry);
  res.json(entry);
});

// Router for /hours (GET, POST, PATCH)
const router = express.Router();
router.get('/', requireManager, (req, res) => {
  let list = hoursLog.map(withStatus);
  const { staffId, from, to, status } = req.query;
  if (staffId) list = list.filter((h) => Number(h.staffId) === Number(staffId));
  if (from) list = list.filter((h) => h.date >= from);
  if (to) list = list.filter((h) => h.date <= to);
  if (status) list = list.filter((h) => (h.status || 'pending') === status);
  list.sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.id - b.id);
  res.json(list);
});

// PATCH /hours/:id — set status to approved/disapproved (Managers only)
router.patch('/:id', requireManager, (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;
  if (status !== 'approved' && status !== 'disapproved') {
    return res.status(400).json({ error: 'status must be approved or disapproved' });
  }
  const entry = hoursLog.find((h) => h.id === id);
  if (!entry) return res.status(404).json({ error: 'Hours entry not found' });
  entry.status = status;
  res.json(entry);
});

// POST /hours — add hours for any staff (Managers only)
router.post('/', requireManager, (req, res) => {
  const { staffId, date, hours, notes } = req.body;
  if (staffId == null || !date || hours == null) {
    return res.status(400).json({ error: 'staffId, date and hours required' });
  }
  const entry = {
    id: nextId++,
    staffId: Number(staffId),
    date: String(date).slice(0, 10),
    hours: Number(hours),
    notes: notes || '',
    status: 'approved',
  };
  hoursLog.push(entry);
  res.json(entry);
});

module.exports = router;
module.exports.meRouter = meRouter;
