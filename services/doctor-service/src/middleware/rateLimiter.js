// ─── In-memory rate limiter for auth endpoints ─────────
// In production, use a Redis-backed limiter (e.g., rate-limit-redis)
const attempts = new Map();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10; // max attempts per window

const authRateLimiter = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();

  if (!attempts.has(key)) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  const record = attempts.get(key);

  if (now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  record.count++;

  if (record.count > MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter,
    });
  }

  next();
};

// Cleanup expired entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of attempts) {
    if (now > record.resetAt) {
      attempts.delete(key);
    }
  }
}, 30 * 60 * 1000).unref();

module.exports = { authRateLimiter };
