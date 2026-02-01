const express = require('express');
const router = express.Router();
const teachingAssignmentController = require('../controllers/teachingAssignmentController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/check', teachingAssignmentController.checkTeachingAssignment);
router.get('/', teachingAssignmentController.getAllTeachingAssignments);
router.get('/:id', teachingAssignmentController.getTeachingAssignmentById);
router.post('/', teachingAssignmentController.createTeachingAssignment);
router.put('/:id', teachingAssignmentController.updateTeachingAssignment);
router.delete('/:id', teachingAssignmentController.deleteTeachingAssignment);

module.exports = router;
