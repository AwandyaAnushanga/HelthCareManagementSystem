const { validationResult } = require('express-validator');
const axios = require('axios');
const Appointment = require('../models/Appointment');
const { publishEvent } = require('../config/rabbitmq');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL;

exports.bookAppointment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify doctor availability via internal call
    const appointmentDate = new Date(req.body.appointmentDate);
    const dayOfWeek = appointmentDate.getDay();
    const time = req.body.timeSlot.split('-')[0];

    try {
      const { data } = await axios.get(
        `${DOCTOR_SERVICE_URL}/api/doctors/internal/check-availability`,
        { params: { doctorId: req.body.doctorId, dayOfWeek, time } }
      );
      if (!data.available) {
        return res.status(400).json({ error: 'Doctor is not available at this time', reason: data.reason });
      }
    } catch {
      return res.status(503).json({ error: 'Unable to verify doctor availability' });
    }

    // Check for conflicting appointments
    const conflict = await Appointment.findOne({
      doctorId: req.body.doctorId,
      appointmentDate: req.body.appointmentDate,
      timeSlot: req.body.timeSlot,
      status: { $in: ['pending', 'confirmed'] },
    });
    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const appointment = await Appointment.create({
      ...req.body,
      patientId: req.user.userId,
      patientName: req.user.name || 'Patient',
      patientEmail: req.user.email,
    });

    publishEvent('appointment.booked', {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      patientEmail: appointment.patientEmail,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      appointmentDate: appointment.appointmentDate,
      timeSlot: appointment.timeSlot,
      type: appointment.type,
    });

    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    // Verify the requester is the doctor or patient of this appointment
    const isDoctor = req.user.role === 'doctor' && appointment.doctorId === req.user.userId;
    const isPatient = req.user.role === 'patient' && appointment.patientId === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isDoctor && !isPatient && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized for this appointment' });
    }

    appointment.status = req.body.status;
    if (req.body.status === 'cancelled') {
      appointment.cancelledBy = req.user.role;
      appointment.cancellationReason = req.body.reason || '';
    }
    await appointment.save();

    publishEvent(`appointment.${req.body.status}`, {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      patientEmail: appointment.patientEmail,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      status: req.body.status,
    });

    res.json(appointment);
  } catch (err) {
    next(err);
  }
};

exports.addVideoLink = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    if (appointment.doctorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the assigned doctor can add video links' });
    }

    appointment.videoConsultation = {
      videoLink: req.body.videoLink,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
    };
    await appointment.save();

    publishEvent('video.link.added', {
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      patientEmail: appointment.patientEmail,
      doctorName: appointment.doctorName,
      videoLink: req.body.videoLink,
    });

    res.json(appointment);
  } catch (err) {
    next(err);
  }
};

exports.getPatientAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { patientId: req.user.userId };
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);
    res.json({
      appointments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getDoctorAppointments = async (req, res, next) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;
    const filter = { doctorId: req.user.userId };
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.appointmentDate = { $gte: start, $lt: end };
    }

    const appointments = await Appointment.find(filter)
      .sort({ appointmentDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);
    res.json({
      appointments,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    next(err);
  }
};
