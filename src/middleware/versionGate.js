'use strict';

const admin = require('../utils/firebaseAdmin');
const logger = require('../utils/logger');
const { compareVersions } = require('../utils/semver');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cache = {
  minAppVersion: null,
  latestAppVersion: null,
  fetchedAt: 0,
};

async function fetchVersionConfig(log) {
  try {
    const template = await admin.remoteConfig().getTemplate();
    const params = template.parameters || {};
    cache = {
      minAppVersion: params.min_app_version?.defaultValue?.value || '0.0.0',
      latestAppVersion: params.latest_app_version?.defaultValue?.value || '0.0.0',
      fetchedAt: Date.now(),
    };
    log.debug(
      { minAppVersion: cache.minAppVersion, latestAppVersion: cache.latestAppVersion },
      'Version config fetched from Remote Config',
    );
  } catch (err) {
    log.error({ err: err.message }, 'Failed to fetch Remote Config for version gate; failing open with safe defaults');
    // Fail open — if Remote Config is unreachable, don't block all app traffic
    if (!cache.minAppVersion) {
      cache = { minAppVersion: '0.0.0', latestAppVersion: '0.0.0', fetchedAt: Date.now() };
    } else {
      // Extend stale cache TTL to avoid hammering Remote Config on repeated failures
      cache.fetchedAt = Date.now();
    }
  }
  return cache;
}

/**
 * Version gate middleware.
 * Reads min_app_version from Firebase Remote Config (cached 5 min).
 * Clients sending X-App-Version below the minimum receive 426 Upgrade Required.
 * Clients not sending X-App-Version (web, admin) are allowed through.
 */
async function versionGate(req, res, next) {
  const appVersion = req.headers['x-app-version'];

  // Non-Flutter clients (web, admin portal) don't send this header — pass through
  if (!appVersion) return next();

  const log = req.log || logger;
  const now = Date.now();

  if (!cache.minAppVersion || now - cache.fetchedAt > CACHE_TTL_MS) {
    await fetchVersionConfig(log);
  }

  if (compareVersions(appVersion, cache.minAppVersion) < 0) {
    log.info(
      { appVersion, minAppVersion: cache.minAppVersion },
      'Rejected request from outdated app version',
    );
    return res.status(426).json({
      success: false,
      code: 'FORCE_UPGRADE',
      message: 'This version of the app is no longer supported. Please update to continue.',
      minVersion: cache.minAppVersion,
      latestVersion: cache.latestAppVersion,
    });
  }

  next();
}

module.exports = versionGate;
