require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { scheduleNotifications } = require('./services/notificationService');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const levelRoutes = require('./routes/levelRoutes');
const majorRoutes = require('./routes/majorRoutes');
const rombelRoutes = require('./routes/rombelRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const teachingAssignmentRoutes = require('./routes/teachingAssignmentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const comboRoutes = require('./routes/comboRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/reportify/auth', authRoutes);
app.use('/reportify/users', userRoutes);
app.use('/reportify/students', studentRoutes);
app.use('/reportify/classes', classRoutes);
app.use('/reportify/levels', levelRoutes);
app.use('/reportify/majors', majorRoutes);
app.use('/reportify/rombels', rombelRoutes);
app.use('/reportify/subjects', subjectRoutes);
app.use('/reportify/teaching-assignments', teachingAssignmentRoutes);
app.use('/reportify/schedules', scheduleRoutes);
app.use('/reportify/attendances', attendanceRoutes);
app.use('/reportify/assignments', assignmentRoutes);
app.use('/reportify/announcements', announcementRoutes);
app.use('/reportify/combo', comboRoutes);

// Cron job untuk mengirim notifikasi setelah jam pelajaran selesai
cron.schedule('*/5 * * * *', async () => {
  console.log('Checking for notifications to send...');
  await scheduleNotifications();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
