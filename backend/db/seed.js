const bcrypt = require('bcryptjs');
const Staff = require('../models/Staff');
const Hours = require('../models/Hours');

const defaultPassword = 'password123';

async function seed() {
  const count = await Staff.countDocuments();
  if (count > 0) return;

  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  const staff = await Staff.insertMany([
    { name: 'Alice', email: 'alice@example.com', role: 'Manager', passwordHash, salary: 60000 },
    { name: 'Bob', email: 'bob@example.com', role: 'Employee', passwordHash, salary: 40000 },
    { name: 'Charlie', email: 'charlie@example.com', role: 'Employee', passwordHash, salary: 45000 },
  ]);

  await Hours.insertMany([
    { userId: staff[0]._id, date: new Date('2025-02-01'), totalHours: 8, notes: 'Full day', status: 'approved' },
    { userId: staff[1]._id, date: new Date('2025-02-01'), totalHours: 7.5, notes: '', status: 'approved' },
    { userId: staff[0]._id, date: new Date('2025-02-02'), totalHours: 8, notes: '', status: 'approved' },
  ]);

  console.log('Database seeded with initial staff and hours');
}

module.exports = { seed };
