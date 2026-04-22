'use strict';

/**
 * Maps a raw Firestore customer document to a safe public-facing shape.
 * Strips internal fields (zoho_contact_id is included for admin use but
 * controllers can omit it when returning to the Flutter client).
 */
function toCustomerDTO(doc) {
  if (!doc) return null;
  return {
    userId: doc.userId,
    phone: doc.phone || null,
    name: doc.name || null,
    isBusiness: doc.is_business || false,
    businessName: doc.business_name || null,
    gstin: doc.gstin || null,
    zohoContactId: doc.zoho_contact_id || null,
    deliveryAddress: doc.delivery_address || null,
    registeredAddress: doc.registered_address || null,
    createdAt: doc.createdAt || null,
  };
}

module.exports = { toCustomerDTO };
