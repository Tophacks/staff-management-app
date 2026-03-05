const mongoose = require('mongoose');

const hoursSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    date: { type: Date, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    totalHours: { type: Number, required: true },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'disapproved'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

hoursSchema.index({ userId: 1, date: -1 });
hoursSchema.index({ status: 1 });

module.exports = mongoose.model('Hours', hoursSchema);
