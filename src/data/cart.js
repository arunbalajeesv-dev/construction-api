const { getCart: getCartFromFirestore, saveCart: saveCartToFirestore } = require('../services/firestoreService');
const logger = require('../utils/logger');

const cartCache = {};

async function getCart(userId) {
  if (cartCache[userId]) {
    return cartCache[userId];
  }
  const cart = await getCartFromFirestore(userId);
  cartCache[userId] = cart;
  return cart;
}

async function saveCart(userId, cart) {
  cartCache[userId] = cart;
  saveCartToFirestore(userId, cart).catch(err =>
    logger.error({ err: err.message, userId }, 'Firestore cart save error')
  );
  return cart;
}

module.exports = { getCart, saveCart };
