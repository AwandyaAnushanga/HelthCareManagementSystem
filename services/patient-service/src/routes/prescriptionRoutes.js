const router = require('express').Router();
const prescriptionController = require('../controllers/prescriptionController');
const { auth, authorize } = require('../middleware/auth');
const { createPrescriptionValidator, updatePrescriptionValidator } = require('../validators/prescriptionValidator');

// ─── Patient endpoints ──────────────────────────────────
router.get('/my-prescriptions', auth, authorize('patient'), prescriptionController.getPatientPrescriptions);

// ─── Doctor endpoints ───────────────────────────────────
router.post('/', auth, authorize('doctor'), createPrescriptionValidator, prescriptionController.createPrescription);
router.get('/doctor-prescriptions', auth, authorize('doctor'), prescriptionController.getDoctorPrescriptions);
router.put('/:id/cancel', auth, authorize('doctor', 'admin'), prescriptionController.cancelPrescription);

// ─── Shared (ownership verified in controller) ──────────
router.get('/:id', auth, prescriptionController.getPrescriptionById);
router.put('/:id', auth, authorize('doctor', 'admin'), updatePrescriptionValidator, prescriptionController.updatePrescription);

module.exports = router;
