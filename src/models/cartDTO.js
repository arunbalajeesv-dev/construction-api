'use strict';

/**
 * Maps a raw Firestore cart document to a typed public shape.
 */
function toCartDTO(doc) {
  if (!doc) return { items: [] };
  return {
    items: (doc.items || []).map(item => ({
      productId: item.productId,
      name: item.name || null,
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || item.price || 0,
      unit: item.unit || null,
      imageUrl: item.imageUrl || null,
    })),
    deliveryCharge: Number(doc.deliveryCharge ?? doc.delivery_charge ?? 0),
    updatedAt: doc.updatedAt || null,
  };
}

module.exports = { toCartDTO };
