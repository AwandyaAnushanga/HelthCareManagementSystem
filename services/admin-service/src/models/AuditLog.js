const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    eventType: { type: String, required: true, index: true },
    source: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
