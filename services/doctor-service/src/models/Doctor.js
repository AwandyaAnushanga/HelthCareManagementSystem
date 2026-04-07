const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Sub-schemas ──────────────────────────────────────
const qualificationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    year: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear(),
    },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
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
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[\d\s-]{7,15}$/, 'Please provide a valid phone number'],
    },

    // ─── Professional Info ──────────────────────────
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
      index: true,
    },
    subSpecializations: [{ type: String, trim: true }],
    qualifications: {
      type: [qualificationSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one qualification is required',
      },
    },
    licenseNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, 'Experience cannot be negative'],
      max: [70, 'Experience seems unrealistic'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    languages: {
      type: [String],
      default: ['English'],
    },

    // ─── Profile ────────────────────────────────────
    bio: { type: String, maxlength: [1000, 'Bio cannot exceed 1000 characters'] },
    profileImage: { type: String },
    address: {
      clinic: { type: String, trim: true },
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },

    // ─── Ratings ────────────────────────────────────
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },

    // ─── Account State ──────────────────────────────
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: String }, // Admin ID who verified
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
doctorSchema.index({ email: 1 }, { unique: true });
doctorSchema.index({ specialization: 1, isVerified: 1, isActive: 1 });
doctorSchema.index({ 'rating.average': -1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ 'address.city': 1 });
doctorSchema.index({ isVerified: 1, isActive: 1, createdAt: -1 });

// ─── Virtual: Full Name ───────────────────────────────
doctorSchema.virtual('fullName').get(function () {
  return `Dr. ${this.firstName} ${this.lastName}`;
});

// ─── Text Index for Search ────────────────────────────
doctorSchema.index(
  { firstName: 'text', lastName: 'text', specialization: 'text', bio: 'text' },
  { weights: { specialization: 10, firstName: 5, lastName: 5, bio: 1 } }
);

// ─── Pre-save: Hash Password ──────────────────────────
doctorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Method: Compare Password ─────────────────────────
doctorSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Method: Strip Sensitive Fields ───────────────────
doctorSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Doctor', doctorSchema);
