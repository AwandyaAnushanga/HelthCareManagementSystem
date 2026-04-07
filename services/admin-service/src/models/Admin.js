const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    // ─── Identity ───────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Admin password must be at least 8 characters'],
      select: false,
    },
    phone: {
      type: String,
      match: [/^\+?[\d\s-]{7,15}$/, 'Invalid phone number'],
    },

    // ─── Permissions ────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ['super_admin', 'admin', 'moderator'],
        message: '{VALUE} is not a valid admin role',
      },
      default: 'admin',
    },
    permissions: {
      managePatients: { type: Boolean, default: true },
      manageDoctors: { type: Boolean, default: true },
      verifyDoctors: { type: Boolean, default: true },
      manageAppointments: { type: Boolean, default: true },
      viewAnalytics: { type: Boolean, default: true },
      manageAdmins: { type: Boolean, default: false }, // Only super_admin
      manageSettings: { type: Boolean, default: false },
    },

    // ─── Account State ──────────────────────────────
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────
adminSchema.index({ email: 1 }, { unique: true });
adminSchema.index({ role: 1, isActive: 1 });

// ─── Virtual: Full Name ───────────────────────────────
adminSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Virtual: Is Locked ───────────────────────────────
adminSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─── Pre-save: Hash Password ──────────────────────────
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 14); // Higher rounds for admin
  next();
});

// ─── Pre-save: Set Super Admin Permissions ────────────
adminSchema.pre('save', function (next) {
  if (this.role === 'super_admin') {
    this.permissions = {
      managePatients: true,
      manageDoctors: true,
      verifyDoctors: true,
      manageAppointments: true,
      viewAnalytics: true,
      manageAdmins: true,
      manageSettings: true,
    };
  }
  next();
});

// ─── Method: Compare Password ─────────────────────────
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: Increment Login Attempts ─────────────────
adminSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 30 * 60 * 1000; // 30 minutes

  // Reset if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  return this.updateOne(updates);
};

// ─── Method: Strip Sensitive Fields ───────────────────
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Admin', adminSchema);
