const axios = require('axios');

const BASE = 'https://control.msg91.com/api/v5/otp';

function authHeaders() {
  return { authkey: process.env.MSG91_AUTH_KEY };
}

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
      mobile: normalizedPhone,
      authkey: process.env.MSG91_AUTH_KEY
    },
    timeout: 10000
  });
  assertSuccess(res.data, 'send');
  return res.data;
}

async function verifyOtp(normalizedPhone, otp) {
  const res = await axios.get(`${BASE}/verify`, {
    params: { otp, mobile: normalizedPhone },
    headers: authHeaders(),
    timeout: 10000
  });
  return res.data;
}

async function resendOtp(normalizedPhone) {
  const res = await axios.get(`${BASE}/retry`, {
    params: { retrytype: 'text', mobile: normalizedPhone },
    headers: authHeaders(),
    timeout: 10000
  });
  assertSuccess(res.data, 'resend');
  return res.data;
}

module.exports = { sendOtp, verifyOtp, resendOtp };
