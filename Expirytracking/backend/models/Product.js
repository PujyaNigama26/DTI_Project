const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: { type: String, default: () => Math.random().toString(36).substr(2, 9) },
  quantity: { type: Number, required: true, min: 0 },
  unitCostPrice: { type: Number, required: true },
  unitSellingPrice: { type: Number, required: true },
  expiryDate: { type: String, required: true },
  purchaseDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

const productSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true },
  category: { type: String, required: true },
  supplier: { type: String, required: true },
  gracePeriodDays: { type: Number, default: 0 },
  batches: [batchSchema],
  // Legacy fields (kept for backward compatibility, will be ignored/migrated)
  quantity: { type: Number },
  expiryDate: { type: String },
  price: { type: Number },
  costPrice: { type: Number }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
