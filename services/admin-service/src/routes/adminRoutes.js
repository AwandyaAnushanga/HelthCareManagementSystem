const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { auth, authorize, requirePermission } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(auth, authorize('admin'));

// Doctor management — requires manageDoctors or verifyDoctors permission
router.put('/verify-doctor/:doctorId', requirePermission('verifyDoctors'), adminController.verifyDoctor);
router.get('/doctors', requirePermission('manageDoctors'), adminController.getDoctors);

// Patient management
router.get('/patients', requirePermission('managePatients'), adminController.getPatients);

// Analytics & audit — requires viewAnalytics permission
router.get('/analytics', requirePermission('viewAnalytics'), adminController.getAnalytics);
router.get('/audit-logs', requirePermission('viewAnalytics'), adminController.getAuditLogs);

module.exports = router;
