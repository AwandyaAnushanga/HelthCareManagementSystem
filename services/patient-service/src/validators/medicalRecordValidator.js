const { body, param } = require('express-validator');

const createMedicalRecordValidator = [
  body('patientId').isMongoId().withMessage('Valid patient ID is required'),
  body('doctorName').trim().notEmpty().withMessage('Doctor name is required'),
  body('chiefComplaint')
    .trim()
    .notEmpty()
    .withMessage('Chief complaint is required')
    .isLength({ max: 500 })
    .withMessage('Chief complaint cannot exceed 500 characters'),
  body('visitType')
    .optional()
    .isIn(['initial', 'follow-up', 'emergency', 'routine-checkup', 'specialist-referral'])
    .withMessage('Invalid visit type'),
  body('diagnosis')
    .isArray({ min: 1 })
    .withMessage('At least one diagnosis is required'),
  body('diagnosis.*.description')
    .trim()
    .notEmpty()
    .withMessage('Diagnosis description is required'),
  body('diagnosis.*.type')
    .optional()
    .isIn(['primary', 'secondary', 'differential'])
    .withMessage('Invalid diagnosis type'),
  body('vitalSigns.bloodPressure.systolic')
    .optional()
    .isInt({ min: 50, max: 300 })
    .withMessage('Systolic BP must be 50-300'),
  body('vitalSigns.bloodPressure.diastolic')
    .optional()
    .isInt({ min: 30, max: 200 })
    .withMessage('Diastolic BP must be 30-200'),
  body('vitalSigns.heartRate')
    .optional()
    .isInt({ min: 20, max: 250 })
    .withMessage('Heart rate must be 20-250'),
  body('vitalSigns.temperature')
    .optional()
    .isFloat({ min: 30, max: 45 })
    .withMessage('Temperature must be 30-45°C'),
  body('status')
    .optional()
    .isIn(['draft', 'finalized', 'amended'])
    .withMessage('Invalid status'),
];

const updateMedicalRecordValidator = [
  param('id').isMongoId().withMessage('Valid record ID is required'),
  body('chiefComplaint')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Chief complaint cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'finalized', 'amended'])
    .withMessage('Invalid status'),
  body('amendmentReason')
    .if(body('status').equals('amended'))
    .trim()
    .notEmpty()
    .withMessage('Amendment reason is required when amending a record'),
];

module.exports = { createMedicalRecordValidator, updateMedicalRecordValidator };
