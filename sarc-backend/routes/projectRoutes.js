const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const cacheResponse = require('../middleware/cacheMiddleware');

// Note: These routes are public. cacheResponse intentionally stores them under the 'anonymous' key.
router.get('/', cacheResponse(300), projectController.getProjects);
router.get('/ideas', cacheResponse(300), projectController.getProjectIdeas);
router.get('/:id', projectController.getProjectById);
router.post('/', auth, auth.checkRole('FACULTY'), projectController.createProject);
router.post('/ideas', auth, auth.checkRole('FACULTY'), projectController.createProjectIdea);
router.put('/:id', auth, auth.checkRole('FACULTY'), projectController.updateProject);
router.delete('/:id', auth, auth.checkRole('ADMIN'), projectController.deleteProject);
router.delete('/ideas/:id', auth, auth.checkRole('ADMIN'), projectController.deleteProjectIdea);

module.exports = router;
