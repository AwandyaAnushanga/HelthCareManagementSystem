const { validationResult } = require('express-validator');
const Prescription = require('../models/Prescription');
const { publishEvent } = require('../config/rabbitmq');

// ─── Doctor creates a prescription ──────────────────────
exports.createPrescription = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prescription = await Prescription.create({
      ...req.body,
      doctorId: req.user.userId,
    });

    publishEvent('prescription.issued', {
      prescriptionId: prescription._id,
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      doctorName: prescription.doctorName,
    });

    res.status(201).json(prescription);
  } catch (err) {
    next(err);
  }
};

// ─── Get prescription by ID ─────────────────────────────
exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const isPatient = prescription.patientId.toString() === req.user.userId;
    const isDoctor = prescription.doctorId === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this prescription' });
    }

    res.json(prescription);
  } catch (err) {
    next(err);
  }
};

// ─── Patient views their prescriptions (paginated) ──────
exports.getPatientPrescriptions = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { patientId: req.user.userId };
    if (status) filter.status = status;

    const prescriptions = await Prescription.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(filter);

    res.json({
      prescriptions,
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

// ─── Doctor views prescriptions they issued ──────────────
exports.getDoctorPrescriptions = async (req, res, next) => {
  try {
    const { patientId, status, page = 1, limit = 10 } = req.query;
    const filter = { doctorId: req.user.userId };
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const prescriptions = await Prescription.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(filter);

    res.json({
      prescriptions,
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

// ─── Doctor updates prescription (status, dispensing) ────
exports.updatePrescription = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.doctorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the prescribing doctor can update this prescription' });
    }

    if (prescription.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot update a cancelled prescription' });
    }

    // Track dispensing
    if (req.body.dispensedBy && !prescription.dispensedAt) {
      req.body.dispensedAt = new Date();
    }

    Object.assign(prescription, req.body);
    await prescription.save();

    publishEvent('prescription.updated', {
      prescriptionId: prescription._id,
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: prescription.patientId,
      status: prescription.status,
    });

    res.json(prescription);
  } catch (err) {
    next(err);
  }
};

// ─── Cancel a prescription ──────────────────────────────
exports.cancelPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    if (prescription.doctorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the prescribing doctor can cancel this prescription' });
    }

    if (prescription.status !== 'active') {
      return res.status(400).json({ error: 'Only active prescriptions can be cancelled' });
    }

    prescription.status = 'cancelled';
    await prescription.save();

    publishEvent('prescription.cancelled', {
      prescriptionId: prescription._id,
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
    });

    res.json(prescription);
  } catch (err) {
    next(err);
  }
};
