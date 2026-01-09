const express = require('express');
const router = express.Router();
const rombelController = require('../controllers/rombelController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorizeAdmin);

router.get('/', rombelController.getAllRombels);
router.get('/:id', rombelController.getRombelById);
router.post('/', rombelController.createRombel);
router.put('/:id', rombelController.updateRombel);
router.delete('/:id', rombelController.deleteRombel);

module.exports = router;
