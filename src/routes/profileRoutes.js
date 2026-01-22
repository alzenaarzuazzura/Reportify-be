const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', profileController.changePassword);

/**
 * @route   GET /profile/login-history
 * @desc    Get user login history
 * @access  Private
 */
router.get('/login-history', profileController.getLoginHistory);

module.exports = router;
