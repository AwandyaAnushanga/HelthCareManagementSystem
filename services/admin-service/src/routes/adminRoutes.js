const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth, authorize('admin'));

router.put('/verify-doctor/:doctorId', adminController.verifyDoctor);
router.get('/analytics', adminController.getAnalytics);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/doctors', adminController.getDoctors);
router.get('/patients', adminController.getPatients);

module.exports = router;
