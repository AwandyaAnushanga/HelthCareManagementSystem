const mongoose = require('mongoose');

// ─── Override Sub-schema (specific date blocks) ───────
const overrideSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    isAvailable: { type: Boolean, default: false },
    reason: { type: String, trim: true, maxlength: 200 }, // "Conference", "Holiday"
    startTime: { type: String }, // Override time if partially available
    endTime: { type: String },
  },
  { _id: true }
);

const availabilitySchema = new mongoose.Schema(
  {
    // ─── Relationship ───────────────────────────────
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
      index: true,
    },

    // ─── Weekly Schedule ────────────────────────────
    dayOfWeek: {
      type: Number,
      required: [true, 'Day of week is required'],
      min: [0, 'Day must be 0 (Sunday) to 6 (Saturday)'],
      max: [6, 'Day must be 0 (Sunday) to 6 (Saturday)'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^\d{2}:\d{2}$/, 'Time format must be HH:MM'],
      validate: {
        validator: function (v) {
          const [h, m] = v.split(':').map(Number);
          return h >= 0 && h <= 23 && m >= 0 && m <= 59;
        },
        message: 'Invalid time value',
      },
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^\d{2}:\d{2}$/, 'Time format must be HH:MM'],
      validate: {
        validator: function (v) {
          if (!this.startTime) return true;
          return v > this.startTime;
        },
        message: 'End time must be after start time',
      },
    },

    // ─── Slot Configuration ─────────────────────────
    slotDuration: {
      type: Number,
      default: 30,
      min: [10, 'Minimum slot is 10 minutes'],
      max: [120, 'Maximum slot is 120 minutes'],
    },
    breakBetweenSlots: {
      type: Number,
      default: 0,
      min: 0,
      max: 30, // Buffer minutes between appointments
    },
    maxPatientsPerSlot: {
      type: Number,
      default: 1,
      min: 1,
      max: 5, // For group consultations
    },

    // ─── State ──────────────────────────────────────
    isAvailable: { type: Boolean, default: true },

    // ─── Date-specific Overrides ────────────────────
    overrides: [overrideSchema],
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────
availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });
availabilitySchema.index({ doctorId: 1, isAvailable: 1 });

// ─── Method: Generate Time Slots for a Given Date ─────
availabilitySchema.methods.generateSlots = function (date) {
  // Check for date-specific override
  const override = this.overrides.find(
    (o) => o.date.toDateString() === new Date(date).toDateString()
  );
  if (override && !override.isAvailable) return [];

  const start = override?.startTime || this.startTime;
  const end = override?.endTime || this.endTime;

  const slots = [];
  let [h, m] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  while (h * 60 + m + this.slotDuration <= endH * 60 + endM) {
    const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    m += this.slotDuration;
    if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
    const slotEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    slots.push({ start: slotStart, end: slotEnd });
    m += this.breakBetweenSlots;
    if (m >= 60) { h += Math.floor(m / 60); m %= 60; }
  }

  return slots;
};

module.exports = mongoose.model('Availability', availabilitySchema);
