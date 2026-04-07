const router = require('express').Router();
const doctorController = require('../controllers/doctorController');
const { auth, authorize } = require('../middleware/auth');
const {
  availabilityValidator,
  overrideValidator,
  changePasswordValidator,
} = require('../validators/doctorValidator');

// ─── Public ─────────────────────────────────────────────
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:doctorId/availability', doctorController.getAvailability);
router.get('/:doctorId/slots', doctorController.getSlots);

// ─── Doctor-only ────────────────────────────────────────
router.get('/me/profile', auth, authorize('doctor'), doctorController.getProfile);
router.put('/me/profile', auth, authorize('doctor'), doctorController.updateProfile);
router.put('/me/change-password', auth, authorize('doctor'), changePasswordValidator, doctorController.changePassword);

// Availability management
router.put('/me/availability', auth, authorize('doctor'), availabilityValidator, doctorController.setAvailability);
router.delete('/me/availability/:dayOfWeek', auth, authorize('doctor'), doctorController.deleteAvailability);

// Date-specific overrides
router.post('/me/availability/overrides', auth, authorize('doctor'), overrideValidator, doctorController.addOverride);
router.delete('/me/availability/overrides/:overrideId', auth, authorize('doctor'), doctorController.removeOverride);

// ─── Internal — used by other services via Docker network ─
router.get('/internal/check-availability', doctorController.checkSlotAvailability);
router.put('/internal/verify/:doctorId', doctorController.verifyDoctor);

module.exports = router;
