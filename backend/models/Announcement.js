const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ['company', 'department'],
      default: 'company',
    },
    departments: { type: [String], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  },
  { timestamps: true }
);

announcementSchema.index({ audience: 1, departments: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
