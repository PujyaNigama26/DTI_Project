require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors()); // Allow anywhere (Flutter App, React Frontend, etc.) to connect
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
const inventoryRoutes = require('./routes/inventory');
const supplierRoutes = require('./routes/suppliers');
const salesRoutes = require('./routes/sales');
const storeRoutes = require('./routes/store');

app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/store', storeRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('ExpirySmart API is running...');
});

// Error handling fallback
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
