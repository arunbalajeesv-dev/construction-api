const admin = require('firebase-admin');

async function uploadToFirebase(fileBuffer, mimeType, folder) {
  console.log('[Storage] FIREBASE_STORAGE_BUCKET env:', process.env.FIREBASE_STORAGE_BUCKET);
  const bucket = admin.storage().bucket();
  console.log('[Storage] Bucket name from SDK:', bucket.name);
  const ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const file = bucket.file(filename);

  await file.save(fileBuffer, {
    metadata: { contentType: mimeType },
    public: true,
    resumable: false
  });

  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

module.exports = { uploadToFirebase };
