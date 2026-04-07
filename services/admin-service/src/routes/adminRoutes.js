const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { auth, authorize, requirePermission } = require('../middleware/auth');
const { updateAdminValidator } = require('../validators/adminValidator');

// All admin routes require authentication + admin role
router.use(auth, authorize('admin'));

// ─── Doctor Management ──────────────────────────────────
router.put('/verify-doctor/:doctorId', requirePermission('verifyDoctors'), adminController.verifyDoctor);
router.put('/reject-doctor/:doctorId', requirePermission('verifyDoctors'), adminController.rejectDoctor);
router.get('/doctors', requirePermission('manageDoctors'), adminController.getDoctors);

// ─── Patient Management ─────────────────────────────────
router.get('/patients', requirePermission('managePatients'), adminController.getPatients);

// ─── Admin Management ───────────────────────────────────
router.get('/admins', requirePermission('manageAdmins'), adminController.getAllAdmins);
router.put('/admins/:id', requirePermission('manageAdmins'), updateAdminValidator, adminController.updateAdmin);
router.put('/admins/:id/deactivate', requirePermission('manageAdmins'), adminController.deactivateAdmin);
router.put('/admins/:id/reactivate', requirePermission('manageAdmins'), adminController.reactivateAdmin);

// ─── Analytics & Audit ──────────────────────────────────
router.get('/analytics', requirePermission('viewAnalytics'), adminController.getAnalytics);
router.get('/audit-logs', requirePermission('viewAnalytics'), adminController.getAuditLogs);
router.get('/audit-stats', requirePermission('viewAnalytics'), adminController.getAuditStats);

module.exports = router;
