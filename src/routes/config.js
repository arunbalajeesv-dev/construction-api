const express = require('express');
const router = express.Router();
const { getCodThreshold, updateCodThreshold, getWarehouseStatus, updateWarehouseStatus } = require('../controllers/configController');

function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'Unauthorized' });
  }
  next();
}

router.get('/cod-threshold', getCodThreshold);
router.put('/cod-threshold', requireAdmin, updateCodThreshold);

router.get('/warehouse-status', getWarehouseStatus);
router.put('/warehouse-status', requireAdmin, updateWarehouseStatus);

module.exports = router;
