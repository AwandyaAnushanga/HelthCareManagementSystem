const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    diagnosis: { type: String, required: true },
    treatment: { type: String },
    prescription: { type: String },
    notes: { type: String },
    doctorId: { type: String, required: true },
    doctorName: { type: String },
    appointmentId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
