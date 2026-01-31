const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @route   GET /reports/attendance
 * @desc    Get attendance report
 * @access  Private (Admin only)
 */
router.get('/attendance', reportController.getAttendanceReport);

/**
 * @route   GET /reports/assignment
 * @desc    Get assignment report
 * @access  Private (Admin only)
 */
router.get('/assignment', reportController.getAssignmentReport);

/**
 * @route   GET /reports/teacher-activity
 * @desc    Get teacher activity report
 * @access  Private (Admin only)
 */
router.get('/teacher-activity', reportController.getTeacherActivityReport);

/**
 * @route   GET /reports/student-performance
 * @desc    Get student performance report
 * @access  Private (Admin only)
 */
router.get('/student-performance', reportController.getStudentPerformanceReport);

/**
 * @route   GET /reports/class-summary
 * @desc    Get class summary report
 * @access  Private (Admin only)
 */
router.get('/class-summary', reportController.getClassSummaryReport);

/**
 * @route   GET /reports/notification
 * @desc    Get notification report (WhatsApp messages)
 * @access  Private (Admin only)
 */
router.get('/notification', reportController.getNotificationReport);

module.exports = router;
