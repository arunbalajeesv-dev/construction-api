const { getCustomer, saveCustomer } = require('../data/customers');
const { createZohoContact, updateZohoContact } = require('./zohoService');

async function syncCustomer(firebaseUid, phone, name, is_business, business_name, gstin, registered_address) {
  console.log('syncCustomer called with:', { firebaseUid, phone, name, is_business, business_name, gstin });
  const existing = getCustomer(firebaseUid);
  if (existing) {
    let hasChanges = false;

    if (name && name.trim() !== '' && existing.name !== name) {
      existing.name = name;
      hasChanges = true;
    }
    if (is_business !== undefined && existing.is_business !== is_business) {
      existing.is_business = is_business;
      hasChanges = true;
    }
    if (business_name && existing.business_name !== business_name) {
      existing.business_name = business_name;
      hasChanges = true;
    }
    if (gstin && existing.gstin !== gstin) {
      existing.gstin = gstin;
      hasChanges = true;
    }
    if (registered_address && !existing.registered_address) {
      existing.registered_address = registered_address;
      hasChanges = true;
    }

    if (hasChanges) {
      saveCustomer(existing);
      if (existing.zoho_contact_id) {
        await updateZohoContact(existing.zoho_contact_id, {
          name,
          phone: existing.phone,
          business_name,
          gstin,
          registered_address
        });
      }
    }

    return existing;
  }

  const zohoContact = await createZohoContact({ phone, name, is_business, business_name, gstin, registered_address });

  return saveCustomer({
    userId: firebaseUid,
    phone,
    name: name || '',
    is_business: is_business || false,
    business_name: business_name || '',
    gstin: gstin || '',
    zoho_contact_id: zohoContact.contact_id,
    delivery_address: null,
    registered_address: registered_address || null
  });
}

module.exports = { syncCustomer };
