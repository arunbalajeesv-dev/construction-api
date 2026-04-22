'use strict';

const admin = require('firebase-admin');
const env = require('../config/env');

if (!admin.apps.length) {
  let serviceAccount;
  const val = env.FIREBASE_SERVICE_ACCOUNT.trim();

  if (val.startsWith('/') || val.startsWith('.')) {
    // Absolute or relative file path
    serviceAccount = require(val);
  } else {
    // JSON string (used in Docker / Render)
    serviceAccount = JSON.parse(val);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
