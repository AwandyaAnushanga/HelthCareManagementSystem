const mongoose = require('mongoose');

const notificationTemplateSchema = new mongoose.Schema(
  {
    // ─── Identity ───────────────────────────────────
    name: {
      type: String,
      required: [true, 'Template name is required'],
      unique: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'appointment_booked',
        'appointment_confirmed',
        'appointment_cancelled',
        'appointment_reminder',
        'video_link_added',
        'prescription_issued',
        'doctor_verified',
        'welcome_patient',
        'welcome_doctor',
        'password_reset',
        'general',
      ],
      unique: true,
    },

    // ─── Content ────────────────────────────────────
    subject: {
      type: String,
      required: [true, 'Email subject is required'],
      maxlength: 200,
    },
    htmlBody: {
      type: String,
      required: [true, 'HTML body is required'],
    },
    textBody: { type: String }, // Plain text fallback

    // ─── Template Variables ─────────────────────────
    // Documents which {{variables}} are available
    variables: [{
      name: { type: String, required: true },      // e.g. "patientName"
      description: { type: String },                 // e.g. "Patient's full name"
      required: { type: Boolean, default: false },
    }],

    // ─── State ──────────────────────────────────────
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ─── Index ────────────────────────────────────────────
notificationTemplateSchema.index({ type: 1 }, { unique: true });
notificationTemplateSchema.index({ isActive: 1, type: 1 });

// ─── Method: Render Template ──────────────────────────
notificationTemplateSchema.methods.render = function (variables = {}) {
  let html = this.htmlBody;
  let text = this.textBody || '';
  let subject = this.subject;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(placeholder, value || '');
    text = text.replace(placeholder, value || '');
    subject = subject.replace(placeholder, value || '');
  }

  return { subject, html, text };
};

module.exports = mongoose.model('NotificationTemplate', notificationTemplateSchema);
