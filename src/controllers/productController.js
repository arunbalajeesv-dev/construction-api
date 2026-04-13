const productService = require('../services/productService');

const getAllProducts = (req, res) => {
  try {
    const { category } = req.query;
    const products = productService.getAllProducts(category);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getProductById = (req, res) => {
  try {
    const { id } = req.params;
    const product = productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with id ${id} not found`
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = { getAllProducts, getProductById };