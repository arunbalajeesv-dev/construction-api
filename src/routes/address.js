const express = require('express');
const router = express.Router();
const { addAddressHandler, getAddressesHandler, updateAddressHandler, deleteAddressHandler, setDefaultAddressHandler } = require('../controllers/addressController');

router.post('/add', addAddressHandler);
router.get('/:userId', getAddressesHandler);
router.put('/update', updateAddressHandler);
router.delete('/remove', deleteAddressHandler);
router.put('/default', setDefaultAddressHandler);

module.exports = router;
