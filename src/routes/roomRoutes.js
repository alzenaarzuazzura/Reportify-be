const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @route   GET /rooms
 * @desc    Get all rooms
 * @access  Private (Admin only)
 */
router.get('/', roomController.getRooms);

/**
 * @route   GET /rooms/:id
 * @desc    Get room by ID
 * @access  Private (Admin only)
 */
router.get('/:id', roomController.getRoomById);

/**
 * @route   POST /rooms
 * @desc    Create new room
 * @access  Private (Admin only)
 */
router.post('/', roomController.createRoom);

/**
 * @route   PUT /rooms/:id
 * @desc    Update room
 * @access  Private (Admin only)
 */
router.put('/:id', roomController.updateRoom);

/**
 * @route   DELETE /rooms/:id
 * @desc    Delete room
 * @access  Private (Admin only)
 */
router.delete('/:id', roomController.deleteRoom);

module.exports = router;