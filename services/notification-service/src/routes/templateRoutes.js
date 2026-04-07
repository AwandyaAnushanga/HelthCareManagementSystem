const router = require('express').Router();
const templateController = require('../controllers/templateController');
const { auth, authorize } = require('../middleware/auth');
const { createTemplateValidator, updateTemplateValidator } = require('../validators/notificationValidator');

// All template routes require admin access
router.use(auth, authorize('admin'));

router.get('/', templateController.getAllTemplates);
router.get('/type/:type', templateController.getTemplateByType);
router.get('/:id', templateController.getTemplateById);
router.post('/', createTemplateValidator, templateController.createTemplate);
router.put('/:id', updateTemplateValidator, templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);
router.post('/:id/preview', templateController.previewTemplate);

module.exports = router;
