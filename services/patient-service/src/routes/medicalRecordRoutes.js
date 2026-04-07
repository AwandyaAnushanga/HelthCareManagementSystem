const router = require('express').Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { auth, authorize } = require('../middleware/auth');
const { createMedicalRecordValidator, updateMedicalRecordValidator } = require('../validators/medicalRecordValidator');

// ─── Patient endpoints ──────────────────────────────────
router.get('/my-records', auth, authorize('patient'), medicalRecordController.getPatientRecords);

// ─── Doctor endpoints ───────────────────────────────────
router.post('/', auth, authorize('doctor'), createMedicalRecordValidator, medicalRecordController.createRecord);
router.get('/doctor-records', auth, authorize('doctor'), medicalRecordController.getDoctorRecords);

// ─── Shared (ownership verified in controller) ──────────
router.get('/:id', auth, medicalRecordController.getRecordById);
router.put('/:id', auth, authorize('doctor', 'admin'), updateMedicalRecordValidator, medicalRecordController.updateRecord);

// ─── Internal (service-to-service) ──────────────────────
router.get('/internal/by-appointment/:appointmentId', medicalRecordController.getRecordsByAppointment);

module.exports = router;
