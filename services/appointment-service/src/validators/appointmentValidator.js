const { body } = require('express-validator');

const bookValidator = [
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('doctorName').notEmpty().withMessage('Doctor name is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('timeSlot').matches(/^\d{2}:\d{2}-\d{2}:\d{2}$/).withMessage('Time slot format: HH:MM-HH:MM'),
  body('type').isIn(['in-person', 'video']).withMessage('Type must be in-person or video'),
  body('reason').trim().notEmpty().withMessage('Reason is required'),
];

const statusValidator = [
  body('status').isIn(['confirmed', 'cancelled', 'completed', 'no-show']).withMessage('Invalid status'),
];

const videoLinkValidator = [
  body('videoLink').isURL().withMessage('Valid URL is required'),
];

module.exports = { bookValidator, statusValidator, videoLinkValidator };
