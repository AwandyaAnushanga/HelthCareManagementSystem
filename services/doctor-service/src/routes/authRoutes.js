const router = require('express').Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/doctorValidator');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);

module.exports = router;
