function formatTimestamps(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val && typeof val.toDate === 'function') {
      result[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && val._seconds) {
      result[key] = new Date(val._seconds * 1000).toISOString();
    }
  }
  return result;
}

module.exports = { formatTimestamps };
