// src/middleware/firebaseAuth.js
const admin = require('firebase-admin');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const idToken = header.split(' ')[1];
  try {
    // Verify the Firebase ID token (issued from Custom Token above)
    const decoded = await admin.auth().verifyIdToken(idToken);
    // Attach user info to req
    req.user = {
      uid: decoded.uid,
      provider: decoded.provider,
      // any other custom claims can go here
    };
    next();
  } catch (err) {
    console.error('❌ Firebase token verify failed:', err);
    res.status(401).json({ error: 'Invalid Firebase ID token' });
  }
};
