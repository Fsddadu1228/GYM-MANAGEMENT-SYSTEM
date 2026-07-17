const express = require('express');
const User = require('../models/User');
const { createToken } = require('../utils/token');
const { verifyPassword } = require('../utils/password');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function publicUser(user) {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role
  };
}

function getLoginAttemptKey(req, login) {
  return `${req.ip || 'unknown'}:${login}`;
}

function isLoginLimited(key) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 0, firstAttemptAt: now });
    return false;
  }
  return record.count >= MAX_LOGIN_ATTEMPTS;
}

function recordFailedLogin(key) {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, firstAttemptAt: now };
  if (now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now });
    return;
  }
  record.count += 1;
  loginAttempts.set(key, record);
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const login = String(username || '').toLowerCase().trim();
    const attemptKey = getLoginAttemptKey(req, login);

    if (!login || !password) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    if (isLoginLimited(attemptKey)) {
      return res.status(429).json({ error: 'Too many failed attempts. Please try again later.' });
    }

    const user = await User.findOne({
      $or: [
        { username: login },
        { email: login }
      ]
    });

    if (!user || !user.active || !verifyPassword(password || '', user.passwordHash)) {
      recordFailedLogin(attemptKey);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    loginAttempts.delete(attemptKey);

    res.json({
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (err) {
    console.error('Login failed:', err.message);
    res.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user || !user.active) return res.status(401).json({ error: 'Please sign in again.' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Session check failed:', err.message);
    res.status(500).json({ error: 'Unable to verify session.' });
  }
});

module.exports = router;
