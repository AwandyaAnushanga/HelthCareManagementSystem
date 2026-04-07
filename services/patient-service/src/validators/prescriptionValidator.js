const { body, param } = require('express-validator');

const createPrescriptionValidator = [
  body('patientId').isMongoId().withMessage('Valid patient ID is required'),
  body('patientName').trim().notEmpty().withMessage('Patient name is required'),
  body('doctorName').trim().notEmpty().withMessage('Doctor name is required'),
  body('diagnosis')
    .trim()
    .notEmpty()
    .withMessage('Diagnosis is required')
    .isLength({ max: 500 })
    .withMessage('Diagnosis cannot exceed 500 characters'),
  body('medications')
    .isArray({ min: 1 })
    .withMessage('At least one medication is required'),
  body('medications.*.name')
    .trim()
    .notEmpty()
    .withMessage('Medication name is required'),
  body('medications.*.dosage')
    .trim()
    .notEmpty()
    .withMessage('Dosage is required'),
  body('medications.*.frequency')
    .isIn([
      'once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily',
      'every_6_hours', 'every_8_hours', 'every_12_hours', 'once_weekly',
      'as_needed', 'before_meals', 'after_meals', 'at_bedtime', 'custom',
    ])
    .withMessage('Invalid frequency'),
  body('medications.*.duration.value')
    .isInt({ min: 1 })
    .withMessage('Duration value must be at least 1'),
  body('medications.*.duration.unit')
    .optional()
    .isIn(['days', 'weeks', 'months'])
    .withMessage('Duration unit must be days, weeks, or months'),
  body('validUntil')
    .isISO8601()
    .withMessage('Valid-until date is required (ISO 8601)'),
];

const updatePrescriptionValidator = [
  param('id').isMongoId().withMessage('Valid prescription ID is required'),
  body('status')
    .optional()
    .isIn(['active', 'completed', 'cancelled', 'expired'])
    .withMessage('Invalid prescription status'),
  body('dispensedBy')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Dispensed-by pharmacy name is required'),
];

module.exports = { createPrescriptionValidator, updatePrescriptionValidator };
