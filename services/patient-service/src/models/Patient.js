const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const patientSchema = new mongoose.Schema(
  {
    // ─── Identity ───────────────────────────────────
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
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
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned in queries by default
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[\d\s-]{7,15}$/, 'Please provide a valid phone number'],
    },

    // ─── Demographics ───────────────────────────────
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: (v) => v < new Date(),
        message: 'Date of birth must be in the past',
      },
    },
    gender: {
      type: String,
      enum: { values: ['male', 'female', 'other'], message: '{VALUE} is not a valid gender' },
      required: [true, 'Gender is required'],
    },
    bloodGroup: {
      type: String,
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        message: '{VALUE} is not a valid blood group',
      },
    },

    // ─── Address ────────────────────────────────────
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      zipCode: { type: String, trim: true, maxlength: 20 },
      country: { type: String, trim: true, maxlength: 100, default: 'Sri Lanka' },
    },

    // ─── Emergency Contact ──────────────────────────
    emergencyContact: {
      name: { type: String, trim: true, maxlength: 100 },
      phone: { type: String, match: [/^\+?[\d\s-]{7,15}$/, 'Invalid emergency phone'] },
      relationship: { type: String, trim: true, maxlength: 50 },
    },

    // ─── Medical Profile ────────────────────────────
    allergies: [{ type: String, trim: true }],
    chronicConditions: [{ type: String, trim: true }],
    currentMedications: [{ type: String, trim: true }],
    insuranceInfo: {
      provider: { type: String, trim: true },
      policyNumber: { type: String, trim: true },
      expiryDate: { type: Date },
    },

    // ─── Account State ──────────────────────────────
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────
patientSchema.index({ email: 1 }, { unique: true });
patientSchema.index({ phone: 1 });
patientSchema.index({ 'address.city': 1 });
patientSchema.index({ isActive: 1, createdAt: -1 });

// ─── Virtual: Full Name ───────────────────────────────
patientSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ─── Virtual: Age ─────────────────────────────────────
patientSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
});

// ─── Pre-save: Hash Password ──────────────────────────
patientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Method: Compare Password ─────────────────────────
patientSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: Strip Sensitive Fields ───────────────────
patientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Patient', patientSchema);
