'use strict';

const logger = require('../utils/logger');

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

let cache = {
  maintenanceMode: false,
  fetchedAt: 0,
};

/**
 * Maintenance mode middleware.
 * Reads maintenance_mode from Firestore config/settings (cached 60s).
 * Returns 503 when enabled. Admin routes are always allowed through so
 * operators can toggle the flag back off via the API.
 */
async function maintenanceMode(req, res, next) {
  // Admin routes bypass maintenance mode
  if (req.path.startsWith('/admin')) return next();

  const log = req.log || logger;
  const now = Date.now();

  if (now - cache.fetchedAt > CACHE_TTL_MS) {
    try {
      // Lazy-require to avoid circular dependency at module load time
      const { getSettings } = require('../services/firestoreService');
      const settings = await getSettings();
      cache = {
        maintenanceMode: settings.maintenance_mode === true,
        fetchedAt: now,
      };
    } catch (err) {
      log.error({ err: err.message }, 'Failed to read maintenance_mode from Firestore; defaulting to false');
      // Throttle retries — don't hammer Firestore on repeated failures
      cache.fetchedAt = now;
    }
  }

  if (cache.maintenanceMode) {
    log.info({ path: req.originalUrl }, 'Request blocked — maintenance mode active');
    return res.status(503).json({
      success: false,
      code: 'MAINTENANCE',
      message: 'The service is temporarily unavailable for maintenance. Please try again shortly.',
    });
  }

  next();
}

module.exports = maintenanceMode;
