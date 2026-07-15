const express = require('express');
const User = require('../models/User');
const { createToken } = require('../utils/token');
const { verifyPassword } = require('../utils/password');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function publicUser(user) {
  return {
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role
  };
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: String(username || '').toLowerCase().trim() });

    if (!user || !user.active || !verifyPassword(password || '', user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.json({
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user || !user.active) return res.status(401).json({ error: 'Please sign in again.' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
