const express = require('express');
const router = express.Router();
const Store = require('../models/Store');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Get the store settings
router.get('/', async (req, res) => {
  try {
    const store = await Store.findOne({ userId: req.user._id });
    if (!store) {
      // Return a default store if none exists
      return res.json({
        storeName: 'My Store',
        contact: '123-456-7890',
        email: 'info@mystore.com',
        address: '123 Retail Ave, Shopville'
      });
    }
    res.json(store);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or update the store settings
router.put('/', async (req, res) => {
  try {
    const { storeName, contact, email, address, storeLocation } = req.body;
    let store = await Store.findOne({ userId: req.user._id });
    
    if (store) {
      store.storeName = storeName;
      store.contact = contact;
      store.email = email;
      store.address = address;
      store.storeLocation = storeLocation;
      store = await store.save();
    } else {
      store = new Store({ userId: req.user._id, storeName, contact, email, address, storeLocation });
      store = await store.save();
    }
    
    res.json(store);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
