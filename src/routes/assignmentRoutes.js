const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticate, authorizeTeacher } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorizeTeacher);

router.get('/', assignmentController.getAllAssignments);
router.get('/:id', assignmentController.getAssignmentById);
router.post('/', assignmentController.createAssignment);
router.put('/:id', assignmentController.updateAssignment);
router.delete('/:id', assignmentController.deleteAssignment);
router.put('/student-assignments/:id', assignmentController.updateStudentAssignment);

module.exports = router;
