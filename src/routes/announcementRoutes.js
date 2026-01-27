const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticate, authorizeTeacher } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(authorizeTeacher);

router.get('/my', announcementController.getMyAnnouncements);
router.get('/', announcementController.getAllAnnouncements);
router.get('/:id', announcementController.getAnnouncementById);
router.post('/', announcementController.createAnnouncement);
router.put('/:id', announcementController.updateAnnouncement);
router.delete('/:id', announcementController.deleteAnnouncement);

module.exports = router;
