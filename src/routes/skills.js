const express      = require('express');
const firebaseAuth = require('../middleware/firebaseAuth');
const { db }       = require('../utils/firebase');
const { getSkills }= require('../services/scraper');

const router = express.Router();

router.get('/', firebaseAuth, async (req, res) => {
  // Load user
  const snap = await db.collection('users').doc(req.user.uid).get();
  if (!snap.exists) return res.status(404).json({ error: 'User not found' });
  const user = snap.data();

  // Return stub (or real scraper once you swap it in)
  const skills = await getSkills(user.id, user.accessToken);
  res.json({ skills });
});

module.exports = router;
