const crypto = require('crypto');

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;
const AUTH_SECRET = process.env.AUTH_SECRET;

if (!AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(payload) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
}

function createToken(user) {
  const payload = encode({
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + TOKEN_TTL_MS
  });
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  try {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature) return null;

    const expectedSignature = sign(payload);
    if (signature.length !== expectedSignature.length) return null;
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.expiresAt || decoded.expiresAt < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

module.exports = {
  createToken,
  verifyToken
};
