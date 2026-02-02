const { PrismaClient } = require('@prisma/client');
const whatsappService = require('./whatsappService');

const prisma = new PrismaClient();

/**
 * SHARED FUNCTION: Build class session report message
 * Digunakan oleh notificationService dan attendanceService
 * @param {Object} params - Message parameters
 * @returns {string} Formatted WhatsApp message
 */
const buildSessionReportMessage = ({
  studentName,
  className,
  subjectName,
  teacherName,
  timeSlot,
  date,
  attendanceStatus,
  attendanceNote,
  assignments,
  announcements
}) => {
  let message = `*LAPORAN KEGIATAN BELAJAR*\n\n`;
  message += `Yth. Orang Tua/Wali dari *${studentName}*\n\n`;
  message += `Kami sampaikan informasi pembelajaran dengan detail sebagai berikut:\n\n`;
  message += `Tanggal: ${new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  message += `Mata Pelajaran: ${subjectName}\n`;
  message += `Guru: ${teacherName}\n`;
  message += `Kelas: ${className}\n`;
  message += `Waktu: ${timeSlot}\n\n`;
  
  // Attendance status
  message += `*KEHADIRAN*\n`;
  const statusEmoji = {
    'hadir': '✅',
    'Hadir': '✅',
    'izin': '📝',
    'Izin': '📝',
    'alfa': '❌',
    'Alpha': '❌',
    'Belum diabsen': '⏳'
  };
  message += `${statusEmoji[attendanceStatus] || '❓'} Status: ${attendanceStatus.toUpperCase()}\n`;
  if (attendanceNote) {
    message += `📌 Catatan: ${attendanceNote}\n`;
  }
  message += `\n`;

  // Assignments
  if (assignments && assignments.length > 0) {
    message += `*TUGAS YANG DIBERIKAN*\n`;
    assignments.forEach((assignment, index) => {
      message += `${index + 1}. ${assignment.title}\n`;
      if (assignment.description) {
        message += `   Deskripsi: ${assignment.description}\n`;
      }
      if (assignment.deadline) {
        message += `   Deadline: ${new Date(assignment.deadline).toLocaleDateString('id-ID')}\n`;
      }
      if (assignment.status !== undefined) {
        message += `   ${assignment.status ? 'Sudah mengerjakan' : 'Belum mengerjakan'}\n`;
      }
    });
    message += `\n`;
  }

  // Announcements
  if (announcements && announcements.length > 0) {
    message += `*PENGUMUMAN*\n`;
    announcements.forEach((announcement, index) => {
      const dateStr = announcement.date ? new Date(announcement.date).toLocaleDateString('id-ID') : '';
      message += `*${index + 1}. ${announcement.title}*`;
      if (dateStr) message += ` [${dateStr}]`;
      message += `\n`;
      if (announcement.desc) {
        message += `   ${announcement.desc}\n`;
      }
    });
    message += `\n`;
  }

  message += `Terima kasih atas perhatian dan dukungan Anda.\n\n`;
  message += `Hormat kami,\n`;
  message += `${teacherName}\n`;
  message += `SMKN 2 Surabaya`;

  return message;
};

/**
 * SHARED FUNCTION: Send session report to parent
 * @param {Object} params - Send parameters
 * @returns {Promise<Object>} Send result
 */
const sendSessionReportToParent = async ({
  parentPhone,
  studentName,
  className,
  subjectName,
  teacherName,
  timeSlot,
  date,
  attendanceStatus,
  attendanceNote,
  assignments,
  announcements
}) => {
  if (!parentPhone) {
    return {
      success: false,
      error: 'Nomor telepon wali murid tidak tersedia'
    };
  }

  const message = buildSessionReportMessage({
    studentName,
    className,
    subjectName,
    teacherName,
    timeSlot,
    date,
    attendanceStatus,
    attendanceNote,
    assignments,
    announcements
  });

  return await whatsappService.sendMessage(parentPhone, message);
};

module.exports = {
  buildSessionReportMessage,
  sendSessionReportToParent
};
