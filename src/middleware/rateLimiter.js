// In-memory rate limiting — no external dependency required.
// All stores are Map<key, number[]> (arrays of timestamps in ms).

const OTP_SEND_MAX = 3;
const OTP_SEND_WINDOW_MS = 15 * 60 * 1000;   // 15 min per phone
const IP_MAX = 10;
const IP_WINDOW_MS = 60 * 60 * 1000;          // 1 hour per IP
const RESEND_COOLDOWN_MS = 30 * 1000;          // 30 sec per phone
const VERIFY_MAX_ATTEMPTS = 5;
const VERIFY_LOCKOUT_MS = 15 * 60 * 1000;     // 15 min lockout

const phoneSendLog = new Map();   // phone → [timestamp, ...]
const ipLog = new Map();          // ip → [timestamp, ...]
const resendLog = new Map();      // phone → last-send-timestamp
const verifyAttempts = new Map(); // phone → { count, lockedUntil }

function pruneOld(arr, windowMs) {
  const cutoff = Date.now() - windowMs;
  return arr.filter(t => t > cutoff);
}

// ── OTP SEND RATE LIMIT (per phone) ───────────────────────
function checkOtpSendLimit(phone) {
  const now = Date.now();
  const log = pruneOld(phoneSendLog.get(phone) || [], OTP_SEND_WINDOW_MS);
  if (log.length >= OTP_SEND_MAX) {
    const retryAfter = Math.ceil((log[0] + OTP_SEND_WINDOW_MS - now) / 1000);
    const err = new Error(`Too many OTP requests. Try again in ${retryAfter}s`);
    err.status = 429;
    throw err;
  }
}

function recordOtpSend(phone) {
  const log = pruneOld(phoneSendLog.get(phone) || [], OTP_SEND_WINDOW_MS);
  log.push(Date.now());
  phoneSendLog.set(phone, log);
  resendLog.set(phone, Date.now());
}

// ── IP RATE LIMIT (Express middleware) ────────────────────
function ipRateLimiter(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const log = pruneOld(ipLog.get(ip) || [], IP_WINDOW_MS);
  if (log.length >= IP_MAX) {
    return res.status(429).json({ success: false, message: 'Too many requests from this IP. Try again later.' });
  }
  log.push(now);
  ipLog.set(ip, log);
  next();
}

// ── RESEND COOLDOWN (per phone) ───────────────────────────
function checkResendCooldown(phone) {
  const last = resendLog.get(phone);
  if (last) {
    const elapsed = Date.now() - last;
    if (elapsed < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      const err = new Error(`Please wait ${wait}s before requesting another OTP`);
      err.status = 429;
      throw err;
    }
  }
}

// ── VERIFY ATTEMPT TRACKING (per phone) ───────────────────
function checkVerifyLockout(phone) {
  const state = verifyAttempts.get(phone);
  if (state && state.lockedUntil > Date.now()) {
    const wait = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    const err = new Error(`Too many failed attempts. Try again in ${wait}s`);
    err.status = 429;
    throw err;
  }
}

function recordFailedVerify(phone) {
  const state = verifyAttempts.get(phone) || { count: 0, lockedUntil: 0 };
  state.count += 1;
  if (state.count >= VERIFY_MAX_ATTEMPTS) {
    state.lockedUntil = Date.now() + VERIFY_LOCKOUT_MS;
    state.count = 0;
  }
  verifyAttempts.set(phone, state);
}

function clearVerifyAttempts(phone) {
  verifyAttempts.delete(phone);
}

module.exports = {
  checkOtpSendLimit,
  recordOtpSend,
  ipRateLimiter,
  checkResendCooldown,
  checkVerifyLockout,
  recordFailedVerify,
  clearVerifyAttempts
};
