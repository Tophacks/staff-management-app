const express = require('express');
const mongoose = require('mongoose');
const { requireManager } = require('../middleware/auth');
const Shift = require('../models/Shift');
const Staff = require('../models/Staff');

const router = express.Router();

function toApi(doc, staffName) {
  const d = doc.toObject ? doc.toObject() : doc;
  const dateStr = d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date).slice(0, 10);
  const out = {
    id: d._id.toString(),
    staffId: d.userId.toString(),
    date: dateStr,
    startTime: d.startTime || '',
    endTime: d.endTime || '',
    title: d.title || '',
  };
  if (staffName != null) out.staffName = staffName;
  return out;
}

router.get('/', async (req, res) => {
  try {
    const isManager = req.user?.role === 'Manager';
    const query = {};

    if (!isManager) {
      query.userId = new mongoose.Types.ObjectId(req.user.id);
    } else if (req.query.staffId) {
      query.userId = new mongoose.Types.ObjectId(req.query.staffId);
    }

    const { from, to } = req.query;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const list = await Shift.find(query).sort({ date: 1, startTime: 1 }).lean();
    const staffIds = [...new Set(list.map((s) => s.userId.toString()))];
    const staff = await Staff.find({ _id: { $in: staffIds.map((id) => new mongoose.Types.ObjectId(id)) } }).lean();
    const nameById = {};
    staff.forEach((s) => { nameById[s._id.toString()] = s.name; });

    const result = list.map((s) => toApi(s, nameById[s.userId.toString()]));
    res.json(result);
  } catch (err) {
    console.error('GET /shifts error:', err);
    res.status(500).json({ error: 'Failed to load shifts' });
  }
});

router.post('/', requireManager, async (req, res) => {
  try {
    const { staffId, date, startTime, endTime, title } = req.body;
    if (!staffId || !date) {
      return res.status(400).json({ error: 'staffId and date required' });
    }
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ error: 'Invalid staffId' });
    }

    const shift = new Shift({
      userId: staffId,
      date: new Date(date),
      startTime: startTime || '',
      endTime: endTime || '',
      title: title || '',
    });
    await shift.save();

    const staff = await Staff.findById(staffId).lean();
    res.status(201).json(toApi(shift, staff?.name));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('POST /shifts error:', err);
    res.status(500).json({ error: 'Failed to create shift' });
  }
});

router.patch('/:id', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, title } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid shift id' });
    }

    const update = {};
    if (date != null) update.date = new Date(date);
    if (startTime != null) update.startTime = startTime;
    if (endTime != null) update.endTime = endTime;
    if (title != null) update.title = title;

    const shift = await Shift.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    const staff = await Staff.findById(shift.userId).lean();
    res.json(toApi(shift, staff?.name));
  } catch (err) {
    console.error('PATCH /shifts error:', err);
    res.status(500).json({ error: 'Failed to update shift' });
  }
});

router.delete('/:id', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid shift id' });
    }
    const shift = await Shift.findByIdAndDelete(id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /shifts error:', err);
    res.status(500).json({ error: 'Failed to delete shift' });
  }
});

module.exports = router;
