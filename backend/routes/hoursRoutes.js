const express = require('express');
const mongoose = require('mongoose');
const { requireManager } = require('../middleware/auth');
const Hours = require('../models/Hours');
const Staff = require('../models/Staff');
const { createNotification } = require('../lib/notifications');
const { sendEmail } = require('../lib/email');

const router = express.Router();

function toApi(doc) {
  const d = doc.toObject ? doc.toObject() : doc;
  const dateStr = d.date instanceof Date ? d.date.toISOString().slice(0, 10) : String(d.date).slice(0, 10);
  return {
    id: d._id.toString(),
    staffId: d.userId.toString(),
    date: dateStr,
    hours: d.totalHours,
    notes: d.notes || '',
    status: d.status || 'pending',
  };
}

const meRouter = express.Router();

meRouter.get('/', async (req, res) => {
  try {
    const myId = req.user?.id;
    if (!myId) {
      return res.status(401).json({ error: 'Login required' });
    }

    const query = { userId: new mongoose.Types.ObjectId(myId) };
    const { from, to } = req.query;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const list = await Hours.find(query).sort({ date: -1, _id: 1 }).lean();
    res.json(list.map(toApi));
  } catch (err) {
    console.error('GET /hours/me error:', err);
    res.status(500).json({ error: 'Failed to load hours' });
  }
});

meRouter.post('/', async (req, res) => {
  try {
    const { date, hours, notes } = req.body;
    if (!date || hours == null) {
      return res.status(400).json({ error: 'date and hours required' });
    }

    const userId = req.user.id;
    const totalHours = Number(hours);
    if (isNaN(totalHours) || totalHours < 0) {
      return res.status(400).json({ error: 'hours must be a non-negative number' });
    }

    const entry = new Hours({
      userId,
      date: new Date(date),
      totalHours,
      notes: notes || '',
      status: 'pending',
    });
    await entry.save();

    res.status(201).json(toApi(entry));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('POST /hours/me error:', err);
    res.status(500).json({ error: 'Failed to log hours' });
  }
});

router.get('/', requireManager, async (req, res) => {
  try {
    const { staffId, from, to, status } = req.query;
    const query = {};

    if (staffId) query.userId = new mongoose.Types.ObjectId(staffId);
    if (from && to) query.date = { $gte: new Date(from), $lte: new Date(to) };
    else if (from) query.date = { $gte: new Date(from) };
    else if (to) query.date = { $lte: new Date(to) };
    if (status) query.status = status;

    const list = await Hours.find(query).sort({ date: -1, _id: 1 }).lean();
    res.json(list.map((d) => toApi(d)));
  } catch (err) {
    console.error('GET /hours error:', err);
    res.status(500).json({ error: 'Failed to load hours' });
  }
});

router.patch('/:id', requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 'approved' && status !== 'disapproved') {
      return res.status(400).json({ error: 'status must be approved or disapproved' });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ error: 'Hours entry not found' });
    }

    const entry = await Hours.findByIdAndUpdate(id, { status }, { new: true });
    if (!entry) {
      return res.status(404).json({ error: 'Hours entry not found' });
    }

    const employee = await Staff.findById(entry.userId).lean();
    if (employee) {
      const verb = status === 'approved' ? 'approved' : 'disapproved';
      await createNotification({
        userId: employee._id.toString(),
        type: 'hours-status',
        title: `Hours ${verb}`,
        message: `Your hours for ${toApi(entry).date} were ${verb}.`,
        metadata: { hoursId: entry._id.toString(), status },
      });
      await sendEmail({
        to: employee.email,
        subject: `Your hours were ${verb}`,
        html: `
          <p>Hello ${employee.name},</p>
          <p>Your submitted hours for <strong>${toApi(entry).date}</strong> were <strong>${verb}</strong>.</p>
          <p>Status: ${status}</p>
        `,
      });
    }

    res.json(toApi(entry));
  } catch (err) {
    console.error('PATCH /hours/:id error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/', requireManager, async (req, res) => {
  try {
    const { staffId, date, hours, notes } = req.body;
    if (staffId == null || !date || hours == null) {
      return res.status(400).json({ error: 'staffId, date and hours required' });
    }

    if (!mongoose.isValidObjectId(staffId)) {
      return res.status(400).json({ error: 'Invalid staffId' });
    }

    const totalHours = Number(hours);
    if (isNaN(totalHours) || totalHours < 0) {
      return res.status(400).json({ error: 'hours must be a non-negative number' });
    }

    const entry = new Hours({
      userId: staffId,
      date: new Date(date),
      totalHours,
      notes: notes || '',
      status: 'approved',
    });
    await entry.save();

    res.status(201).json(toApi(entry));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('POST /hours error:', err);
    res.status(500).json({ error: 'Failed to add hours' });
  }
});

module.exports = router;
module.exports.meRouter = meRouter;
