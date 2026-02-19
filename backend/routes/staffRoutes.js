const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// In-memory store: id, name, role, email, passwordHash, salary
const staff = [
  { id: 1, name: 'Alice', role: 'Manager', email: 'alice@example.com', passwordHash: null, salary: 60000 },
  { id: 2, name: 'Bob', role: 'Employee', email: 'bob@example.com', passwordHash: null, salary: 40000 },
  { id: 3, name: 'Charlie', role: 'Employee', email: 'charlie@example.com', passwordHash: null, salary: 45000 },
];

// Set hashes on load (default password: password123)
const defaultPassword = 'password123';
staff.forEach((s) => {
  if (!s.passwordHash) s.passwordHash = bcrypt.hashSync(defaultPassword, 10);
});

function getStaffStore() {
  return staff;
}

function toPublic(staffMember) {
  const { passwordHash, ...rest } = staffMember;
  return rest;
}

function toPublicNoSalary(staffMember) {
  const { passwordHash, salary, ...rest } = staffMember;
  return rest;
}

// GET staff: Managers see name, role, email, salary; Employees see name, role, email only
router.get('/', (req, res) => {
  const isManager = req.user && req.user.role === 'Manager';
  res.json(staff.map((s) => (isManager ? toPublic(s) : toPublicNoSalary(s))));
});

// ADD staff (Managers only)
const { requireManager } = require('../middleware/auth');
router.post('/', requireManager, (req, res) => {
  const { name, role, email, password, salary } = req.body;
  if (!name || !role || !email || !password) {
    return res.status(400).json({ error: 'Name, role, email and password required' });
  }
  const existing = staff.find((s) => s.email && s.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email already in use' });
  }
  const newStaff = {
    id: staff.length + 1,
    name,
    role: role || 'Employee',
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    salary: salary != null ? Number(salary) : 0,
  };
  staff.push(newStaff);
  res.json(toPublic(newStaff));
});

module.exports = router;
module.exports.getStaffStore = getStaffStore;
