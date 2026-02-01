require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
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
const reportRoutes = require('./routes/reportRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Add headers for private network access
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  abortOnLimit: true,
  responseOnLimit: 'File terlalu besar. Maksimal 10MB'
}));

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
app.use('/reportify/reports', reportRoutes);
app.use('/reportify/profile', profileRoutes);

// Cron job untuk mengirim notifikasi setelah jam pelajaran selesai
cron.schedule('*/5 * * * *', async () => {
  await scheduleNotifications();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
