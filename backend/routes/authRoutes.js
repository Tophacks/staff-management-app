const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Staff store is in staffRoutes - we need access. For simplicity we'll require it as a fn
const getStaffStore = () => {
  const staffRoutes = require('./staffRoutes');
  return staffRoutes.getStaffStore ? staffRoutes.getStaffStore() : [];
};

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const staff = getStaffStore();
  const user = staff.find((s) => s.email && s.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

module.exports = router;
