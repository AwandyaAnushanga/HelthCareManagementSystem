const { body, param } = require('express-validator');

const NOTIFICATION_TYPES = [
  'appointment_booked', 'appointment_confirmed', 'appointment_cancelled',
  'appointment_completed', 'appointment_rescheduled', 'appointment_reminder',
  'video_link_added', 'prescription_issued', 'medical_record_created',
  'doctor_verified', 'account_deactivated', 'welcome', 'password_reset', 'general',
];

const sendNotificationValidator = [
  body('userId').trim().notEmpty().withMessage('User ID is required'),
  body('userRole').isIn(['patient', 'doctor', 'admin']).withMessage('Invalid user role'),
  body('type').isIn(NOTIFICATION_TYPES).withMessage('Invalid notification type'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title max 200 characters'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message max 1000 characters'),
  body('channel')
    .optional()
    .isIn(['email', 'in-app', 'both'])
    .withMessage('Channel must be email, in-app, or both'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority'),
];

const createTemplateValidator = [
  body('name').trim().notEmpty().withMessage('Template name is required'),
  body('type').isIn([
    'appointment_booked', 'appointment_confirmed', 'appointment_cancelled',
    'appointment_reminder', 'video_link_added', 'prescription_issued',
    'doctor_verified', 'welcome_patient', 'welcome_doctor', 'password_reset', 'general',
  ]).withMessage('Invalid template type'),
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject max 200 characters'),
  body('htmlBody').trim().notEmpty().withMessage('HTML body is required'),
  body('variables').optional().isArray().withMessage('Variables must be an array'),
  body('variables.*.name').optional().trim().notEmpty().withMessage('Variable name is required'),
];

const updateTemplateValidator = [
  param('id').isMongoId().withMessage('Valid template ID is required'),
  body('subject').optional().trim().isLength({ max: 200 }).withMessage('Subject max 200 characters'),
  body('htmlBody').optional().trim().notEmpty().withMessage('HTML body cannot be empty'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

module.exports = {
  sendNotificationValidator,
  createTemplateValidator,
  updateTemplateValidator,
};
