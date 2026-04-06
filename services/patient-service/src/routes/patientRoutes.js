const router = require('express').Router();
const patientController = require('../controllers/patientController');
const { auth, authorize } = require('../middleware/auth');
const { updateProfileValidator } = require('../validators/patientValidator');

router.get('/profile', auth, authorize('patient'), patientController.getProfile);
router.put('/profile', auth, authorize('patient'), updateProfileValidator, patientController.updateProfile);
router.get('/medical-history', auth, authorize('patient'), patientController.getMedicalHistory);

// Internal route — used by other services via Docker network
router.get('/internal/:id', patientController.getPatientById);

module.exports = router;
