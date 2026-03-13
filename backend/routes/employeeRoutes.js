const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const { requireManager } = require('../middleware/auth');
const { cloudinary, isCloudinaryConfigured } = require('../lib/cloudinary');
const { createNotification } = require('../lib/notifications');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
      cb(null, safeName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    }
    cb(null, true);
  },
});

function canAccessEmployee(req, employeeId) {
  return req.user?.role === 'Manager' || req.user?.id === employeeId;
}

function toEmployeeProfile(doc, viewerRole) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const documents = (obj.documents || []).map((document) => ({
    id: document._id.toString(),
    name: document.name,
    type: document.type || '',
    url: document.url,
    mimeType: document.mimeType,
    size: document.size,
    uploadedAt: document.uploadedAt,
  }));

  return {
    id: obj._id.toString(),
    personalInfo: {
      name: obj.name,
      email: obj.email,
      phone: obj.phone || '',
      address: obj.address || '',
      emergencyContact: {
        name: obj.emergencyContact?.name || '',
        phone: obj.emergencyContact?.phone || '',
        relationship: obj.emergencyContact?.relationship || '',
      },
    },
    jobInfo: {
      role: obj.role,
      department: obj.department || '',
      startDate: obj.startDate ? new Date(obj.startDate).toISOString().slice(0, 10) : '',
      salary: obj.salary ?? 0,
      employmentType: obj.employmentType || '',
    },
    documents,
    notes: viewerRole === 'Manager' ? obj.managerNotes || '' : '',
  };
}

async function loadEmployee(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: 'Invalid employee id' });
    return null;
  }
  if (!canAccessEmployee(req, id)) {
    res.status(403).json({ error: 'Not allowed to access this employee record' });
    return null;
  }

  const employee = await Staff.findById(id);
  if (!employee) {
    res.status(404).json({ error: 'Employee not found' });
    return null;
  }

  return employee;
}

router.get('/:id/profile', async (req, res) => {
  try {
    const employee = await loadEmployee(req, res);
    if (!employee) return;
    res.json(toEmployeeProfile(employee, req.user.role));
  } catch (err) {
    console.error('GET /api/employees/:id/profile error:', err);
    res.status(500).json({ error: 'Failed to load employee profile' });
  }
});

router.put('/:id/profile', async (req, res) => {
  try {
    const employee = await loadEmployee(req, res);
    if (!employee) return;

    const isManager = req.user.role === 'Manager';
    const { personalInfo = {}, jobInfo = {}, notes } = req.body || {};

    const update = {};

    if (personalInfo.name != null) update.name = String(personalInfo.name).trim();
    if (isManager && personalInfo.email != null) {
      const normalizedEmail = String(personalInfo.email).toLowerCase().trim();
      const existing = await Staff.findOne({ email: normalizedEmail, _id: { $ne: employee._id } }).lean();
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      update.email = normalizedEmail;
    }
    if (personalInfo.phone != null) update.phone = String(personalInfo.phone).trim();
    if (personalInfo.address != null) update.address = String(personalInfo.address).trim();
    if (personalInfo.emergencyContact) {
      update.emergencyContact = {
        name: String(personalInfo.emergencyContact.name || '').trim(),
        phone: String(personalInfo.emergencyContact.phone || '').trim(),
        relationship: String(personalInfo.emergencyContact.relationship || '').trim(),
      };
    }

    if (isManager) {
      if (jobInfo.role != null) update.role = jobInfo.role === 'Manager' ? 'Manager' : 'Employee';
      if (jobInfo.department != null) update.department = String(jobInfo.department).trim();
      if (jobInfo.startDate != null) update.startDate = jobInfo.startDate ? new Date(jobInfo.startDate) : null;
      if (jobInfo.salary != null) update.salary = Number(jobInfo.salary) || 0;
      if (jobInfo.employmentType != null) update.employmentType = String(jobInfo.employmentType);
      if (notes != null) update.managerNotes = String(notes);
    }

    Object.assign(employee, update);
    await employee.save();

    res.json(toEmployeeProfile(employee, req.user.role));
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('PUT /api/employees/:id/profile error:', err);
    res.status(500).json({ error: 'Failed to update employee profile' });
  }
});

router.post('/:id/documents', requireManager, upload.single('document'), async (req, res) => {
  try {
    const employee = await loadEmployee(req, res);
    if (!employee) return;
    if (!req.file) {
      return res.status(400).json({ error: 'Document file is required' });
    }
    if (!isCloudinaryConfigured) {
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: 'Cloudinary is not configured on the server' });
    }

    const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: 'staff-management/documents',
      resource_type: resourceType,
    });

    fs.unlink(req.file.path, () => {});

    employee.documents.push({
      name: req.body.name || req.file.originalname,
      type: req.body.type || '',
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    await employee.save();

    await createNotification({
      userId: employee._id.toString(),
      type: 'document-uploaded',
      title: 'New document uploaded',
      message: `${req.body.name || req.file.originalname} was added to your employee record.`,
      metadata: { employeeId: employee._id.toString() },
    });

    res.status(201).json(toEmployeeProfile(employee, req.user.role));
  } catch (err) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    console.error('POST /api/employees/:id/documents error:', err);
    const message = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
      ? 'File must be 10MB or smaller'
      : err.message === 'Only PDF, JPG, and PNG files are allowed'
        ? err.message
        : 'Failed to upload document';
    res.status(400).json({ error: message });
  }
});

router.get('/:id/documents', async (req, res) => {
  try {
    const employee = await loadEmployee(req, res);
    if (!employee) return;
    res.json({ documents: toEmployeeProfile(employee, req.user.role).documents });
  } catch (err) {
    console.error('GET /api/employees/:id/documents error:', err);
    res.status(500).json({ error: 'Failed to load employee documents' });
  }
});

router.delete('/:id/documents/:docId', requireManager, async (req, res) => {
  try {
    const employee = await loadEmployee(req, res);
    if (!employee) return;
    const document = employee.documents.id(req.params.docId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.publicId && isCloudinaryConfigured) {
      const resourceType = document.mimeType === 'application/pdf' ? 'raw' : 'image';
      await cloudinary.uploader.destroy(document.publicId, { resource_type: resourceType });
    }

    document.deleteOne();
    await employee.save();

    res.json(toEmployeeProfile(employee, req.user.role));
  } catch (err) {
    console.error('DELETE /api/employees/:id/documents/:docId error:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
