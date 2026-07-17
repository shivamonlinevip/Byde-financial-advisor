const mongoose = require('mongoose');

const decisionHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agentName: { type: String, required: true, index: true },
    input: { type: mongoose.Schema.Types.Mixed },
    output: { type: mongoose.Schema.Types.Mixed },
    reasoning: { type: String },
    confidence: { type: Number, min: 0, max: 100 },
    durationMs: { type: Number },
    error: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

decisionHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('DecisionHistory', decisionHistorySchema);
