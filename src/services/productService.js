const products = require('../data/products');
const { calculateGST } = require('../utils/gstCalculator');

const getAllProducts = (category) => {
  let result = products;

  if (category) {
    result = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  return result.map((p) => ({
    ...p,
    ...calculateGST(p.selling_price, p.gst_percentage)
  }));
};

const getProductById = (id) => {
  const product = products.find((p) => p.id === id);

  if (!product) return null;

  return {
    ...product,
    ...calculateGST(product.selling_price, product.gst_percentage)
  };
};

module.exports = { getAllProducts, getProductById };