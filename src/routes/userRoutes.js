const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorizeAdmin);

router.post('/import', userController.importFromExcel);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/:id/send-password-setup', userController.sendPasswordSetupLink);

module.exports = router;
