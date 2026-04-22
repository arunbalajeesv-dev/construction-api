const admin = require('firebase-admin');

async function uploadToFirebase(fileBuffer, mimeType, folder) {
  const bucket = admin.storage().bucket();
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

async function listProductImages() {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles({ prefix: 'products/' });
  return files
    .filter(f => f.name !== 'products/')
    .map(f => ({
      name: f.name.replace('products/', ''),
      url: `https://storage.googleapis.com/${bucket.name}/${f.name}`,
      uploadedAt: f.metadata.timeCreated || null
    }));
}

async function deleteProductImage(filename) {
  const bucket = admin.storage().bucket();
  await bucket.file(`products/${filename}`).delete();
}

module.exports = { uploadToFirebase, listProductImages, deleteProductImage };
