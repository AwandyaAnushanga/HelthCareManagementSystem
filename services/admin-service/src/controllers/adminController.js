const { validationResult } = require('express-validator');
const axios = require('axios');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL;
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL;
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL;

// ═══════════════════════════════════════════════════════
//  DOCTOR MANAGEMENT
// ═══════════════════════════════════════════════════════

exports.verifyDoctor = async (req, res, next) => {
  try {
    const { data } = await axios.put(
      `${DOCTOR_SERVICE_URL}/api/doctors/internal/verify/${req.params.doctorId}`,
      { isVerified: true, verifiedBy: req.user.userId }
    );

    await AuditLog.logEvent({
      eventType: 'doctor.verified',
      category: 'user_management',
      source: 'admin-service',
      actor: { userId: req.user.userId, role: 'admin', email: req.user.email },
      target: { entityType: 'doctor', entityId: req.params.doctorId },
    });

    res.json({ message: 'Doctor verified successfully', doctor: data });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    next(err);
  }
};

exports.rejectDoctor = async (req, res, next) => {
  try {
    const { data } = await axios.put(
      `${DOCTOR_SERVICE_URL}/api/doctors/internal/verify/${req.params.doctorId}`,
      { isVerified: false, verifiedBy: req.user.userId }
    );

    await AuditLog.logEvent({
      eventType: 'doctor.rejected',
      category: 'user_management',
      severity: 'warning',
      source: 'admin-service',
      actor: { userId: req.user.userId, role: 'admin', email: req.user.email },
      target: { entityType: 'doctor', entityId: req.params.doctorId },
      data: { reason: req.body.reason },
    });

    res.json({ message: 'Doctor verification rejected', doctor: data });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    next(err);
  }
};

exports.getDoctors = async (req, res, next) => {
  try {
    const { data } = await axios.get(`${DOCTOR_SERVICE_URL}/api/doctors`, {
      params: req.query,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const { data } = await axios.get(`${PATIENT_SERVICE_URL}/api/patients/internal/all`, {
      params: req.query,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════
//  ADMIN MANAGEMENT
// ═══════════════════════════════════════════════════════

exports.getAllAdmins = async (req, res, next) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const admins = await Admin.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Admin.countDocuments(filter);

    res.json({
      admins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateAdmin = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const targetAdmin = await Admin.findById(req.params.id);
    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Only super_admin can change roles or modify other super_admins
    if (targetAdmin.role === 'super_admin' && req.user.adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can modify super admin accounts' });
    }
    if (req.body.role === 'super_admin' && req.user.adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can grant super admin role' });
    }

    // Strip fields that should not be updated via this endpoint
    const { password, email, loginAttempts, lockUntil, ...updateData } = req.body;

    const updated = await Admin.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await AuditLog.logEvent({
      eventType: 'admin.updated',
      category: 'user_management',
      source: 'admin-service',
      actor: { userId: req.user.userId, role: 'admin', email: req.user.email },
      target: { entityType: 'admin', entityId: req.params.id },
      data: { updatedFields: Object.keys(updateData) },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.deactivateAdmin = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const targetAdmin = await Admin.findById(req.params.id);
    if (!targetAdmin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (targetAdmin.role === 'super_admin' && req.user.adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can deactivate super admin accounts' });
    }

    targetAdmin.isActive = false;
    await targetAdmin.save();

    await AuditLog.logEvent({
      eventType: 'admin.deactivated',
      category: 'user_management',
      severity: 'warning',
      source: 'admin-service',
      actor: { userId: req.user.userId, role: 'admin', email: req.user.email },
      target: { entityType: 'admin', entityId: req.params.id },
    });

    res.json({ message: 'Admin account deactivated' });
  } catch (err) {
    next(err);
  }
};

exports.reactivateAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { isActive: true, loginAttempts: 0, $unset: { lockUntil: 1 } },
      { new: true }
    );
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    await AuditLog.logEvent({
      eventType: 'admin.reactivated',
      category: 'user_management',
      source: 'admin-service',
      actor: { userId: req.user.userId, role: 'admin', email: req.user.email },
      target: { entityType: 'admin', entityId: req.params.id },
    });

    res.json({ message: 'Admin account reactivated', admin });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════
//  ANALYTICS & AUDIT
// ═══════════════════════════════════════════════════════

exports.getAnalytics = async (req, res, next) => {
  try {
    // Fetch counts from other services in parallel
    const [auditStats, appointmentStats] = await Promise.allSettled([
      AuditLog.aggregate([
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      axios.get(`${APPOINTMENT_SERVICE_URL}/api/appointments/stats`, {
        headers: { Authorization: req.headers.authorization },
      }).then((r) => r.data),
    ]);

    const totalLogs = await AuditLog.countDocuments();
    const recentEvents = await AuditLog.find().sort({ createdAt: -1 }).limit(20);

    res.json({
      totalAuditEvents: totalLogs,
      eventBreakdown: auditStats.status === 'fulfilled' ? auditStats.value : [],
      appointmentStats: appointmentStats.status === 'fulfilled' ? appointmentStats.value : null,
      recentEvents,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { eventType, category, severity, source, startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (category) filter.category = category;
    if (severity) filter.severity = severity;
    if (source) filter.source = source;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAuditStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await AuditLog.getStats(start, end);

    const severityCounts = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: start, $lte: end } } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    res.json({ period: { start, end }, stats, severityCounts });
  } catch (err) {
    next(err);
  }
};
