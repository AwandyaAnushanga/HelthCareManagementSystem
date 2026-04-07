const { body } = require('express-validator');

const registerValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('consultationFee').isNumeric().withMessage('Consultation fee must be a number'),
];

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const availabilityValidator = [
  body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day must be 0-6 (Sun-Sat)'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Start time format: HH:MM'),
  body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('End time format: HH:MM'),
  body('slotDuration').optional().isInt({ min: 15, max: 120 }).withMessage('Slot 15-120 minutes'),
];

const overrideValidator = [
  body('date').isISO8601().withMessage('Valid date is required (ISO 8601)'),
  body('isAvailable').isBoolean().withMessage('isAvailable must be true or false'),
  body('reason').optional().trim().isLength({ max: 200 }).withMessage('Reason max 200 characters'),
  body('startTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('Start time format: HH:MM'),
  body('endTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('End time format: HH:MM'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must differ from current password');
      }
      return true;
    }),
];

module.exports = {
  registerValidator,
  loginValidator,
  availabilityValidator,
  overrideValidator,
  changePasswordValidator,
};
