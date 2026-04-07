const mongoose = require('mongoose');

// ─── Delivery Attempt Sub-schema ──────────────────────
const deliveryAttemptSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['email', 'in-app'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
    },
    attemptedAt: { type: Date, default: Date.now },
    errorMessage: { type: String },
  },
  { _id: false }
);

const notificationSchema = new mongoose.Schema(
  {
    // ─── Recipient ──────────────────────────────────
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    userRole: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      required: true,
    },
    email: { type: String }, // Cached for email delivery

    // ─── Notification Type ──────────────────────────
    type: {
      type: String,
      enum: {
        values: [
          // Appointment lifecycle
          'appointment_booked',
          'appointment_confirmed',
          'appointment_cancelled',
          'appointment_completed',
          'appointment_rescheduled',
          'appointment_reminder',
          // Video
          'video_link_added',
          // Medical
          'prescription_issued',
          'medical_record_created',
          // Admin
          'doctor_verified',
          'account_deactivated',
          // System
          'welcome',
          'password_reset',
          'general',
        ],
        message: '{VALUE} is not a valid notification type',
      },
      required: true,
      index: true,
    },

    // ─── Content ────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Title is required'],
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      maxlength: 1000,
    },
    htmlContent: { type: String }, // Rich HTML for email

    // ─── Associated Data ────────────────────────────
    data: {
      appointmentId: { type: String },
      doctorId: { type: String },
      doctorName: { type: String },
      patientId: { type: String },
      patientName: { type: String },
      videoLink: { type: String },
      prescriptionId: { type: String },
      actionUrl: { type: String }, // Deep link in frontend
      extra: { type: mongoose.Schema.Types.Mixed },
    },

    // ─── Delivery ───────────────────────────────────
    channel: {
      type: String,
      enum: ['email', 'in-app', 'both'],
      default: 'both',
    },
    deliveryAttempts: [deliveryAttemptSchema],

    // ─── State ──────────────────────────────────────
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    isArchived: { type: Boolean, default: false },

    // ─── Priority ───────────────────────────────────
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },

    // ─── Scheduling ─────────────────────────────────
    scheduledFor: { type: Date }, // For scheduled notifications (reminders)
    sentAt: { type: Date },

    // ─── Expiry ─────────────────────────────────────
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 }); // Main query pattern
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isArchived: 1, createdAt: -1 });
notificationSchema.index({ scheduledFor: 1, sentAt: 1 });           // Scheduled delivery
notificationSchema.index({ priority: 1, createdAt: -1 });

// ─── TTL: Auto-delete archived notifications after 90 days ─
notificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { isArchived: true } }
);

// ─── Pre-save: Set Read Timestamp ─────────────────────
notificationSchema.pre('save', function (next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// ─── Static: Get Unread Count ─────────────────────────
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ userId, isRead: false, isArchived: false });
};

// ─── Static: Create and Deliver ───────────────────────
notificationSchema.statics.createNotification = async function ({
  userId, userRole, email, type, title, message,
  htmlContent, data = {}, channel = 'both', priority = 'normal',
}) {
  return this.create({
    userId, userRole, email, type, title, message,
    htmlContent, data, channel, priority,
    sentAt: new Date(),
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
