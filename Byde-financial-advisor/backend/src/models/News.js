const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema(
  {
    headline: { type: String, required: true },
    summary: { type: String },
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      required: true,
    },
    source: { type: String },
    url: { type: String },
    publishedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

newsSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('News', newsSchema);
