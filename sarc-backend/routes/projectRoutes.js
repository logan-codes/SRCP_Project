const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', projectController.getProjects);
router.get('/ideas', projectController.getProjectIdeas);
router.get('/:id', projectController.getProjectById);
router.post('/', auth, auth.checkRole('FACULTY'), upload.fields([
    { name: 'proposalFile', maxCount: 1 },
    { name: 'documentationFile', maxCount: 1 },
    { name: 'demoFile', maxCount: 1 },
    { name: 'imageFiles', maxCount: 5 }
]), projectController.createProject);
router.post('/ideas', auth, auth.checkRole('STUDENT'), upload.single('supportingFile'), projectController.createProjectIdea);
router.put('/:id', auth, auth.checkRole('FACULTY'), projectController.updateProject);

module.exports = router;
