const { validationResult } = require('express-validator');
const MedicalRecord = require('../models/MedicalRecord');
const { publishEvent } = require('../config/rabbitmq');

// ─── Doctor creates a medical record after a visit ──────
exports.createRecord = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = await MedicalRecord.create({
      ...req.body,
      doctorId: req.user.userId,
    });

    publishEvent('medical_record.created', {
      recordId: record._id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      appointmentId: record.appointmentId,
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
};

// ─── Get a single record by ID ──────────────────────────
exports.getRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Patients can only see their own records, doctors can see records they authored
    const isOwner = record.patientId.toString() === req.user.userId;
    const isAuthor = record.doctorId === req.user.userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this record' });
    }

    // Strip internal notes from patient view
    if (req.user.role === 'patient') {
      const sanitized = record.toObject();
      delete sanitized.internalNotes;
      return res.json(sanitized);
    }

    res.json(record);
  } catch (err) {
    next(err);
  }
};

// ─── Doctor updates a record (draft → finalized, or amend) ─
exports.updateRecord = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Only the authoring doctor can update
    if (record.doctorId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the authoring doctor can update this record' });
    }

    // Handle status transitions
    if (req.body.status === 'finalized') {
      req.body.finalizedAt = new Date();
    }
    if (req.body.status === 'amended') {
      if (record.status !== 'finalized') {
        return res.status(400).json({ error: 'Only finalized records can be amended' });
      }
      req.body.amendedAt = new Date();
    }

    Object.assign(record, req.body);
    await record.save();

    publishEvent('medical_record.updated', {
      recordId: record._id,
      patientId: record.patientId,
      doctorId: record.doctorId,
      status: record.status,
    });

    res.json(record);
  } catch (err) {
    next(err);
  }
};

// ─── Patient views their own medical history (paginated) ─
exports.getPatientRecords = async (req, res, next) => {
  try {
    const { visitType, status, page = 1, limit = 10 } = req.query;
    const filter = { patientId: req.user.userId };
    if (visitType) filter.visitType = visitType;
    if (status) filter.status = status;

    const records = await MedicalRecord.find(filter)
      .select('-internalNotes')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MedicalRecord.countDocuments(filter);

    res.json({
      records,
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

// ─── Doctor views records they authored ──────────────────
exports.getDoctorRecords = async (req, res, next) => {
  try {
    const { patientId, status, page = 1, limit = 10 } = req.query;
    const filter = { doctorId: req.user.userId };
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const records = await MedicalRecord.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await MedicalRecord.countDocuments(filter);

    res.json({
      records,
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

// ─── Get records by appointment (internal) ───────────────
exports.getRecordsByAppointment = async (req, res, next) => {
  try {
    const records = await MedicalRecord.find({ appointmentId: req.params.appointmentId });
    res.json(records);
  } catch (err) {
    next(err);
  }
};
