const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Waste = require('../models/Waste');

const gracePeriodMap = {
  'Dairy': 2,
  'Bakery': 2,
  'Produce': 1,
  'Meat': 0,
  'Beverages': 5,
  'Snacks': 5,
  'Medicines': 0
};

const getGracePeriod = (p) => {
  if (p.gracePeriodDays !== undefined && p.gracePeriodDays !== null && p.gracePeriodDays > 0) return p.gracePeriodDays;
  return gracePeriodMap[p.category] !== undefined ? gracePeriodMap[p.category] : 0;
};

// Migration helper for backwards compatibility
const ensureBatches = (p) => {
  let batches = p.batches || [];
  
  if (batches.length === 0 && p.quantity !== undefined && p.price !== undefined) {
    batches = [{
      batchId: p._id.toString().substring(0, 6) + '-leg',
      quantity: p.quantity,
      unitCostPrice: p.costPrice || (p.price * 0.5),
      unitSellingPrice: p.price,
      expiryDate: p.expiryDate,
      purchaseDate: p.createdAt ? p.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    }];
  }

  const graceDays = getGracePeriod(p);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse each batch to compute expiry states
  batches = batches.map(b => {
    let plainB = b._doc ? b._doc : b;
    const expDate = new Date(plainB.expiryDate);
    const diffTime = expDate - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
    
    let isExpired = false;
    let isInGracePeriod = false;
    let statusLabel = 'Safe';
    
    if (daysLeft < 0) {
        // Exceeded normal expiry, check grace period
        if (Math.abs(daysLeft) <= graceDays && graceDays > 0) {
            isInGracePeriod = true;
            statusLabel = 'Grace Period';
        } else {
            isExpired = true;
            statusLabel = 'Expired';
        }
    } else if (daysLeft === 0) {
        if (graceDays > 0) {
            isInGracePeriod = true;
            statusLabel = 'Grace Period';
        } else {
            isExpired = true;
            statusLabel = 'Expired';
        }
    } else if (daysLeft <= 5) {
        statusLabel = 'Near Expiry';
    }

    return { ...plainB, isExpired, isInGracePeriod, statusLabel, daysLeft, graceDays };
  });

  // Sort batches by expiry earliest first
  batches.sort((a,b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  const totalQuantity = batches.reduce((sum, b) => sum + b.quantity, 0);
  const totalValue = batches.reduce((sum, b) => sum + (b.quantity * b.unitSellingPrice), 0);

  return {
    ...p,
    id: p._id.toString(),
    gracePeriodDays: graceDays,
    batches,
    quantity: totalQuantity, // map legacy field
    price: batches.length > 0 ? batches[0].unitSellingPrice : 0, // map legacy field
    costPrice: batches.length > 0 ? batches[0].unitCostPrice : 0, // map legacy field
    expiryDate: batches.length > 0 ? batches[0].expiryDate : '', // earliest expiry
    totalQuantity,
    totalValue
  };
};

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    const mapped = products.map(p => ensureBatches(p._doc));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get algorithmically optimized dynamic discounts per batch
router.get('/discounts', async (req, res) => {
  try {
    const products = await Product.find();
    
    const discountData = [];

    products.forEach(rawProduct => {
      const item = ensureBatches(rawProduct._doc);
      
      item.batches.forEach(b => {
        if (b.quantity <= 0 || b.isExpired) return;

        const P_base = parseFloat(b.unitSellingPrice);
        const C_a = parseFloat(b.unitCostPrice);
        const P_max = P_base;
        const P_min = C_a; 

        // Grace Period Rule: Force sell at Cost Price
        let suggestedPrice = P_base;

        if (b.isInGracePeriod) {
            suggestedPrice = C_a;
        } else {
            const I_c = b.quantity; 
            const daysLeft = b.daysLeft;

            if (daysLeft <= 0) {
              // Should not happen as <=0 implies Grace or Expired, handled above
              suggestedPrice = P_min;
            } else {
              const markdownHorizon = 7; 
              
              if (daysLeft <= markdownHorizon) {
                const timeUrgency = (markdownHorizon - daysLeft) / markdownHorizon;
                const baselineQuantity = 50;
                const volumeUrgency = Math.min(1, I_c / baselineQuantity);
                
                let severityRatio = (timeUrgency * 0.7) + (volumeUrgency * 0.3);
                severityRatio = Math.min(1, Math.max(0, severityRatio));
                
                suggestedPrice = P_max - ((P_max - P_min) * severityRatio);
              } else {
                suggestedPrice = P_max;
              }
            }
        }

        suggestedPrice = Math.max(suggestedPrice, C_a);
        const finalSuggestedPrice = Number(suggestedPrice.toFixed(2));

        const discountAmount = P_base - finalSuggestedPrice;
        const suggestedDiscount = P_base > 0 ? Math.round((discountAmount / P_base) * 100) : 0;
        
        const maxDiscountAmt = P_base - C_a;
        const maxDiscount = P_base > 0 ? Math.round((maxDiscountAmt / P_base) * 100) : 0;
        
        const profit = finalSuggestedPrice - C_a;
        const profitMargin = finalSuggestedPrice > 0 ? (profit / finalSuggestedPrice) * 100 : 0;
        
        let profitStatus = 'red'; 
        if (profitMargin > 10) {
          profitStatus = 'green'; 
        } else if (profitMargin > 0) {
          profitStatus = 'orange'; 
        }

        discountData.push({
          id: `${item.id}-${b.batchId || b._id}`,
          productId: item.id,
          product: `${item.name} (Batch: ${b.batchId || b.expiryDate})`,
          quantity: b.quantity,
          daysLeft: b.daysLeft,
          suggestedDiscount,
          originalPrice: P_base,
          costPrice: C_a,
          priceAfterDiscount: finalSuggestedPrice,
          profitMargin,
          profitStatus,
          maxSafeDiscount: maxDiscount,
          profitAmount: Number(profit.toFixed(2)),
          isInGracePeriod: b.isInGracePeriod
        });
      });
    });

    const applicableDiscounts = discountData.filter(d => d.daysLeft <= 14 || d.isInGracePeriod);
    applicableDiscounts.sort((a, b) => a.daysLeft - b.daysLeft);

    res.json(applicableDiscounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a product
router.post('/', async (req, res) => {
  try {
    const { name, category, supplier, batches, quantity, costPrice, price, expiryDate, gracePeriodDays } = req.body;
    
    // Construct single explicit batch from flat fields if bulk batches array is not provided
    const newBatches = batches && batches.length > 0 ? batches : [{
      quantity: quantity || 1,
      unitCostPrice: costPrice || 0,
      unitSellingPrice: price || 0,
      expiryDate: expiryDate || new Date().toISOString().split('T')[0]
    }];

    const product = new Product({
      name, category, supplier, gracePeriodDays, batches: newBatches
    });

    const savedProduct = await product.save();
    res.status(201).json(ensureBatches(savedProduct._doc));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a product (Legacy root update)
router.put('/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json(ensureBatches(updatedProduct._doc));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a batch to a product
router.post('/:id/batches', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    product.batches.push(req.body);
    await product.save();
    res.json(ensureBatches(product._doc));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a batch
router.delete('/:id/batches/:batchId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    product.batches = product.batches.filter(b => b.batchId !== req.params.batchId && b._id?.toString() !== req.params.batchId);
    await product.save();
    res.json(ensureBatches(product._doc));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark a batch as waste
router.post('/:id/batches/:batchId/waste', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    const batchIndex = product.batches.findIndex(b => b.batchId === req.params.batchId || b._id?.toString() === req.params.batchId);
    if (batchIndex === -1) return res.status(404).json({ message: 'Batch not found' });
    
    const batch = product.batches[batchIndex];

    const lossAmount = batch.quantity * batch.unitCostPrice;

    // Log the waste
    const wasteEntry = new Waste({
      productName: product.name,
      productId: product._id,
      batchId: req.params.batchId,
      quantity: batch.quantity,
      lossAmount
    });
    await wasteEntry.save();

    // Set batch quantity to 0 instead of deleting to keep track history OR filter it out. 
    // Filtering it out limits clutter.
    product.batches.splice(batchIndex, 1);
    
    await product.save();
    res.json(ensureBatches(product._doc));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
