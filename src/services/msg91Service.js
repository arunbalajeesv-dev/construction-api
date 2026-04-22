const axios = require('axios');
const { createSpan } = require('../utils/spanTracer');

const { MSG91_BASE_URL: BASE } = require('../constants');

function authHeaders() {
  return { authkey: process.env.MSG91_AUTH_KEY };
}

// MSG91 expects phone without '+' (e.g. "919876543210"), not E.164 ("+91...").
function toMsg91Mobile(e164) { return e164.replace(/^\+/, ''); }

// MSG91 returns HTTP 200 even on failure — always check res.data.type.
function assertSuccess(data, context) {
  if (!data || data.type !== 'success') {
    const err = new Error(data?.message || `MSG91 ${context} failed`);
    err.msg91Code = data?.code;
    err.msg91Type = data?.type;
    err.msg91Body = data;
    throw err;
  }
}

async function sendOtp(normalizedPhone) {
  const res = await axios.post(BASE, {}, {
    params: {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: toMsg91Mobile(normalizedPhone),
      authkey: process.env.MSG91_AUTH_KEY
    },
    timeout: 10000
  });
  assertSuccess(res.data, 'send');
  return res.data;
}

async function verifyOtp(normalizedPhone, otp, traceContext = null) {
  const span = createSpan(traceContext, 'msg91.api.verifyOtp', { 'peer.service': 'msg91', endpoint: '/api/v5/otp/verify' });
  try {
    const res = await axios.get(`${BASE}/verify`, {
      params: { otp, mobile: toMsg91Mobile(normalizedPhone) },
      headers: authHeaders(),
      timeout: 10000
    });
    span.end({ success: true, type: res.data?.type });
    return res.data;
  } catch (error) {
    span.end({ success: false, error: error.response?.data || error.message });
    throw error;
  }
}

async function resendOtp(normalizedPhone, traceContext = null) {
  const span = createSpan(traceContext, 'msg91.api.resendOtp', { 'peer.service': 'msg91', endpoint: '/api/v5/otp/retry' });
  try {
    const res = await axios.get(`${BASE}/retry`, {
      params: { retrytype: 'text', mobile: toMsg91Mobile(normalizedPhone) },
      headers: authHeaders(),
      timeout: 10000
    });
    span.end({ success: true });
    return res.data;
  } catch (error) {
    span.end({ success: false, error: error.response?.data || error.message });
    throw error;
  }
}

module.exports = { sendOtp, verifyOtp, resendOtp };
