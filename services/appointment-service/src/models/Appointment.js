const mongoose = require('mongoose');

// ─── Status History Sub-schema ────────────────────────
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
      required: true,
    },
    changedBy: { type: String, required: true },    // userId
    changedByRole: { type: String },                 // patient/doctor/admin
    reason: { type: String, maxlength: 500 },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────
const appointmentSchema = new mongoose.Schema(
  {
    // ─── Appointment Number (auto-generated) ────────
    appointmentNumber: {
      type: String,
      unique: true,
      index: true,
    },

    // ─── Patient Info (denormalized for performance) ─
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
    },
    patientEmail: {
      type: String,
      required: [true, 'Patient email is required'],
    },
    patientPhone: { type: String },

    // ─── Doctor Info (denormalized for performance) ──
    doctorId: {
      type: String,
      required: [true, 'Doctor ID is required'],
      index: true,
    },
    doctorName: {
      type: String,
      required: [true, 'Doctor name is required'],
    },
    doctorEmail: { type: String },
    specialization: { type: String },

    // ─── Scheduling ─────────────────────────────────
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
      validate: {
        validator: function (v) {
          // Only validate on creation
          if (!this.isNew) return true;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return v >= today;
        },
        message: 'Appointment date cannot be in the past',
      },
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      match: [/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Format must be HH:MM-HH:MM'],
    },
    duration: { type: Number, default: 30, min: 10, max: 120 }, // minutes

    // ─── Appointment Type ───────────────────────────
    type: {
      type: String,
      enum: {
        values: ['in-person', 'video'],
        message: '{VALUE} is not a valid appointment type',
      },
      default: 'in-person',
    },

    // ─── Status ─────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
    },
    statusHistory: [statusHistorySchema],

    // ─── Clinical Context ───────────────────────────
    reason: {
      type: String,
      required: [true, 'Reason for visit is required'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    symptoms: [{ type: String, trim: true }],
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'emergency'],
      default: 'normal',
    },

    // ─── Notes ──────────────────────────────────────
    patientNotes: { type: String, maxlength: 1000 },   // Patient adds before visit
    doctorNotes: { type: String, maxlength: 2000 },    // Doctor fills during/after
    prescriptionId: { type: String },                   // Cross-ref to prescription
    medicalRecordId: { type: String },                  // Cross-ref to medical record

    // ─── Billing ────────────────────────────────────
    consultationFee: { type: Number, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'waived'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'insurance', 'online'],
    },

    // ─── Video Consultation ─────────────────────────
    videoConsultation: {
      videoLink: { type: String },
      uploadedBy: { type: String },
      uploadedAt: { type: Date },
      platform: {
        type: String,
        enum: ['google_drive', 'youtube', 'custom'],
        default: 'google_drive',
      },
    },

    // ─── Cancellation / Reschedule ──────────────────
    cancelledBy: { type: String },
    cancellationReason: { type: String, maxlength: 500 },
    rescheduledFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    rescheduledTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },

    // ─── Reminders ──────────────────────────────────
    reminderSent: {
      twentyFourHour: { type: Boolean, default: false },
      oneHour: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, timeSlot: 1, status: 1 }); // Conflict check
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentNumber: 1 }, { unique: true });
appointmentSchema.index({ paymentStatus: 1 });

// ─── Virtual: Is Upcoming ─────────────────────────────
appointmentSchema.virtual('isUpcoming').get(function () {
  return this.appointmentDate > new Date() && ['pending', 'confirmed'].includes(this.status);
});

// ─── Auto-generate Appointment Number ─────────────────
appointmentSchema.pre('save', async function (next) {
  if (this.isNew && !this.appointmentNumber) {
    const date = new Date();
    const prefix = `APT-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await this.constructor.countDocuments({
      appointmentNumber: new RegExp(`^${prefix}`),
    });
    this.appointmentNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }

  // Track status changes
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      changedBy: this._statusChangedBy || 'system',
      changedByRole: this._statusChangedByRole || 'system',
      reason: this._statusChangeReason || '',
    });
  }

  next();
});

// ─── Static: Find Conflicts ───────────────────────────
appointmentSchema.statics.findConflicts = function (doctorId, appointmentDate, timeSlot) {
  return this.findOne({
    doctorId,
    appointmentDate,
    timeSlot,
    status: { $in: ['pending', 'confirmed', 'in-progress'] },
  });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
