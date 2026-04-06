const router = require('express').Router();
const appointmentController = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');
const { bookValidator, statusValidator, videoLinkValidator } = require('../validators/appointmentValidator');

// Patient endpoints
router.post('/book', auth, authorize('patient'), bookValidator, appointmentController.bookAppointment);
router.get('/my-appointments', auth, authorize('patient'), appointmentController.getPatientAppointments);

// Doctor endpoints
router.get('/doctor-appointments', auth, authorize('doctor'), appointmentController.getDoctorAppointments);
router.put('/:id/video-link', auth, authorize('doctor', 'admin'), videoLinkValidator, appointmentController.addVideoLink);

// Shared
router.get('/:id', auth, appointmentController.getAppointmentById);
router.put('/:id/status', auth, statusValidator, appointmentController.updateStatus);

module.exports = router;
