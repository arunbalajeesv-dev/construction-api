const { getCart: getCartFromFirestore, saveCart: saveCartToFirestore } = require('../services/firestoreService');

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
    console.error('Firestore cart save error:', err)
  );
  return cart;
}

module.exports = { getCart, saveCart };
