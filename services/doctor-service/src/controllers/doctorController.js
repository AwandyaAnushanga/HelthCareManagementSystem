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

// ─── Delete Availability for a Day ──────────────────────
exports.deleteAvailability = async (req, res, next) => {
  try {
    const result = await Availability.findOneAndDelete({
      doctorId: req.user.userId,
      dayOfWeek: parseInt(req.params.dayOfWeek),
    });

    if (!result) {
      return res.status(404).json({ error: 'No availability found for this day' });
    }

    publishEvent('availability.deleted', {
      doctorId: req.user.userId,
      dayOfWeek: parseInt(req.params.dayOfWeek),
    });
    res.json({ message: 'Availability removed' });
  } catch (err) {
    next(err);
  }
};

// ─── Add/Update Date-specific Override ──────────────────
exports.addOverride = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const overrideDate = new Date(req.body.date);
    const dayOfWeek = overrideDate.getDay();

    const availability = await Availability.findOne({
      doctorId: req.user.userId,
      dayOfWeek,
    });

    if (!availability) {
      return res.status(404).json({
        error: 'No base availability set for this day of the week. Set weekly availability first.',
      });
    }

    // Remove any existing override for the same date
    availability.overrides = availability.overrides.filter(
      (o) => o.date.toDateString() !== overrideDate.toDateString()
    );

    availability.overrides.push(req.body);
    await availability.save();

    res.json(availability);
  } catch (err) {
    next(err);
  }
};

// ─── Remove a Date Override ─────────────────────────────
exports.removeOverride = async (req, res, next) => {
  try {
    const result = await Availability.updateOne(
      { doctorId: req.user.userId },
      { $pull: { overrides: { _id: req.params.overrideId } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Override not found' });
    }

    res.json({ message: 'Override removed' });
  } catch (err) {
    next(err);
  }
};

// ─── Generate Slots for a Specific Date ─────────────────
exports.getSlots = async (req, res, next) => {
  try {
    const date = new Date(req.query.date);
    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: 'Valid date query parameter is required' });
    }

    const dayOfWeek = date.getDay();
    const availability = await Availability.findOne({
      doctorId: req.params.doctorId,
      dayOfWeek,
      isAvailable: true,
    });

    if (!availability) {
      return res.json({ slots: [], message: 'Doctor is not available on this day' });
    }

    const slots = availability.generateSlots(date);
    res.json({ date: date.toISOString().split('T')[0], slots });
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

    const doctor = await Doctor.findById(req.user.userId).select('+password');
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const isMatch = await doctor.comparePassword(req.body.currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    doctor.password = req.body.newPassword;
    await doctor.save();

    publishEvent('doctor.password_changed', { doctorId: doctor._id });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Internal: called by Appointment Service ─────────────
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

// ─── Internal: called by Admin Service to verify doctor ──
exports.verifyDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.doctorId,
      {
        isVerified: req.body.isVerified,
        verifiedAt: new Date(),
        verifiedBy: req.body.verifiedBy || 'admin',
      },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    publishEvent('doctor.verified', {
      doctorId: doctor._id,
      email: doctor.email,
      name: `${doctor.firstName} ${doctor.lastName}`,
    });

    res.json(doctor);
  } catch (err) {
    next(err);
  }
};
