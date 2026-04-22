'use strict';

/**
 * Maps a raw Firestore address document to a typed public shape.
 */
function toAddressDTO(doc) {
  if (!doc) return null;
  return {
    addressId: doc.addressId,
    userId: doc.userId,
    label: doc.label || null,
    flatNo: doc.flatNo || null,
    buildingName: doc.buildingName || null,
    streetAddress: doc.streetAddress || null,
    landmark: doc.landmark || null,
    area: doc.area || null,
    city: doc.city || null,
    state: doc.state || null,
    pincode: doc.pincode || null,
    latitude: doc.latitude ?? null,
    longitude: doc.longitude ?? null,
    isDefault: doc.isDefault || false,
    createdAt: doc.createdAt || null,
  };
}

module.exports = { toAddressDTO };
