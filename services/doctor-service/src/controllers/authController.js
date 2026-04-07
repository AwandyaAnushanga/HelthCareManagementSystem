const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const { publishEvent } = require('../config/rabbitmq');

const generateToken = (doctor) => {
  return jwt.sign(
    { userId: doctor._id, email: doctor.email, role: 'doctor' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h', issuer: 'healthcare-doctor-service' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await Doctor.findOne({ email: req.body.email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const doctor = await Doctor.create(req.body);
    const token = generateToken(doctor);

    publishEvent('doctor.registered', {
      doctorId: doctor._id,
      email: doctor.email,
      name: `${doctor.firstName} ${doctor.lastName}`,
      specialization: doctor.specialization,
    });

    res.status(201).json({ token, doctor });
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
    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor || !(await doctor.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!doctor.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    await doctor.updateOne({ $set: { lastLogin: new Date() } });

    const token = generateToken(doctor);
    res.json({ token, doctor });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user.userId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (err) {
    next(err);
  }
};
