const mongoose = require('mongoose');

const allocationItemSchema = new mongoose.Schema(
  {
    assetClass: { type: String, required: true }, // e.g. 'equity', 'debt', 'gold', 'cash'
    instrument: { type: String }, // e.g. 'RELIANCE', 'NIFTYBEES'
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const portfolioSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    allocation: { type: [allocationItemSchema], default: [] },
    expectedReturn: { type: Number, required: true }, // annualized %, e.g. 11.5
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    confidence: { type: Number, required: true, min: 0, max: 100 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

portfolioSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Portfolio', portfolioSchema);
