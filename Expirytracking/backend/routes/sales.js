const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

const gracePeriodMap = {
  'Dairy': 2,
  'Bakery': 2,
  'Produce': 1,
  'Meat': 0,
  'Beverages': 5,
  'Snacks': 5,
  'Medicines': 0
};

// Get all sales
router.get('/', async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const mapped = sales.map(s => ({
      ...s._doc,
      id: s._id.toString()
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Record a new sale with FIFO deduction from batches
router.post('/', async (req, res) => {
  try {
    const { productName, quantity } = req.body;
    
    // Find product
    const product = await Product.findOne({ name: productName, userId: req.user._id });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let remainingToDeduct = quantity;
    let saleAmount = 0;

    const graceDays = (product.gracePeriodDays !== undefined && product.gracePeriodDays > 0) 
                         ? product.gracePeriodDays 
                         : (gracePeriodMap[product.category] || 0);
                         
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (product.batches && product.batches.length > 0) {
      // We need to count valid stock first
      let validStock = 0;
      product.batches.forEach(b => {
          if (b.quantity <= 0) return;
          const expDate = new Date(b.expiryDate);
          const diffTime = expDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
          const isExpired = daysLeft < 0 ? (Math.abs(daysLeft) > graceDays) : (daysLeft === 0 && graceDays === 0);
          if (!isExpired) {
             validStock += b.quantity;
          }
      });

      if (validStock < quantity) {
          return res.status(400).json({ message: 'Insufficient valid inventory (Some stock is fully expired)' });
      }

      // Sort batches by earliest expiry Date (FIFO)
      product.batches.sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      for (let i = 0; i < product.batches.length; i++) {
        if (remainingToDeduct <= 0) break;
        
        let batch = product.batches[i];
        if (batch.quantity <= 0) continue;

        const expDate = new Date(batch.expiryDate);
        const diffTime = expDate - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
        const isExpired = daysLeft < 0 ? (Math.abs(daysLeft) > graceDays) : (daysLeft === 0 && graceDays === 0);
        const isInGracePeriod = daysLeft < 0 ? (Math.abs(daysLeft) <= graceDays) : (daysLeft === 0 && graceDays > 0);
        
        if (isExpired) continue;

        const deduct = Math.min(batch.quantity, remainingToDeduct);
        batch.quantity -= deduct;
        remainingToDeduct -= deduct;
        
        if (isInGracePeriod) {
           saleAmount += (deduct * batch.unitCostPrice); // grace period: 0 profit
        } else {
           saleAmount += (deduct * batch.unitSellingPrice);
        }
      }
    } else {
      // Legacy fallback
      if (product.quantity < quantity) {
        return res.status(400).json({ message: 'Insufficient inventory quantity' });
      }
      product.quantity -= remainingToDeduct;
      saleAmount += (quantity * product.price);
    }

    // Create the sale
    const sale = new Sale({
      userId: req.user._id,
      productName,
      productId: product._id,
      quantity,
      amount: saleAmount
    });
    
    await sale.save();
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
