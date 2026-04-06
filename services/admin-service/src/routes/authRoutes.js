const router = require('express').Router();
const authController = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');
const { loginValidator, createAdminValidator } = require('../validators/adminValidator');

router.post('/login', loginValidator, authController.login);
router.post('/create', auth, authorize('admin'), createAdminValidator, authController.createAdmin);

module.exports = router;
