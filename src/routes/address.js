const express = require('express');
const router = express.Router();
const { addAddressHandler, getAddressesHandler, updateAddressHandler, deleteAddressHandler, setDefaultAddressHandler } = require('../controllers/addressController');

router.get('/:userId', getAddressesHandler);
router.post('/:userId', addAddressHandler);
router.put('/:userId/:addressId', updateAddressHandler);
router.delete('/:userId/:addressId', deleteAddressHandler);
router.put('/:userId/:addressId/default', setDefaultAddressHandler);

module.exports = router;
