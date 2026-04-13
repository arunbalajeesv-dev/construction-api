const { getCart, saveCart } = require('../data/cart');
const { getProductById } = require('./productService');
const { calculateItemPrice } = require('../utils/gstCalculator');

function addToCart(userId, productId, quantity) {
  const cart = getCart(userId);
  const product = getProductById(productId);

  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  const existingItem = cart.items.find(i => i.productId === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({ productId, quantity });
  }

  saveCart(userId, cart);
  return buildCartResponse(userId);
}

function updateCartItem(userId, productId, quantity) {
  const cart = getCart(userId);

  if (quantity <= 0) {
    cart.items = cart.items.filter(i => i.productId !== productId);
  } else {
    const item = cart.items.find(i => i.productId === productId);
    if (!item) throw new Error(`Item ${productId} not in cart`);
    item.quantity = quantity;
  }

  saveCart(userId, cart);
  return buildCartResponse(userId);
}

function removeFromCart(userId, productId) {
  const cart = getCart(userId);
  cart.items = cart.items.filter(i => i.productId !== productId);
  saveCart(userId, cart);
  return buildCartResponse(userId);
}

function buildCartResponse(userId) {
  const cart = getCart(userId);

  let grandTotal = 0;
  let totalGST = 0;

  const items = cart.items.map(item => {
    const product = getProductById(item.productId);
    const priced = calculateItemPrice(product, item.quantity);

    grandTotal += priced.totalWithGST;
    totalGST += priced.gstAmount;

    return {
      productId: item.productId,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.selling_price,
      gstRate: product.gst_percentage,
      subtotal: priced.subtotal,
      gstAmount: priced.gstAmount,
      totalWithGST: priced.totalWithGST
    };
  });

  return {
    userId,
    items,
    summary: {
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      totalGST: parseFloat(totalGST.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    }
  };
}

module.exports = { addToCart, updateCartItem, removeFromCart, buildCartResponse };