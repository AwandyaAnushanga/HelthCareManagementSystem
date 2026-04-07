const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const { publishEvent } = require('../config/rabbitmq');

const generateToken = (admin) => {
  return jwt.sign(
    {
      userId: admin._id,
      email: admin.email,
      role: 'admin',
      adminRole: admin.role,
      permissions: admin.permissions,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h', issuer: 'healthcare-admin-service' }
  );
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password +loginAttempts +lockUntil');

    // Check lockout before anything else
    if (admin && admin.isLocked) {
      return res.status(423).json({
        error: 'Account temporarily locked due to too many failed login attempts',
        lockedUntil: admin.lockUntil,
      });
    }

    if (!admin || !(await admin.comparePassword(password))) {
      // Increment failed attempts if account exists
      if (admin) {
        await admin.incrementLoginAttempts();

        publishEvent('admin.login_failed', {
          adminId: admin._id,
          email: admin.email,
          timestamp: new Date().toISOString(),
        });
      }
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Reset login attempts on successful login and update lastLogin
    await admin.updateOne({
      $set: { loginAttempts: 0, lastLogin: new Date() },
      $unset: { lockUntil: 1 },
    });

    const token = generateToken(admin);

    publishEvent('admin.login_success', {
      adminId: admin._id,
      email: admin.email,
      timestamp: new Date().toISOString(),
    });

    res.json({ token, admin });
  } catch (err) {
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Only super_admin can create other admins
    if (req.user.adminRole !== 'super_admin' && req.body.role === 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create super admin accounts' });
    }

    const existing = await Admin.findOne({ email: req.body.email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const admin = await Admin.create(req.body);

    publishEvent('admin.created', {
      adminId: admin._id,
      createdBy: req.user.userId,
      role: admin.role,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(admin);
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.user.userId);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json(admin);
  } catch (err) {
    next(err);
  }
};
