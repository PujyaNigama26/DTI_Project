const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: { type: String },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  status: { type: String, default: 'Active' }
}, {
  timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;
