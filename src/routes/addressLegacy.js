const express = require('express');
const router = express.Router();
const { addAddressHandler, getAddressesHandler, updateAddressHandler, deleteAddressHandler, setDefaultAddressHandler } = require('../controllers/addressController');

// GET /api/address/:userId
router.get('/:userId', getAddressesHandler);

// POST /api/address/add — userId comes from body
router.post('/add', (req, res) => {
  req.params.userId = req.body.userId;
  return addAddressHandler(req, res);
});

// PUT /api/address/update — userId + addressId come from body
router.put('/update', (req, res) => {
  req.params.userId = req.body.userId;
  req.params.addressId = req.body.addressId;
  return updateAddressHandler(req, res);
});

// DELETE /api/address/remove — userId + addressId come from body
router.delete('/remove', (req, res) => {
  req.params.userId = req.body.userId;
  req.params.addressId = req.body.addressId;
  return deleteAddressHandler(req, res);
});

// PUT /api/address/default — userId + addressId come from body
router.put('/default', (req, res) => {
  req.params.userId = req.body.userId;
  req.params.addressId = req.body.addressId;
  return setDefaultAddressHandler(req, res);
});

module.exports = router;
