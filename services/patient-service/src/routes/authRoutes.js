const router = require('express').Router();
const authController = require('../controllers/authController');
const { auth, blacklistToken } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { registerValidator, loginValidator } = require('../validators/patientValidator');

router.post('/register', authRateLimiter, registerValidator, authController.register);
router.post('/login', authRateLimiter, loginValidator, authController.login);
router.post('/logout', auth, (req, res) => {
  blacklistToken(req.token);
  res.json({ message: 'Logged out successfully' });
});
router.get('/me', auth, authController.getProfile);

module.exports = router;
