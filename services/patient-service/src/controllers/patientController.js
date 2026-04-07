const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const MedicalRecord = require('../models/MedicalRecord');
const { publishEvent } = require('../config/rabbitmq');

exports.getProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.user.userId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password, email, ...updateData } = req.body;
    const patient = await Patient.findByIdAndUpdate(req.user.userId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    publishEvent('patient.updated', { patientId: patient._id });
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

exports.getMedicalHistory = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ patientId: req.user.userId }).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    next(err);
  }
};

// ─── Password Change ────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patient = await Patient.findById(req.user.userId).select('+password');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const isMatch = await patient.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    patient.password = req.body.newPassword;
    await patient.save();

    publishEvent('patient.password_changed', { patientId: patient._id });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Deactivate Own Account ─────────────────────────────
exports.deactivateAccount = async (req, res, next) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.user.userId,
      { isActive: false },
      { new: true }
    );
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    publishEvent('patient.deactivated', { patientId: patient._id });
    res.json({ message: 'Account deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Internal endpoints — called by other services ──────
exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    next(err);
  }
};

exports.getAllPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const patients = await Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments(filter);

    res.json({
      patients,
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
