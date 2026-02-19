const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'staff-app-secret-change-in-production';

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Login required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireManager(req, res, next) {
  if (req.user?.role !== 'Manager') {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
}

module.exports = { auth, requireManager, JWT_SECRET };
