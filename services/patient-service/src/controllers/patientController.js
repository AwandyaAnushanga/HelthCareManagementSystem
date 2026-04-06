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

// Internal endpoint — called by other services
exports.getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    next(err);
  }
};
