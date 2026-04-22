'use strict';

/**
 * Maps the Firestore config/settings document.
 */
function toSettingsDTO(doc) {
  if (!doc) return null;
  return {
    codThreshold: doc.cod_threshold ?? 7500,
    warehouseOpen: doc.warehouseOpen !== false,
    warehouseClosedMessage: doc.warehouseClosedMessage || null,
    maintenanceMode: doc.maintenance_mode || false,
  };
}

/**
 * Maps the Firestore config/deliveryConfig document.
 */
function toDeliveryConfigDTO(doc) {
  if (!doc) return null;
  return {
    freeDeliveryEnabled: doc.freeDeliveryEnabled || false,
    freeDeliveryThreshold: doc.freeDeliveryThreshold || null,
    freeDeliveryPincodes: doc.freeDeliveryPincodes || [],
  };
}

/**
 * Maps the Firestore config/imageMap document.
 * Returns raw map — keys are Zoho item IDs, values are image URLs.
 */
function toImageMapDTO(doc) {
  return doc || {};
}

module.exports = { toSettingsDTO, toDeliveryConfigDTO, toImageMapDTO };
