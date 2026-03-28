const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    const mapped = sales.map(s => ({
      ...s._doc,
      id: s._id.toString()
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record a new sale
router.post('/', async (req, res) => {
  try {
    const { productName, quantity } = req.body;
    
    // Find product to get price and reduce stock
    const product = await Product.findOne({ name: productName });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient inventory quantity' });
    }

    const amount = product.price * quantity;

    // Create the sale
    const sale = new Sale({
      productName,
      productId: product._id,
      quantity,
      amount
    });
    
    await sale.save();

    // Reduce inventory
    product.quantity -= quantity;
    await product.save();

    res.status(201).json({
      ...sale._doc,
      id: sale._id.toString()
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
