const cartService = require('../services/cartService');

async function setDeliveryCharge(req, res) {
  try {
    const { userId } = req.params;
    const { deliveryCharge, addressId } = req.body;
    if (deliveryCharge === undefined || deliveryCharge === null) {
      return res.status(400).json({ success: false, error: 'MISSING_PARAM', message: 'deliveryCharge is required' });
    }
    const result = await cartService.setDeliveryCharge(userId, parseFloat(deliveryCharge), addressId || null);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST', message: err.message });
  }
}

async function addToCart(req, res) {
  try {
    const { userId, productId, quantity } = req.body;
    if (!userId || !productId || !quantity) {
      return res.status(400).json({ success: false, error: 'MISSING_PARAM', message: 'userId, productId, and quantity are required' });
    }
    const result = await cartService.addToCart(userId, productId, parseInt(quantity));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST', message: err.message });
  }
}

async function updateCart(req, res) {
  try {
    const { userId, productId, quantity } = req.body;
    const result = await cartService.updateCartItem(userId, productId, parseInt(quantity));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST', message: err.message });
  }
}

async function removeFromCart(req, res) {
  try {
    const { userId, productId } = req.body;
    const result = await cartService.removeFromCart(userId, productId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST', message: err.message });
  }
}

async function getCart(req, res) {
  try {
    const { userId } = req.params;
    const result = await cartService.buildCartResponse(userId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: 'BAD_REQUEST', message: err.message });
  }
}

module.exports = { addToCart, updateCart, removeFromCart, getCart, setDeliveryCharge };
