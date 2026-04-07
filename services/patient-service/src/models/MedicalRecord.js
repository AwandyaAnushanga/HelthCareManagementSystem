const mongoose = require('mongoose');

// ─── Sub-schemas ──────────────────────────────────────
const vitalSignsSchema = new mongoose.Schema(
  {
    bloodPressure: {
      systolic: { type: Number, min: 50, max: 300 },
      diastolic: { type: Number, min: 30, max: 200 },
    },
    heartRate: { type: Number, min: 20, max: 250 },       // bpm
    temperature: { type: Number, min: 30, max: 45 },      // Celsius
    respiratoryRate: { type: Number, min: 5, max: 60 },   // breaths/min
    oxygenSaturation: { type: Number, min: 50, max: 100 }, // SpO2 %
    weight: { type: Number, min: 0.5, max: 500 },         // kg
    height: { type: Number, min: 20, max: 300 },          // cm
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['lab_report', 'imaging', 'prescription', 'referral', 'other'],
      default: 'other',
    },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

// ─── Main Schema ──────────────────────────────────────
const medicalRecordSchema = new mongoose.Schema(
  {
    // ─── Relationships (stored as strings for cross-service) ─
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required'],
      index: true,
    },
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    appointmentId: {
      type: String,
      index: true,
    },

    // ─── Context ────────────────────────────────────────
    doctorName: { type: String, required: true },
    specialization: { type: String },
    visitType: {
      type: String,
      enum: ['initial', 'follow-up', 'emergency', 'routine-checkup', 'specialist-referral'],
      default: 'initial',
    },

    // ─── Clinical Data ──────────────────────────────────
    chiefComplaint: {
      type: String,
      required: [true, 'Chief complaint is required'],
      maxlength: 500,
    },
    presentIllness: { type: String, maxlength: 2000 },
    diagnosis: [{
      code: { type: String },       // ICD-10 code
      description: { type: String, required: true },
      type: {
        type: String,
        enum: ['primary', 'secondary', 'differential'],
        default: 'primary',
      },
    }],
    vitalSigns: vitalSignsSchema,

    // ─── Treatment ──────────────────────────────────────
    treatment: {
      type: String,
      maxlength: 2000,
    },
    procedures: [{
      name: { type: String, required: true },
      notes: { type: String },
      performedAt: { type: Date, default: Date.now },
    }],

    // ─── Outcome ────────────────────────────────────────
    followUpDate: { type: Date },
    followUpNotes: { type: String, maxlength: 1000 },
    referredTo: {
      doctorId: { type: String },
      doctorName: { type: String },
      specialization: { type: String },
      reason: { type: String },
    },

    // ─── Attachments ────────────────────────────────────
    attachments: [attachmentSchema],

    // ─── Notes ──────────────────────────────────────────
    notes: { type: String, maxlength: 3000 },
    internalNotes: { type: String, maxlength: 2000 }, // Doctor-only notes, not visible to patient

    // ─── Record Status ──────────────────────────────────
    status: {
      type: String,
      enum: ['draft', 'finalized', 'amended'],
      default: 'draft',
    },
    finalizedAt: { type: Date },
    amendedAt: { type: Date },
    amendmentReason: { type: String },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────
medicalRecordSchema.index({ patientId: 1, createdAt: -1 });
medicalRecordSchema.index({ doctorId: 1, createdAt: -1 });
medicalRecordSchema.index({ appointmentId: 1 }, { sparse: true });
medicalRecordSchema.index({ 'diagnosis.code': 1 }, { sparse: true });
medicalRecordSchema.index({ status: 1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
