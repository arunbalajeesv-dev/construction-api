const admin = require('firebase-admin');
const logger = require('../utils/logger');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  serviceAccount = require('../../firebase-service-account.json');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || '').trim().replace(/^gs:\/\//, '')
  });
}

const db = admin.firestore();

async function dbOp(name, fn) {
  try {
    return await fn();
  } catch (err) {
    logger.error({ err: err.message, operation: name }, 'Firestore operation failed');
    throw err;
  }
}

// CUSTOMERS
async function getCustomer(userId) {
  return dbOp('getCustomer', async () => {
    const doc = await db.collection('customers').doc(userId).get();
    if (!doc.exists) return null;
    return doc.data();
  });
}

async function saveCustomer(customer) {
  return dbOp('saveCustomer', async () => {
    await db.collection('customers').doc(customer.userId).set(customer);
    return customer;
  });
}

async function getCustomerByPhone(phone) {
  return dbOp('getCustomerByPhone', async () => {
    const snapshot = await db.collection('customers').where('phone', '==', phone).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
  });
}

// CART
async function getCart(userId) {
  return dbOp('getCart', async () => {
    const doc = await db.collection('carts').doc(userId).get();
    if (!doc.exists) return { items: [] };
    return doc.data();
  });
}

async function saveCart(userId, cart) {
  return dbOp('saveCart', async () => {
    await db.collection('carts').doc(userId).set(cart);
    return cart;
  });
}

// IMAGE MAP
async function getImageMap() {
  return dbOp('getImageMap', async () => {
    const doc = await db.collection('config').doc('imageMap').get();
    if (!doc.exists) return {};
    return doc.data();
  });
}

async function setImage(itemId, imageUrl) {
  return dbOp('setImage', async () => {
    await db.collection('config').doc('imageMap').set(
      { [itemId]: imageUrl },
      { merge: true }
    );
  });
}

async function setFeatured(itemId, featured) {
  await db.collection('config').doc('imageMap').set(
    { [`featured_${itemId}`]: featured },
    { merge: true }
  );
}

// ADDRESSES
async function getAddresses(userId) {
  return dbOp('getAddresses', async () => {
    const snapshot = await db.collection('addresses')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ addressId: doc.id, ...doc.data() }));
  });
}

async function addAddress(userId, addressData) {
  return dbOp('addAddress', async () => {
    const addressId = 'ADDR' + Date.now();
    const address = {
      addressId,
      userId,
      ...addressData,
      createdAt: new Date().toISOString()
    };

    // If isDefault true, unset all other defaults first
    if (addressData.isDefault) {
      const existing = await getAddresses(userId);
      for (const addr of existing) {
        if (addr.isDefault) {
          await db.collection('addresses').doc(addr.addressId).update({ isDefault: false });
        }
      }
    }

    await db.collection('addresses').doc(addressId).set(address);
    return address;
  });
}

async function updateAddress(userId, addressId, addressData) {
  return dbOp('updateAddress', async () => {
    const doc = await db.collection('addresses').doc(addressId).get();
    if (!doc.exists || doc.data().userId !== userId) return null;
    await db.collection('addresses').doc(addressId).update(addressData);
    return { addressId, ...doc.data(), ...addressData };
  });
}

async function deleteAddress(userId, addressId) {
  return dbOp('deleteAddress', async () => {
    const doc = await db.collection('addresses').doc(addressId).get();
    if (!doc.exists || doc.data().userId !== userId) return false;
    await db.collection('addresses').doc(addressId).delete();
    return true;
  });
}

async function setDefaultAddress(userId, addressId) {
  return dbOp('setDefaultAddress', async () => {
    // Unset all existing defaults
    const existing = await getAddresses(userId);
    for (const addr of existing) {
      if (addr.isDefault) {
        await db.collection('addresses').doc(addr.addressId).update({ isDefault: false });
      }
    }
    // Set new default
    const doc = await db.collection('addresses').doc(addressId).get();
    if (!doc.exists || doc.data().userId !== userId) return false;
    await db.collection('addresses').doc(addressId).update({ isDefault: true });
    return true;
  });
}

// ORDERS
async function saveOrder(order) {
  return dbOp('saveOrder', async () => {
    await db.collection('orders').doc(order.orderId).set(order);
    return order;
  });
}

async function getOrdersByUser(userId) {
  return dbOp('getOrdersByUser', async () => {
    const snapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data());
  });
}

async function getOrderById(orderId) {
  return dbOp('getOrderById', async () => {
    const doc = await db.collection('orders').doc(orderId).get();
    if (!doc.exists) return null;
    return doc.data();
  });
}

async function getAllOrders() {
  return dbOp('getAllOrders', async () => {
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => doc.data());
  });
}

async function updateOrder(orderId, data) {
  return dbOp('updateOrder', async () => {
    await db.collection('orders').doc(orderId).update(data);
    const doc = await db.collection('orders').doc(orderId).get();
    return doc.data();
  });
}

async function getAddressById(addressId) {
  return dbOp('getAddressById', async () => {
    const doc = await db.collection('addresses').doc(addressId).get();
    if (!doc.exists) return null;
    return doc.data();
  });
}

// COD HANDOVERS
async function createHandover(handoverData) {
  await db.collection('codHandovers').doc(handoverData.handoverId).set(handoverData);
  return handoverData;
}

async function getHandoversByDriver(driverId, date) {
  const snap = await db.collection('codHandovers')
    .where('driverId', '==', driverId)
    .where('date', '==', date)
    .get();
  return snap.docs.map(d => d.data());
}

async function getAllHandovers(status) {
  const snap = await db.collection('codHandovers').orderBy('createdAt', 'desc').get();
  let handovers = snap.docs.map(d => d.data());
  if (status) handovers = handovers.filter(h => h.status === status);
  return handovers;
}

async function getHandoverById(handoverId) {
  const doc = await db.collection('codHandovers').doc(handoverId).get();
  return doc.exists ? doc.data() : null;
}

async function updateHandover(handoverId, updates) {
  await db.collection('codHandovers').doc(handoverId).update(updates);
  return { ...updates, handoverId };
}

// APP SETTINGS
async function getSettings() {
  return dbOp('getSettings', async () => {
    const doc = await db.collection('config').doc('settings').get();
    if (!doc.exists) return { cod_threshold: 7500 };
    return doc.data();
  });
}

async function updateSettings(data) {
  return dbOp('updateSettings', async () => {
    await db.collection('config').doc('settings').set(data, { merge: true });
    return data;
  });
}

// DELIVERY CONFIG
async function getDeliveryConfig() {
  return dbOp('getDeliveryConfig', async () => {
    const doc = await db.collection('config').doc('deliveryConfig').get();
    if (!doc.exists) {
      return {
        freeDeliveryEnabled: false,
        freeDeliveryThreshold: null,
        freeDeliveryPincodes: []
      };
    }
    return doc.data();
  });
}

async function updateDeliveryConfig(config) {
  return dbOp('updateDeliveryConfig', async () => {
    await db.collection('config').doc('deliveryConfig').set(config, { merge: true });
    return config;
  });
}

// VEHICLES
async function getVehicles() {
  return dbOp('getVehicles', async () => {
    const snapshot = await db.collection('vehicles').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ vehicleId: doc.id, ...doc.data() }));
  });
}

async function addVehicle(name) {
  return dbOp('addVehicle', async () => {
    const vehicleId = 'VH' + Date.now();
    const vehicle = { vehicleId, name, isAvailable: true };
    await db.collection('vehicles').doc(vehicleId).set(vehicle);
    return vehicle;
  });
}

async function updateVehicle(vehicleId, data) {
  return dbOp('updateVehicle', async () => {
    await db.collection('vehicles').doc(vehicleId).update(data);
  });
}

async function deleteVehicle(vehicleId) {
  return dbOp('deleteVehicle', async () => {
    await db.collection('vehicles').doc(vehicleId).delete();
  });
}

async function getVehicleById(vehicleId) {
  return dbOp('getVehicleById', async () => {
    const doc = await db.collection('vehicles').doc(vehicleId).get();
    if (!doc.exists) return null;
    return { vehicleId: doc.id, ...doc.data() };
  });
}

// DRIVERS
async function getDrivers() {
  return dbOp('getDrivers', async () => {
    const snapshot = await db.collection('drivers').where('isActive', '==', true).get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ driverId: doc.id, ...doc.data() }));
  });
}

async function addDriver(name, phone) {
  return dbOp('addDriver', async () => {
    const driverId = 'DR' + Date.now();
    const driver = { driverId, name, phone, isActive: true, isAvailable: true };
    await db.collection('drivers').doc(driverId).set(driver);
    return driver;
  });
}

async function updateDriver(driverId, data) {
  return dbOp('updateDriver', async () => {
    await db.collection('drivers').doc(driverId).update(data);
  });
}

async function softDeleteDriver(driverId) {
  return dbOp('softDeleteDriver', async () => {
    await db.collection('drivers').doc(driverId).update({ isActive: false });
  });
}

async function getDriverById(driverId) {
  return dbOp('getDriverById', async () => {
    const doc = await db.collection('drivers').doc(driverId).get();
    if (!doc.exists) return null;
    return { driverId: doc.id, ...doc.data() };
  });
}

async function getDriverByPhone(phone) {
  return dbOp('getDriverByPhone', async () => {
    const snapshot = await db.collection('drivers').where('phone', '==', phone).limit(1).get();
    if (snapshot.empty) return null;
    return { driverId: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  });
}

async function getDriverByToken(token) {
  return dbOp('getDriverByToken', async () => {
    const snapshot = await db.collection('drivers').where('currentToken', '==', token).limit(1).get();
    if (snapshot.empty) return null;
    return { driverId: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  });
}

async function getAllHandoversForDriver(driverId) {
  const snap = await db.collection('codHandovers')
    .where('driverId', '==', driverId)
    .get();
  const docs = snap.docs.map(d => d.data());
  return docs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

async function getOrdersByDriver(driverId, startISO, endISO) {
  return dbOp('getOrdersByDriver', async () => {
    let q = db.collection('orders').where('driverId', '==', driverId);
    if (startISO) q = q.where('assignedAt', '>=', startISO);
    if (endISO) q = q.where('assignedAt', '<=', endISO);
    const snapshot = await q.get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ orderId: doc.id, ...doc.data() }));
  });
}

module.exports = {
  db,
  getCustomer,
  createHandover,
  getHandoversByDriver,
  getAllHandovers,
  getHandoverById,
  updateHandover,
  saveCustomer,
  getCustomerByPhone,
  getCart,
  saveCart,
  getImageMap,
  setImage,
  setFeatured,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getSettings,
  updateSettings,
  getDeliveryConfig,
  updateDeliveryConfig,
  saveOrder,
  getOrdersByUser,
  getOrderById,
  getAllOrders,
  updateOrder,
  getAddressById,
  getVehicles,
  addVehicle,
  updateVehicle,
  deleteVehicle,
  getVehicleById,
  getDrivers,
  addDriver,
  updateDriver,
  softDeleteDriver,
  getDriverById,
  getDriverByPhone,
  getDriverByToken,
  getOrdersByDriver,
  getAllHandoversForDriver
};
