'use strict';

/**
 * Maps a raw Firestore vehicle document to a typed shape.
 */
function toVehicleDTO(doc) {
  if (!doc) return null;
  return {
    vehicleId: doc.vehicleId,
    name: doc.name || null,
    isAvailable: doc.isAvailable !== false,
  };
}

module.exports = { toVehicleDTO };
