const mongoose = require('mongoose');
const Notification = require('../models/Notification');

function toNotification(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    userId: obj.userId.toString(),
    type: obj.type,
    title: obj.title,
    message: obj.message,
    read: Boolean(obj.read),
    metadata: obj.metadata || {},
    createdAt: obj.createdAt,
  };
}

async function createNotification({ userId, type, title, message, metadata = {} }) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const notification = await Notification.create({ userId, type, title, message, metadata });
  return notification;
}

async function createNotificationsForUsers(userIds, payload) {
  const validUserIds = [...new Set(userIds.filter((id) => mongoose.Types.ObjectId.isValid(id)).map(String))];
  if (!validUserIds.length) return [];

  const docs = await Notification.insertMany(
    validUserIds.map((userId) => ({
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      metadata: payload.metadata || {},
    }))
  );

  return docs;
}

module.exports = { Notification, toNotification, createNotification, createNotificationsForUsers };
