const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { registerUser, loginUser } = require('../controllers/authController');
const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '30d' });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Email/Password routes (kept for optional email login)
router.post('/register', registerUser);
router.post('/login', loginUser);

// ─── Google OAuth ────────────────────────────────────────────────────────────
// Step 1: Redirect user to Google's consent screen
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Step 2: Google redirects back here after user approves
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` }),
  (req, res) => {
    // Generate a JWT for the authenticated Google user
    const token = generateToken(req.user._id);

    const userData = encodeURIComponent(
      JSON.stringify({
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        token,
      })
    );

    // Redirect to frontend with token + user in URL params
    res.redirect(`${FRONTEND_URL}/auth/callback?data=${userData}`);
  }
);

module.exports = router;
