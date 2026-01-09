const express = require('express');
const router = express.Router();
const comboController = require('../controllers/comboController');
const { authenticate } = require('../middleware/authMiddleware');

// Apply authentication middleware to all combo routes
router.use(authenticate);

/**
 * @route   GET /combo/levels
 * @desc    Get all levels for combo select
 * @access  Private
 */
router.get('/levels', comboController.getLevelsCombo);

/**
 * @route   GET /combo/levels
 * @desc    Get all levels for combo select
 * @access  Private
 */
router.get('/subjects'), comboController.getSubjectsCombo

/**
 * @route   GET /combo/majors
 * @desc    Get all majors for combo select
 * @access  Private
 */
router.get('/majors', comboController.getMajorsCombo);

/**
 * @route   GET /combo/rombels
 * @desc    Get all rombels for combo select
 * @access  Private
 */
router.get('/rombels', comboController.getRombelsCombo);

/**
 * @route   GET /combo/roles
 * @desc    Get all roles for combo select (static)
 * @access  Private
 */
router.get('/roles', comboController.getRolesCombo);

/**
 * @route   GET /combo/teachers
 * @desc    Get all teachers for combo select
 * @access  Private
 */
router.get('/teachers', comboController.getTeachersCombo);

/**
 * @route   GET /combo/students
 * @desc    Get all students for combo select
 * @access  Private
 */
router.get('/students', comboController.getStudentsCombo);

module.exports = router;
