const express = require('express');
const router = express.Router();
const majorController = require('../controllers/majorController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/', majorController.getAllMajors);
router.get('/:id', majorController.getMajorById);
router.post('/', majorController.createMajor);
router.put('/:id', majorController.updateMajor);
router.delete('/:id', majorController.deleteMajor);

module.exports = router;
