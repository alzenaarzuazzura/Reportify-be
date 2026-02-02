const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorizeAdmin, authorizeTeacher } = require('../middleware/authMiddleware');

// Routes for teachers
router.get('/my-schedules', authenticate, authorizeTeacher, scheduleController.getMySchedules);

// Routes for admin only
router.use(authenticate);
router.use(authorizeAdmin);

router.get('/check', scheduleController.checkScheduleConflict);
router.get('/', scheduleController.getAllSchedules);
router.get('/:id', scheduleController.getScheduleById);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
