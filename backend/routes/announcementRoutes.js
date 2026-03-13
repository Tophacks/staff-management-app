const express = require('express');
const Announcement = require('../models/Announcement');
const Staff = require('../models/Staff');
const { requireManager } = require('../middleware/auth');
const { createNotificationsForUsers } = require('../lib/notifications');
const { sendEmail } = require('../lib/email');

const router = express.Router();

function toAnnouncement(doc, authorName) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
    title: obj.title,
    message: obj.message,
    audience: obj.audience,
    departments: obj.departments || [],
    createdBy: obj.createdBy?.toString ? obj.createdBy.toString() : String(obj.createdBy),
    createdByName: authorName || '',
    createdAt: obj.createdAt,
  };
}

async function getVisibleAnnouncementsForUser(userId) {
  const currentUser = await Staff.findById(userId).lean();
  if (!currentUser) return [];
  const department = currentUser.department || '';
  const query = {
    $or: [
      { audience: 'company' },
      { audience: 'department', departments: department },
    ],
  };
  return Announcement.find(query).sort({ createdAt: -1 }).lean();
}

router.post('/', requireManager, async (req, res) => {
  try {
    const { title, message, audience = 'company', departments = [] } = req.body || {};
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }
    if (audience !== 'company' && audience !== 'department') {
      return res.status(400).json({ error: 'audience must be company or department' });
    }

    const cleanedDepartments = Array.isArray(departments)
      ? departments.map((department) => String(department).trim()).filter(Boolean)
      : [];

    if (audience === 'department' && !cleanedDepartments.length) {
      return res.status(400).json({ error: 'At least one department is required for team announcements' });
    }

    const announcement = await Announcement.create({
      title: String(title).trim(),
      message: String(message).trim(),
      audience,
      departments: audience === 'department' ? cleanedDepartments : [],
      createdBy: req.user.id,
    });

    const staffQuery = audience === 'company'
      ? {}
      : { department: { $in: cleanedDepartments } };
    const recipients = await Staff.find(staffQuery).lean();

    await createNotificationsForUsers(
      recipients.map((staff) => staff._id.toString()),
      {
        type: 'announcement',
        title: `Announcement: ${announcement.title}`,
        message: announcement.message,
        metadata: {
          announcementId: announcement._id.toString(),
          audience: announcement.audience,
        },
      }
    );

    await Promise.allSettled(
      recipients.map((staff) =>
        sendEmail({
          to: staff.email,
          subject: `New announcement: ${announcement.title}`,
          html: `
            <p>Hello ${staff.name},</p>
            <p>A new announcement has been posted in the staff management app.</p>
            <p><strong>${announcement.title}</strong></p>
            <p>${announcement.message.replace(/\n/g, '<br />')}</p>
          `,
        })
      )
    );

    const author = await Staff.findById(req.user.id).lean();
    res.status(201).json(toAnnouncement(announcement, author?.name || 'Manager'));
  } catch (err) {
    console.error('POST /api/announcements error:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

router.get('/', async (req, res) => {
  try {
    const announcements = await getVisibleAnnouncementsForUser(req.user.id);
    const authorIds = [...new Set(announcements.map((announcement) => String(announcement.createdBy)))];
    const authors = await Staff.find({ _id: { $in: authorIds } }).lean();
    const authorNames = Object.fromEntries(authors.map((author) => [author._id.toString(), author.name]));

    res.json(announcements.map((announcement) => toAnnouncement(announcement, authorNames[String(announcement.createdBy)])));
  } catch (err) {
    console.error('GET /api/announcements error:', err);
    res.status(500).json({ error: 'Failed to load announcements' });
  }
});

module.exports = router;
