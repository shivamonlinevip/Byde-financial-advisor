const mongoose = require('mongoose');

const marketDataSchema = new mongoose.Schema(
  {
    stock: { type: String, required: true, uppercase: true, trim: true, index: true },
    price: { type: Number, required: true },
    PE: { type: Number },
    ROE: { type: Number },
    RevenueGrowth: { type: Number },
    Debt: { type: Number },
    MarketCap: { type: Number },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

marketDataSchema.index({ stock: 1, updatedAt: -1 });

module.exports = mongoose.model('MarketData', marketDataSchema);
