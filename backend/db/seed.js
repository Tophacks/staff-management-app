const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');
const Hours = require('../models/Hours');

const defaultPassword = 'password123';

async function seed() {
  const count = await Staff.countDocuments();
  if (count > 0) return;

  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const staff = await Staff.insertMany([
    {
      name: 'Alice',
      email: 'alice@example.com',
      role: 'Manager',
      passwordHash,
      phone: '555-0101',
      address: '100 Main St',
      emergencyContact: { name: 'Eve', phone: '555-0199', relationship: 'Spouse' },
      department: 'Operations',
      startDate: new Date('2024-01-15'),
      salary: 60000,
      employmentType: 'Full-time',
      managerNotes: 'Primary manager account.',
    },
    {
      name: 'Bob',
      email: 'bob@example.com',
      role: 'Employee',
      passwordHash,
      phone: '555-0102',
      address: '200 Oak Ave',
      emergencyContact: { name: 'Sam', phone: '555-0188', relationship: 'Parent' },
      department: 'Sales',
      startDate: new Date('2024-03-01'),
      salary: 40000,
      employmentType: 'Full-time',
    },
    {
      name: 'Charlie',
      email: 'charlie@example.com',
      role: 'Employee',
      passwordHash,
      phone: '555-0103',
      address: '300 Pine Rd',
      emergencyContact: { name: 'Taylor', phone: '555-0177', relationship: 'Sibling' },
      department: 'Support',
      startDate: new Date('2024-05-20'),
      salary: 45000,
      employmentType: 'Part-time',
    },
  ]);

  await Hours.insertMany([
    { userId: staff[0]._id, date: new Date('2025-02-01'), totalHours: 8, notes: 'Full day', status: 'approved' },
    { userId: staff[1]._id, date: new Date('2025-02-01'), totalHours: 7.5, notes: '', status: 'approved' },
    { userId: staff[0]._id, date: new Date('2025-02-02'), totalHours: 8, notes: '', status: 'approved' },
  ]);

  console.log('Database seeded with initial staff and hours');
}

module.exports = { seed };
