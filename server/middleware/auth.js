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

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

requireAuth.requireRole = requireRole;

module.exports = requireAuth;
