const mongoose = require('mongoose');

// ─── Medication Sub-schema ────────────────────────────
const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      maxlength: 200,
    },
    genericName: { type: String, trim: true, maxlength: 200 },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,       // e.g. "500mg", "10ml"
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: {
        values: [
          'once_daily',
          'twice_daily',
          'three_times_daily',
          'four_times_daily',
          'every_6_hours',
          'every_8_hours',
          'every_12_hours',
          'once_weekly',
          'as_needed',
          'before_meals',
          'after_meals',
          'at_bedtime',
          'custom',
        ],
        message: '{VALUE} is not a valid frequency',
      },
    },
    customFrequency: { type: String, maxlength: 200 }, // When frequency === 'custom'
    route: {
      type: String,
      enum: ['oral', 'topical', 'injection', 'inhalation', 'sublingual', 'rectal', 'intravenous', 'other'],
      default: 'oral',
    },
    duration: {
      value: { type: Number, required: true, min: 1 },
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'days',
      },
    },
    quantity: { type: Number, min: 1 },
    refills: { type: Number, default: 0, min: 0, max: 12 },
    instructions: { type: String, maxlength: 500 }, // Special instructions
    sideEffects: [{ type: String, trim: true }],
    isCritical: { type: Boolean, default: false }, // Flag for critical medications
  },
  { _id: true }
);

// ─── Main Prescription Schema ─────────────────────────
const prescriptionSchema = new mongoose.Schema(
  {
    // ─── Relationships ──────────────────────────────────
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
    medicalRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
      index: true,
    },

    // ─── Context ────────────────────────────────────────
    doctorName: { type: String, required: true },
    patientName: { type: String, required: true },
    specialization: { type: String },

    // ─── Prescription Number (auto-generated) ───────────
    prescriptionNumber: {
      type: String,
      unique: true,
      index: true,
    },

    // ─── Diagnosis Reference ────────────────────────────
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      maxlength: 500,
    },

    // ─── Medications ────────────────────────────────────
    medications: {
      type: [medicationSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one medication is required',
      },
    },

    // ─── Additional Instructions ────────────────────────
    generalInstructions: { type: String, maxlength: 1000 },
    dietaryAdvice: { type: String, maxlength: 500 },
    lifestyleRecommendations: { type: String, maxlength: 500 },
    warningsAndPrecautions: { type: String, maxlength: 500 },

    // ─── Validity ───────────────────────────────────────
    prescribedDate: { type: Date, default: Date.now, required: true },
    validUntil: {
      type: Date,
      required: [true, 'Prescription validity date is required'],
      validate: {
        validator: function (v) { return v > this.prescribedDate; },
        message: 'Valid-until date must be after prescribed date',
      },
    },

    // ─── Status Tracking ────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['active', 'completed', 'cancelled', 'expired'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    dispensedAt: { type: Date },
    dispensedBy: { type: String }, // Pharmacy name

    // ─── Follow-up ──────────────────────────────────────
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },
    followUpNotes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });
prescriptionSchema.index({ status: 1, validUntil: 1 });
prescriptionSchema.index({ prescriptionNumber: 1 }, { unique: true });

// ─── Auto-generate Prescription Number ────────────────
prescriptionSchema.pre('save', async function (next) {
  if (this.isNew && !this.prescriptionNumber) {
    const date = new Date();
    const prefix = `RX-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const count = await this.constructor.countDocuments({
      prescriptionNumber: new RegExp(`^${prefix}`),
    });
    this.prescriptionNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// ─── Auto-expire Prescriptions ────────────────────────
prescriptionSchema.statics.expireOldPrescriptions = async function () {
  return this.updateMany(
    { status: 'active', validUntil: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );
};

module.exports = mongoose.model('Prescription', prescriptionSchema);
