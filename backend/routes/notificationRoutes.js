const express = require('express');
const mongoose = require('mongoose');
const { Notification, toNotification } = require('../lib/notifications');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json(list.map(toNotification));
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(toNotification(notification));
  } catch (err) {
    console.error('PUT /api/notifications/:id/read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;
