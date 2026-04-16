const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true }
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);
module.exports = Store;
