const router = require('express').Router();
const appointmentController = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');
const {
  bookValidator,
  statusValidator,
  videoLinkValidator,
  rescheduleValidator,
  doctorNotesValidator,
} = require('../validators/appointmentValidator');

// ─── Patient endpoints ──────────────────────────────────
router.post('/book', auth, authorize('patient'), bookValidator, appointmentController.bookAppointment);
router.get('/my-appointments', auth, authorize('patient'), appointmentController.getPatientAppointments);

// ─── Doctor endpoints ───────────────────────────────────
router.get('/doctor-appointments', auth, authorize('doctor'), appointmentController.getDoctorAppointments);
router.put('/:id/video-link', auth, authorize('doctor', 'admin'), videoLinkValidator, appointmentController.addVideoLink);
router.put('/:id/doctor-notes', auth, authorize('doctor', 'admin'), doctorNotesValidator, appointmentController.addDoctorNotes);

// ─── Admin endpoints ────────────────────────────────────
router.get('/all', auth, authorize('admin'), appointmentController.getAllAppointments);
router.get('/stats', auth, authorize('admin'), appointmentController.getAppointmentStats);

// ─── Shared (ownership verified in controller) ──────────
router.get('/:id', auth, appointmentController.getAppointmentById);
router.put('/:id/status', auth, statusValidator, appointmentController.updateStatus);
router.post('/:id/reschedule', auth, rescheduleValidator, appointmentController.rescheduleAppointment);

module.exports = router;
