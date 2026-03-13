const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { requireManager } = require('../middleware/auth');
const Staff = require('../models/Staff');

const router = express.Router();

function toPublic(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { passwordHash, __v, ...rest } = obj;
  return { id: obj._id.toString(), ...rest };
}

function toPublicNoSalary(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { passwordHash, salary, __v, ...rest } = obj;
  return { id: obj._id.toString(), ...rest };
}

router.get('/', async (req, res) => {
  try {
    const isManager = req.user && req.user.role === 'Manager';
    const staff = await Staff.find({}).sort({ name: 1 }).lean();
    const list = staff.map((s) => {
      const id = s._id.toString();
      if (isManager) {
        return { id, name: s.name, email: s.email, role: s.role, salary: s.salary };
      }
      return { id, name: s.name, email: s.email, role: s.role };
    });
    res.json(list);
  } catch (err) {
    console.error('GET /staff error:', err);
    res.status(500).json({ error: 'Failed to load staff' });
  }
});

router.post('/', requireManager, async (req, res) => {
  try {
    const { name, role, email, password, salary } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password required' });
    }

    const existing = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const staff = new Staff({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role === 'Manager' ? 'Manager' : 'Employee',
      passwordHash,
      salary: salary != null ? Number(salary) : 0,
    });
    await staff.save();

    res.status(201).json(toPublic(staff));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('POST /staff error:', err);
    res.status(500).json({ error: 'Failed to add staff' });
  }
});

const Hours = require('../models/Hours');

router.delete('/:id', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid staff id' });
    }
    const staff = await Staff.findById(id);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    await Hours.deleteMany({ userId: id });
    await Staff.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /staff error:', err);
    res.status(500).json({ error: 'Failed to remove staff' });
  }
});

module.exports = router;
