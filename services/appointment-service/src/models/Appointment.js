const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, index: true },
    patientName: { type: String, required: true },
    patientEmail: { type: String, required: true },
    doctorId: { type: String, required: true, index: true },
    doctorName: { type: String, required: true },
    doctorEmail: { type: String },
    specialization: { type: String },
    appointmentDate: { type: Date, required: true, index: true },
    timeSlot: { type: String, required: true }, // "09:00-09:30"
    type: {
      type: String,
      enum: ['in-person', 'video'],
      default: 'in-person',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
      default: 'pending',
    },
    reason: { type: String, required: true },
    notes: { type: String },
    consultationFee: { type: Number },
    videoConsultation: {
      videoLink: { type: String },
      uploadedBy: { type: String },
      uploadedAt: { type: Date },
    },
    cancelledBy: { type: String },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
