const express = require('express');
const router = express.Router();
const { syncAuth, sendOtp, verifyOtp, resendOtp } = require('../controllers/authController');
const { ipRateLimiter } = require('../middleware/rateLimiter');

// Existing — backward compat for Firebase sync
router.post('/', syncAuth);

// MSG91 OTP
router.post('/send-otp', ipRateLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', ipRateLimiter, resendOtp);

module.exports = router;
