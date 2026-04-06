const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6, // 0=Sunday, 6=Saturday
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "17:00"
    slotDuration: { type: Number, default: 30 }, // minutes
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
