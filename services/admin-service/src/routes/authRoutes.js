const router = require('express').Router();
const authController = require('../controllers/authController');
const { auth, authorize, requirePermission, blacklistToken } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const { loginValidator, createAdminValidator } = require('../validators/adminValidator');

router.post('/login', authRateLimiter, loginValidator, authController.login);
router.post('/create', auth, authorize('admin'), requirePermission('manageAdmins'), createAdminValidator, authController.createAdmin);
router.post('/logout', auth, (req, res) => {
  blacklistToken(req.token);
  res.json({ message: 'Logged out successfully' });
});
router.get('/me', auth, authorize('admin'), authController.getProfile);

module.exports = router;
