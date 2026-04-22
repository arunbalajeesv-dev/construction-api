'use strict';

/**
 * Maps a raw Firestore driver document to a typed shape.
 * Pass options.includeToken = true to include the session token
 * (only for the driver auth response — never expose to customers).
 */
function toDriverDTO(doc, options = {}) {
  if (!doc) return null;
  const dto = {
    driverId: doc.driverId,
    name: doc.name || null,
    phone: doc.phone || null,
    isActive: doc.isActive !== false,
    isAvailable: doc.isAvailable !== false,
    vehicleId: doc.vehicleId || null,
    vehicleName: doc.vehicleName || null,
  };
  if (options.includeToken) {
    dto.currentToken = doc.currentToken || null;
  }
  return dto;
}

module.exports = { toDriverDTO };
