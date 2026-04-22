const jwt = require('jsonwebtoken');
const { syncCustomer } = require('../services/customerService');
const { getCustomerByPhone } = require('../services/firestoreService');
const msg91 = require('../services/msg91Service');
const { normalizePhone, isValidIndianMobile } = require('../utils/phone');
const {
  checkOtpSendLimit,
  recordOtpSend,
  checkResendCooldown,
  checkVerifyLockout,
  recordFailedVerify,
  clearVerifyAttempts
} = require('../middleware/rateLimiter');

// ── EXISTING — kept for backward compat (legacy Firebase flow) ─
async function syncAuth(req, res) {
  // Accept both old firebaseUid and new userId field names
  const { firebaseUid, userId: bodyUserId, phone, name, is_business, business_name, gstin, registered_address } = req.body;
  const userId = bodyUserId || firebaseUid;
  if (!userId || !phone) {
    return res.status(400).json({ success: false, message: 'userId and phone are required' });
  }
  try {
    const customer = await syncCustomer(userId, phone, name, is_business, business_name, gstin, registered_address);
    res.json({ success: true, data: { customer }, customer, user: customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// ── HELPERS ────────────────────────────────────────────────
function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function generateUserId() {
  return 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function lookupCustomer(normalizedPhone) {
  let customer = await getCustomerByPhone(normalizedPhone);
  if (!customer) customer = await getCustomerByPhone('+' + normalizedPhone);
  return customer || null;
}

// ── POST /api/auth/send-otp ────────────────────────────────
async function sendOtp(req, res) {
  const { phone } = req.body;

  if (!phone || !isValidIndianMobile(phone)) {
    return res.status(400).json({ success: false, message: 'Valid Indian mobile number required' });
  }

  const normalized = normalizePhone(phone);

  try {
    checkOtpSendLimit(normalized);
    checkResendCooldown(normalized);
  } catch (err) {
    return res.status(err.status || 429).json({ success: false, message: err.message });
  }

  console.log(`[AUTH] send otp request phone=***${normalized.slice(-4)}`);

  try {
    await msg91.sendOtp(normalized);
    recordOtpSend(normalized);
    console.log(`[AUTH] otp sent phone=***${normalized.slice(-4)}`);
    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    console.error('[AUTH] msg91 failure (send):', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: 'Unable to send OTP' });
  }
}

// ── POST /api/auth/verify-otp ──────────────────────────────
async function verifyOtp(req, res) {
  const { phone, otp } = req.body;

  if (!phone || !isValidIndianMobile(phone)) {
    return res.status(400).json({ success: false, message: 'Valid Indian mobile number required' });
  }
  if (!otp || !/^\d{4,8}$/.test(String(otp))) {
    return res.status(400).json({ success: false, message: 'OTP must be 4–8 digits' });
  }

  const normalized = normalizePhone(phone);

  try {
    checkVerifyLockout(normalized);
  } catch (err) {
    return res.status(err.status || 429).json({ success: false, message: err.message });
  }

  let msg91Res;
  try {
    msg91Res = await msg91.verifyOtp(normalized, otp);
  } catch (err) {
    const data = err.response?.data;
    console.error('[AUTH] msg91 failure (verify):', data || err.message);
    // MSG91 returns 4xx for wrong OTP
    if (err.response?.status === 400 || data?.type === 'error') {
      recordFailedVerify(normalized);
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    return res.status(500).json({ success: false, message: 'OTP verification failed. Please try again.' });
  }

  // MSG91 returns { type: 'success' } on valid OTP
  if (!msg91Res || msg91Res.type !== 'success') {
    recordFailedVerify(normalized);
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  clearVerifyAttempts(normalized);
  console.log(`[AUTH] otp verify success phone=***${normalized.slice(-4)}`);

  const customer = await lookupCustomer(normalized);

  if (customer) {
    console.log(`[AUTH] existing customer login userId=${customer.userId}`);
    const token = signToken({ userId: customer.userId, phone: normalized });
    return res.json({ success: true, isNewUser: false, token, customer });
  }

  console.log(`[AUTH] new customer signup required phone=***${normalized.slice(-4)}`);
  const tempUserId = generateUserId();
  const token = signToken({ userId: tempUserId, phone: normalized, type: 'signup' }, '1h');
  return res.json({ success: true, isNewUser: true, signupToken: token, phone: normalized, tempUserId });
}

// ── POST /api/auth/resend-otp ──────────────────────────────
async function resendOtp(req, res) {
  const { phone } = req.body;

  if (!phone || !isValidIndianMobile(phone)) {
    return res.status(400).json({ success: false, message: 'Valid Indian mobile number required' });
  }

  const normalized = normalizePhone(phone);

  console.log(`[AUTH] resend otp request phone=***${normalized.slice(-4)}`);

  try {
    await msg91.resendOtp(normalized);
    recordOtpSend(normalized);
    return res.json({ success: true, message: 'OTP resent successfully' });
  } catch (err) {
    console.error('[AUTH] msg91 failure (resend):', err.response?.data || err.message);
    return res.status(500).json({ success: false, message: 'Unable to resend OTP' });
  }
}

// ── POST /api/auth/complete-signup ────────────────────────
async function completeSignup(req, res) {
  const { token, name, is_business, business_name, gstin, registered_address } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'signupToken is required' });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'name is required' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired signup token' });
  }

  if (payload.type !== 'signup') {
    return res.status(401).json({ success: false, message: 'Invalid token type' });
  }

  const { userId, phone } = payload;

  try {
    const customer = await syncCustomer(userId, phone, name.trim(), is_business, business_name, gstin, registered_address);
    console.log(`[AUTH] new customer signup complete userId=${userId}`);
    const authToken = signToken({ userId, phone });
    return res.json({ success: true, token: authToken, customer });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { syncAuth, sendOtp, verifyOtp, resendOtp, completeSignup };
