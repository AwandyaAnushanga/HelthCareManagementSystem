const { validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const Availability = require('../models/Availability');
const { publishEvent } = require('../config/rabbitmq');

exports.getProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user.userId);
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { password, email, isVerified, ...updateData } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(req.user.userId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
};

exports.getAllDoctors = async (req, res, next) => {
  try {
    const { specialization, page = 1, limit = 10 } = req.query;
    const filter = { isVerified: true, isActive: true };
    if (specialization) filter.specialization = new RegExp(specialization, 'i');

    const doctors = await Doctor.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Doctor.countDocuments(filter);

    res.json({
      doctors,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password');
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    next(err);
  }
};

exports.setAvailability = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const availability = await Availability.findOneAndUpdate(
      { doctorId: req.user.userId, dayOfWeek: req.body.dayOfWeek },
      { ...req.body, doctorId: req.user.userId },
      { new: true, upsert: true, runValidators: true }
    );

    publishEvent('availability.updated', { doctorId: req.user.userId, dayOfWeek: req.body.dayOfWeek });
    res.json(availability);
  } catch (err) {
    next(err);
  }
};

exports.getAvailability = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId || req.user.userId;
    const slots = await Availability.find({ doctorId, isAvailable: true });
    res.json(slots);
  } catch (err) {
    next(err);
  }
};

// Internal endpoint — called by Appointment Service
exports.checkSlotAvailability = async (req, res, next) => {
  try {
    const { doctorId, dayOfWeek, time } = req.query;
    const slot = await Availability.findOne({
      doctorId,
      dayOfWeek: parseInt(dayOfWeek),
      isAvailable: true,
    });

    if (!slot) {
      return res.json({ available: false, reason: 'No availability set for this day' });
    }

    const available = time >= slot.startTime && time < slot.endTime;
    res.json({ available, slot });
  } catch (err) {
    next(err);
  }
};
