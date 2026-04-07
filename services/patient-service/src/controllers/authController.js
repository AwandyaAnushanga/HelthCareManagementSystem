const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const { publishEvent } = require('../config/rabbitmq');

const generateToken = (patient) => {
  return jwt.sign(
    { userId: patient._id, email: patient.email, role: 'patient' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h', issuer: 'healthcare-patient-service' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await Patient.findOne({ email: req.body.email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const patient = await Patient.create(req.body);
    const token = generateToken(patient);

    publishEvent('patient.registered', {
      patientId: patient._id,
      email: patient.email,
      name: `${patient.firstName} ${patient.lastName}`,
    });

    res.status(201).json({ token, patient });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const patient = await Patient.findOne({ email }).select('+password');
    if (!patient || !(await patient.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!patient.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    await patient.updateOne({ $set: { lastLogin: new Date() } });

    const token = generateToken(patient);
    res.json({ token, patient });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.user.userId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    res.json(patient);
  } catch (err) {
    next(err);
  }
};
