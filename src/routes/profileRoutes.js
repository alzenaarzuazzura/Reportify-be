const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /profile
 * @desc    Get current user profile
 * @access  Private (all authenticated users)
 */
router.get('/', profileController.getProfile);

/**
 * @route   POST /profile/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', profileController.changePassword);

module.exports = router;
