const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const productRoutes = require('./src/routes/products');
const cartRoutes = require('./src/routes/cart');
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Construction API is running!' });
});

// Routes (we will add these one by one)
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
// app.use('/api/orders', orderRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});