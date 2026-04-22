'use strict';

const { context, propagation } = require('@opentelemetry/api');
const admin = require('../utils/firebaseAdmin');
const logger = require('../utils/logger');

function withUserBaggage(uid, phone) {
  const entries = { 'enduser.id': { value: uid } };
  if (phone) entries['app.user.phone'] = { value: phone };
  return propagation.setBaggage(context.active(), propagation.createBaggage(entries));
}

/**
 * Firebase ID token authentication middleware.
 * Validates the Bearer token from the Authorization header.
 * Sets req.user = { uid, phone, email, name } on success.
 */
async function authenticate(req, res, next) {
  // Dev-only bypass: pass X-User-Id header to skip Firebase token verification.
  // Never active in production.
  if (process.env.NODE_ENV !== 'production' && req.headers['x-user-id']) {
    req.user = { uid: req.headers['x-user-id'] };
    req.log = req.log.child({ userId: req.user.uid });
    return context.with(withUserBaggage(req.user.uid, null), next);
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      phone: decoded.phone_number || null,
      email: decoded.email || null,
      name: decoded.name || null,
    };
    req.log = req.log.child({ userId: req.user.uid });
    logger.debug({ uid: req.user.uid, phone: req.user.phone }, 'auth:baggage');
    return context.with(withUserBaggage(req.user.uid, req.user.phone), next);
  } catch (err) {
    const log = req.log || logger;
    log.warn({ err: err.message, code: err.code }, 'Firebase token verification failed');
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
}

module.exports = authenticate;
