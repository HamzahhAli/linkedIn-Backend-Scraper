// src/routes/auth.js
require('dotenv').config();
const express  = require('express');
const axios    = require('axios');
const qs       = require('querystring');
const crypto   = require('crypto');
const jwt      = require('jsonwebtoken');
const { admin, db } = require('../utils/firebase');

const router       = express.Router();
const CLIENT_ID    = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET= process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI;

// Step 1: Redirect to LinkedIn OIDC consent
router.get('/linkedin', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const scope = 'openid profile email';

  const params = qs.stringify({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    scope,
    state,
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
  console.log('🔗 Redirecting to LinkedIn OIDC URL:\n', authUrl, '\n');
  res.redirect(authUrl);
});

// Step 2: Handle LinkedIn callback, exchange code for tokens, persist & mint Firebase token
router.get('/linkedin/callback', async (req, res) => {
  const { code, error, error_description } = req.query;
  if (error) {
    console.error('OAuth Error:', error, error_description);
    return res.status(400).send(`OAuth Error: ${error_description}`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      qs.stringify({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  REDIRECT_URI,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, expires_in, id_token } = tokenRes.data;
    console.log('Received id_token and access_token');

    // Decode the id_token JWT
    const decoded = jwt.decode(id_token);
    const {
      sub: id,
      given_name: firstName,
      family_name: lastName,
      email
    } = decoded;

    // Persist the user in Firestore
    await db.collection('users').doc(id).set({
      id,
      firstName,
      lastName,
      email,
      accessToken: access_token,
      idToken:     id_token,
      expiresIn:   expires_in,
      provider:    'linkedin',
      updatedAt:   admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log('User persisted to Firestore:', id);

    // Mint a Firebase custom auth token
    const firebaseToken = await admin.auth().createCustomToken(id, { provider: 'linkedin' });
    console.log('Minted Firebase custom token for:', id);

    // Return tokens + profile
    res.json({
      accessToken:  access_token,
      idToken:      id_token,
      firebaseToken,
      profile: { id, firstName, lastName, email }
    });

  } catch (e) {
    console.error('Callback handler failed:', e.response?.data || e.message);
    res.status(500).send('OAuth token exchange failed');
  }
});

module.exports = router;
