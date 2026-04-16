const admin = require('firebase-admin');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('../../firebase-service-account.json');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// CUSTOMERS
async function getCustomer(userId) {
  const doc = await db.collection('customers').doc(userId).get();
  if (!doc.exists) return null;
  return doc.data();
}

async function saveCustomer(customer) {
  await db.collection('customers').doc(customer.userId).set(customer);
  return customer;
}

async function getCustomerByPhone(phone) {
  const snapshot = await db.collection('customers').where('phone', '==', phone).limit(1).get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

// CART
async function getCart(userId) {
  const doc = await db.collection('carts').doc(userId).get();
  if (!doc.exists) return { items: [] };
  return doc.data();
}

async function saveCart(userId, cart) {
  await db.collection('carts').doc(userId).set(cart);
  return cart;
}

// IMAGE MAP
async function getImageMap() {
  const doc = await db.collection('config').doc('imageMap').get();
  if (!doc.exists) return {};
  return doc.data();
}

async function setImage(itemId, imageUrl) {
  await db.collection('config').doc('imageMap').set(
    { [itemId]: imageUrl },
    { merge: true }
  );
}

module.exports = {
  getCustomer,
  saveCustomer,
  getCustomerByPhone,
  getCart,
  saveCart,
  getImageMap,
  setImage
};
