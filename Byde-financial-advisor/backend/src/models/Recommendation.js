const mongoose = require('mongoose');

const alternativeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    allocation: { type: mongoose.Schema.Types.Mixed },
    expectedReturn: { type: Number },
    riskScore: { type: Number },
    tradeoff: { type: String },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    portfolio: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    reason: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    alternatives: { type: [alternativeSchema], default: [] },
    rejectedReasons: { type: [String], default: [] },
    sources: { type: [String], default: [] },
    tradeoffs: { type: [String], default: [] },
    decisionTree: { type: mongoose.Schema.Types.Mixed },
    reasoningTimeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

recommendationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
