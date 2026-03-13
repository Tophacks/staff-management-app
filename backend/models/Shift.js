const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    title: { type: String, default: '' },
  },
  { timestamps: true }
);

shiftSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Shift', shiftSchema);
