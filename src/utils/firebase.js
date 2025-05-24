const path  = require('path');
const admin = require('firebase-admin');

// build an absolute path based on your project root 
const serviceAccountPath = path.resolve(
  process.cwd(),
  process.env.FIREBASE_SERVICE_ACCOUNT
);
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

console.log(`✅ Firebase Admin initialized for project: "${serviceAccount.project_id}"`);

module.exports = { admin, db };
