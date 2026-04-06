const axios = require('axios');
const AuditLog = require('../models/AuditLog');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL;
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL;

exports.verifyDoctor = async (req, res, next) => {
  try {
    // Call doctor service internal endpoint to update verification
    const { data } = await axios.put(
      `${DOCTOR_SERVICE_URL}/api/doctors/internal/verify/${req.params.doctorId}`,
      { isVerified: true }
    );

    await AuditLog.create({
      eventType: 'doctor.verified',
      source: 'admin-service',
      data: { doctorId: req.params.doctorId, verifiedBy: req.user.userId },
    });

    res.json({ message: 'Doctor verified successfully', doctor: data });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const recentEvents = await AuditLog.find().sort({ createdAt: -1 }).limit(20);

    const eventCounts = await AuditLog.aggregate([
      { $group: { _id: '$eventType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalEvents: totalLogs,
      eventBreakdown: eventCounts,
      recentEvents,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { eventType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (eventType) filter.eventType = eventType;

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(filter);
    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
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
