const mongoose = require('mongoose');

const wasteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  productName: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  batchId: { type: String, required: true },
  quantity: { type: Number, required: true },
  lossAmount: { type: Number, required: true },
  dateLogged: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Waste', wasteSchema);
