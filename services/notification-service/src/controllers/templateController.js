const { validationResult } = require('express-validator');
const NotificationTemplate = require('../models/NotificationTemplate');

// ─── Get All Templates ──────────────────────────────────
exports.getAllTemplates = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const templates = await NotificationTemplate.find(filter).sort({ type: 1 });
    res.json(templates);
  } catch (err) {
    next(err);
  }
};

// ─── Get Template by ID ─────────────────────────────────
exports.getTemplateById = async (req, res, next) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    next(err);
  }
};

// ─── Get Template by Type ───────────────────────────────
exports.getTemplateByType = async (req, res, next) => {
  try {
    const template = await NotificationTemplate.findOne({ type: req.params.type, isActive: true });
    if (!template) return res.status(404).json({ error: 'No active template found for this type' });
    res.json(template);
  } catch (err) {
    next(err);
  }
};

// ─── Create Template ────────────────────────────────────
exports.createTemplate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const existing = await NotificationTemplate.findOne({ type: req.body.type });
    if (existing) {
      return res.status(409).json({ error: 'A template for this type already exists' });
    }

    const template = await NotificationTemplate.create(req.body);
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

// ─── Update Template ────────────────────────────────────
exports.updateTemplate = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const template = await NotificationTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (err) {
    next(err);
  }
};

// ─── Delete Template ────────────────────────────────────
exports.deleteTemplate = async (req, res, next) => {
  try {
    const template = await NotificationTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    next(err);
  }
};

// ─── Preview Template Rendering ─────────────────────────
exports.previewTemplate = async (req, res, next) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const rendered = template.render(req.body.variables || {});
    res.json(rendered);
  } catch (err) {
    next(err);
  }
};
