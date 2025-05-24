const express = require('express');
const firebaseAuth = require('../middleware/firebaseAuth');
const { db } = require('../utils/firebase');

const router = express.Router();

// GET /user
// Protected: requires a valid Firebase ID token
router.get('/', firebaseAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const snap = await db.collection('users').doc(userId).get();
    if (!snap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Return the stored user record
    res.json(snap.data());
  } catch (err) {
    console.error('/user handler error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
