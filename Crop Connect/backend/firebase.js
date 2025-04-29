const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You'll need to download this from Firebase console

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "cropconnect.appspot.com"
});

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage().bucket();

module.exports = { admin, db, auth, storage };


// ===============================
// ENVIRONMENT VARIABLES
// ===============================

// backend/.env
/*
PORT=5000
NODE_ENV=development
FIREBASE_STORAGE_BUCKET=cropconnect.appspot.com
JWT_SECRET=not_needed_with_firebase_but_kept_for_legacy_code
JWT_EXPIRE=30d
*/