const { verifyToken } = require('../utils/token');

function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'Please sign in again.' });
  }

  req.user = user;
  next();
}

module.exports = requireAuth;
