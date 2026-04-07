const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const createAdminValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const updateAdminValidator = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().matches(/^\+?[\d\s-]{7,15}$/).withMessage('Invalid phone number'),
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'moderator'])
    .withMessage('Invalid admin role'),
  body('permissions').optional().isObject().withMessage('Permissions must be an object'),
];

module.exports = { loginValidator, createAdminValidator, updateAdminValidator };
