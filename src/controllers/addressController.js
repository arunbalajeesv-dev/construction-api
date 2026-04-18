const { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../services/firestoreService');

const addAddressHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { label, flatNo, buildingName, streetAddress, landmark, area, city, state, pincode, latitude, longitude, isDefault } = req.body;

    if (!label) return res.status(400).json({ success: false, error: 'MISSING_PARAM', message: 'label is required' });
    if (!streetAddress) return res.status(400).json({ success: false, error: 'MISSING_PARAM', message: 'streetAddress is required' });
    if (!city) return res.status(400).json({ success: false, error: 'MISSING_PARAM', message: 'city is required' });
    if (!pincode) return res.status(400).json({ success: false, error: 'MISSING_PARAM', message: 'pincode is required' });
    if (latitude === undefined || latitude === null) return res.status(400).json({ success: false, error: 'MISSING_PARAM', message: 'latitude is required' });
    if (longitude === undefined || longitude === null) return res.status(400).json({ success: false, error: 'MISSING_PARAM', message: 'longitude is required' });
    if (label.length > 30) return res.status(400).json({ success: false, error: 'INVALID_PARAM', message: 'label must be 30 characters or less' });

    const address = await addAddress(userId, {
      label, flatNo: flatNo || '', buildingName: buildingName || '',
      streetAddress, landmark: landmark || '', area: area || '',
      city, state: state || '', pincode,
      latitude, longitude, isDefault: isDefault || false
    });

    res.json({ success: true, message: 'Address added successfully', data: { addressId: address.addressId } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
};

const getAddressesHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const addresses = await getAddresses(userId);
    res.json({ success: true, data: { addresses } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
};

const updateAddressHandler = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const addressData = req.body;
    if (addressData.label && addressData.label.length > 30) {
      return res.status(400).json({ success: false, error: 'INVALID_PARAM', message: 'label must be 30 characters or less' });
    }

    const updated = await updateAddress(userId, addressId, addressData);
    if (!updated) return res.status(404).json({ success: false, error: 'ADDRESS_NOT_FOUND', message: 'Address not found' });
    res.json({ success: true, message: 'Address updated successfully', data: { address: updated } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
};

const deleteAddressHandler = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const deleted = await deleteAddress(userId, addressId);
    if (!deleted) return res.status(404).json({ success: false, error: 'ADDRESS_NOT_FOUND', message: 'Address not found' });
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
};

const setDefaultAddressHandler = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const success = await setDefaultAddress(userId, addressId);
    if (!success) return res.status(404).json({ success: false, error: 'ADDRESS_NOT_FOUND', message: 'Address not found' });
    res.json({ success: true, message: 'Default address updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: err.message });
  }
};

module.exports = { addAddressHandler, getAddressesHandler, updateAddressHandler, deleteAddressHandler, setDefaultAddressHandler };
