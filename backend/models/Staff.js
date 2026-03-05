const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, required: true, enum: ['Manager', 'Employee'], default: 'Employee' },
    passwordHash: { type: String, required: true, select: false },
    salary: { type: Number, default: 0 },
  },
  { timestamps: true }
);

staffSchema.index({ email: 1 });

module.exports = mongoose.model('Staff', staffSchema);
