const jwt = require('jsonwebtoken');

// ─── In-memory token blacklist (use Redis in production) ──
const tokenBlacklist = new Set();

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];

    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// Fine-grained permission check for admin sub-roles
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userPermissions = req.user.permissions || {};
    const hasPermission = permissions.every((perm) => userPermissions[perm] === true);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'You do not have the required permissions for this action',
      });
    }
    next();
  };
};

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

module.exports = { auth, authorize, requirePermission, blacklistToken, tokenBlacklist };
