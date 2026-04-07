const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    // ─── Event Classification ───────────────────────
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      index: true,
    },
    category: {
      type: String,
      enum: [
        'authentication',   // login, logout, register
        'appointment',      // book, confirm, cancel, complete
        'user_management',  // verify, deactivate, update
        'medical',          // record created, prescription issued
        'notification',     // sent, failed
        'system',           // config change, error
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
      index: true,
    },

    // ─── Source ─────────────────────────────────────
    source: {
      type: String,
      required: [true, 'Source service is required'],
      enum: ['patient-service', 'doctor-service', 'appointment-service', 'admin-service', 'notification-service', 'gateway'],
    },

    // ─── Actor ──────────────────────────────────────
    actor: {
      userId: { type: String },
      role: { type: String, enum: ['patient', 'doctor', 'admin', 'system'] },
      email: { type: String },
      ipAddress: { type: String },
    },

    // ─── Target ─────────────────────────────────────
    target: {
      entityType: { type: String }, // 'patient', 'doctor', 'appointment'
      entityId: { type: String },
      description: { type: String },
    },

    // ─── Event Data ─────────────────────────────────
    data: { type: mongoose.Schema.Types.Mixed },
    previousState: { type: mongoose.Schema.Types.Mixed }, // For update/delete events
    newState: { type: mongoose.Schema.Types.Mixed },

    // ─── Metadata ───────────────────────────────────
    timestamp: { type: Date, default: Date.now, index: true },
    requestId: { type: String }, // Correlation ID for distributed tracing
  },
  {
    timestamps: true,
    // TTL: Auto-delete logs after 1 year
    expireAfterSeconds: 365 * 24 * 60 * 60,
  }
);

// ─── Indexes ──────────────────────────────────────────
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ 'target.entityType': 1, 'target.entityId': 1 });
auditLogSchema.index({ category: 1, severity: 1, timestamp: -1 });
auditLogSchema.index({ source: 1, timestamp: -1 });

// ─── TTL Index (auto-delete after 365 days) ───────────
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// ─── Static: Log Event (convenience) ──────────────────
auditLogSchema.statics.logEvent = function ({
  eventType, category, severity = 'info', source,
  actor = {}, target = {}, data = {},
}) {
  return this.create({
    eventType, category, severity, source,
    actor, target, data, timestamp: new Date(),
  });
};

// ─── Static: Get Aggregated Stats ─────────────────────
auditLogSchema.statics.getStats = function (startDate, endDate) {
  return this.aggregate([
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { category: '$category', eventType: '$eventType' },
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
