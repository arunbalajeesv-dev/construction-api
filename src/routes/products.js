const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById } = require('../controllers/productController');

// GET /api/products - get all products
router.get('/', getAllProducts);

// GET /api/products/:id - get single product by id
router.get('/:id', getProductById);

module.exports = router;