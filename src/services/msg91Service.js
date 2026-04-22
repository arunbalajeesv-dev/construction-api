const axios = require('axios');

const BASE = 'https://control.msg91.com/api/v5/otp';

function authHeaders() {
  return { authkey: process.env.MSG91_AUTH_KEY };
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
  return res.data;
}

module.exports = { sendOtp, verifyOtp, resendOtp };
