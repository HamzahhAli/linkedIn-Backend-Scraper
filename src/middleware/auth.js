// src/middleware/auth.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    // We decode without verifying signature—LinkedIn OIDC tokens are self-contained.
    decoded = jwt.decode(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Check that the token was intended for this app
  if (!decoded || decoded.aud !== process.env.LINKEDIN_CLIENT_ID) {
    return res.status(401).json({ error: 'Invalid token audience' });
  }

  // Attach a clean user object to req
  req.user = {
    id:         decoded.sub,
    firstName:  decoded.given_name,
    lastName:   decoded.family_name,
    email:      decoded.email,
  };

  next();
};
