const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, default: '', trim: true },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, required: true, enum: ['Manager', 'Employee'], default: 'Employee' },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    emergencyContact: {
      name: { type: String, default: '', trim: true },
      phone: { type: String, default: '', trim: true },
      relationship: { type: String, default: '', trim: true },
    },
    department: { type: String, default: '', trim: true },
    startDate: { type: Date, default: null },
    salary: { type: Number, default: 0 },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', ''],
      default: '',
    },
    documents: { type: [documentSchema], default: [] },
    managerNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
