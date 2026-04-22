const express = require('express');
const router = express.Router();
const { syncAuth, sendOtp, verifyOtp, resendOtp, completeSignup } = require('../controllers/authController');
const { ipRateLimiter } = require('../middleware/rateLimiter');

// MSG91 OTP
router.post('/send-otp', ipRateLimiter, sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', ipRateLimiter, resendOtp);
router.post('/complete-signup', completeSignup);

// Legacy — kept for existing Firebase-auth customers during migration
router.post('/', syncAuth);

module.exports = router;
