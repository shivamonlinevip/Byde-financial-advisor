const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    riskProfile: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate',
    },
    investmentGoal: {
      type: String,
      enum: ['retirement', 'wealth_growth', 'education', 'home_purchase', 'short_term_gains', 'other'],
      default: 'wealth_growth',
    },
    investmentAmount: { type: Number, default: 0, min: 0 },
    investmentDuration: { type: Number, default: 1, min: 0 }, // in years
    refreshTokens: { type: [String], default: [], select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toProfileJSON = function toProfileJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    riskProfile: this.riskProfile,
    investmentGoal: this.investmentGoal,
    investmentAmount: this.investmentAmount,
    investmentDuration: this.investmentDuration,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
