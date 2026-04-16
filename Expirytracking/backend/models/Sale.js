const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  productName: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  amount: { type: Number, required: true }
}, {
  timestamps: true
});

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;
