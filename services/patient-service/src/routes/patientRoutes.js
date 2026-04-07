const router = require('express').Router();
const patientController = require('../controllers/patientController');
const { auth, authorize } = require('../middleware/auth');
const { updateProfileValidator, changePasswordValidator } = require('../validators/patientValidator');

// ─── Authenticated patient endpoints ────────────────────
router.get('/profile', auth, authorize('patient'), patientController.getProfile);
router.put('/profile', auth, authorize('patient'), updateProfileValidator, patientController.updateProfile);
router.put('/change-password', auth, authorize('patient'), changePasswordValidator, patientController.changePassword);
router.put('/deactivate', auth, authorize('patient'), patientController.deactivateAccount);
router.get('/medical-history', auth, authorize('patient'), patientController.getMedicalHistory);

// ─── Internal routes — used by other services via Docker network ─
// Static route MUST come before parameterized route
router.get('/internal/all', patientController.getAllPatients);
router.get('/internal/:id', patientController.getPatientById);

module.exports = router;
