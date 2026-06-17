const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const cacheResponse = require('../middleware/cacheMiddleware');

router.get('/', cacheResponse(300), projectController.getProjects);
router.get('/ideas', cacheResponse(300), projectController.getProjectIdeas);
router.get('/:id', projectController.getProjectById);
router.post('/', auth, auth.checkRole('FACULTY'), projectController.createProject);
router.post('/ideas', auth, auth.checkRole('FACULTY'), projectController.createProjectIdea);
router.put('/:id', auth, auth.checkRole('FACULTY'), projectController.updateProject);

module.exports = router;
