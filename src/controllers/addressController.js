const { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../services/firestoreService');

const addAddressHandler = async (req, res) => {
  try {
    const { userId, label, flatNo, buildingName, streetAddress, landmark, area, city, state, pincode, latitude, longitude, isDefault } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    if (!label) return res.status(400).json({ success: false, message: 'label is required' });
    if (!streetAddress) return res.status(400).json({ success: false, message: 'streetAddress is required' });
    if (!city) return res.status(400).json({ success: false, message: 'city is required' });
    if (!pincode) return res.status(400).json({ success: false, message: 'pincode is required' });
    if (latitude === undefined || latitude === null) return res.status(400).json({ success: false, message: 'latitude is required' });
    if (longitude === undefined || longitude === null) return res.status(400).json({ success: false, message: 'longitude is required' });
    if (label.length > 30) return res.status(400).json({ success: false, message: 'label must be 30 characters or less' });

    const address = await addAddress(userId, {
      label, flatNo: flatNo || '', buildingName: buildingName || '',
      streetAddress, landmark: landmark || '', area: area || '',
      city, state: state || '', pincode,
      latitude, longitude, isDefault: isDefault || false
    });

    res.json({ success: true, message: 'Address added successfully', data: { addressId: address.addressId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAddressesHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    const addresses = await getAddresses(userId);
    res.json({ success: true, data: addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAddressHandler = async (req, res) => {
  try {
    const { userId, addressId, ...addressData } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    if (!addressId) return res.status(400).json({ success: false, message: 'addressId is required' });
    if (addressData.label && addressData.label.length > 30) return res.status(400).json({ success: false, message: 'label must be 30 characters or less' });

    const updated = await updateAddress(userId, addressId, addressData);
    if (!updated) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, message: 'Address updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAddressHandler = async (req, res) => {
  try {
    const { userId, addressId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    if (!addressId) return res.status(400).json({ success: false, message: 'addressId is required' });

    const deleted = await deleteAddress(userId, addressId);
    if (!deleted) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, message: 'Address deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setDefaultAddressHandler = async (req, res) => {
  try {
    const { userId, addressId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId is required' });
    if (!addressId) return res.status(400).json({ success: false, message: 'addressId is required' });

    const success = await setDefaultAddress(userId, addressId);
    if (!success) return res.status(404).json({ success: false, message: 'Address not found' });
    res.json({ success: true, message: 'Default address updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { addAddressHandler, getAddressesHandler, updateAddressHandler, deleteAddressHandler, setDefaultAddressHandler };
