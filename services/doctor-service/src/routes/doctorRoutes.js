const router = require('express').Router();
const doctorController = require('../controllers/doctorController');
const { auth, authorize } = require('../middleware/auth');
const { availabilityValidator } = require('../validators/doctorValidator');

// Public
router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:doctorId/availability', doctorController.getAvailability);

// Doctor-only
router.get('/me/profile', auth, authorize('doctor'), doctorController.getProfile);
router.put('/me/profile', auth, authorize('doctor'), doctorController.updateProfile);
router.put('/me/availability', auth, authorize('doctor'), availabilityValidator, doctorController.setAvailability);

// Internal — used by Appointment Service via Docker network
router.get('/internal/check-availability', doctorController.checkSlotAvailability);

module.exports = router;
