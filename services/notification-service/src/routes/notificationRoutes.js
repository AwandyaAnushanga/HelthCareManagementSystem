const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/auth');
const { sendNotificationValidator } = require('../validators/notificationValidator');

// ─── User endpoints (any authenticated user) ────────────
router.get('/', auth, notificationController.getUserNotifications);
router.put('/:id/read', auth, notificationController.markAsRead);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.put('/:id/archive', auth, notificationController.archiveNotification);
router.delete('/:id', auth, notificationController.deleteNotification);

// ─── Admin endpoints ────────────────────────────────────
router.post('/send', auth, authorize('admin'), sendNotificationValidator, notificationController.sendNotification);
router.get('/all', auth, authorize('admin'), notificationController.getAllNotifications);
router.get('/stats', auth, authorize('admin'), notificationController.getNotificationStats);

module.exports = router;
