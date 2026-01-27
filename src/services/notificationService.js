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
  message += `📅 Tanggal: ${new Date(date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  message += `📚 Mata Pelajaran: ${subjectName}\n`;
  message += `👨‍🏫 Guru: ${teacherName}\n`;
  message += `🏫 Kelas: ${className}\n`;
  message += `⏰ Waktu: ${timeSlot}\n\n`;
  
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
        message += `   📝 ${assignment.description}\n`;
      }
      if (assignment.deadline) {
        message += `   ⏰ Deadline: ${new Date(assignment.deadline).toLocaleDateString('id-ID')}\n`;
      }
      if (assignment.status !== undefined) {
        message += `   ${assignment.status ? '✅ Sudah mengerjakan' : '⏳ Belum mengerjakan'}\n`;
      }
    });
    message += `\n`;
  }

  // Announcements
  if (announcements && announcements.length > 0) {
    message += `*PENGUMUMAN*\n`;
    announcements.forEach((announcement, index) => {
      const dateStr = announcement.date ? new Date(announcement.date).toLocaleDateString('id-ID') : '';
      message += `${index + 1}. ${announcement.title}`;
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

const scheduleNotifications = async () => {
  try {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayMapping = {
      'Sunday': null,
      'Monday': 'senin',
      'Tuesday': 'selasa',
      'Wednesday': 'rabu',
      'Thursday': 'kamis',
      'Friday': 'jumat',
      'Saturday': null
    };
    
    const currentDay = dayMapping[dayNames[now.getDay()]];
    if (!currentDay) {
      console.log('Weekend - tidak ada notifikasi');
      return;
    }

    // Format waktu sekarang (HH:MM:SS)
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

    console.log(`\n=== CHECKING NOTIFICATIONS ===`);
    console.log(`Day: ${currentDay}`);
    console.log(`Current Time: ${currentTime}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cari schedule yang end_time-nya sama dengan waktu sekarang DAN belum dikirim notifikasi hari ini
    const schedules = await prisma.schedules.findMany({
      where: {
        day: currentDay,
        end_time: currentTime,
        OR: [
          { notification_sent_date: null },
          { notification_sent_date: { lt: today } }
        ]
      },
      include: {
        teaching_assignment: {
          include: {
            user: true,
            subject: true,
            class: {
              include: {
                students: true,
                level: true,
                major: true,
                rombel: true
              }
            }
          }
        }
      }
    });

    console.log(`Found ${schedules.length} schedules that just ended`);

    if (schedules.length === 0) {
      console.log('No notifications to send at this time');
      return;
    }

    for (const schedule of schedules) {
      const students = schedule.teaching_assignment.class.students;
      const className = `${schedule.teaching_assignment.class.level.name} ${schedule.teaching_assignment.class.major.code} ${schedule.teaching_assignment.class.rombel.name}`;
      const teacherName = schedule.teaching_assignment.user.name;
      const subjectName = schedule.teaching_assignment.subject.name;
      const timeSlot = `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`;

      console.log(`\nProcessing schedule: ${subjectName} - ${className}`);

      for (const student of students) {
        // 1. Cek absensi hari ini
        const attendance = await prisma.attendances.findFirst({
          where: {
            id_student: student.id,
            id_teaching_assignment: schedule.teaching_assignment.id,
            id_schedule: schedule.id,
            date: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        });

        const attendanceStatusMap = {
          'hadir': 'Hadir',
          'izin': 'Izin',
          'alfa': 'Alpha'
        };
        const attendanceStatus = attendance 
          ? attendanceStatusMap[attendance.status] || attendance.status
          : 'Belum diabsen';

        // 2. Cek tugas yang belum deadline
        const assignments = await prisma.assignments.findMany({
          where: {
            id_teaching_assignment: schedule.teaching_assignment.id,
            deadline: {
              gte: today
            }
          },
          include: {
            student_assignments: {
              where: {
                id_student: student.id
              }
            }
          },
          orderBy: {
            deadline: 'asc'
          }
        });

        const formattedAssignments = assignments.map(assignment => {
          const studentAssignment = assignment.student_assignments[0];
          return {
            title: assignment.assignment_title,
            description: assignment.assignment_desc,
            deadline: assignment.deadline,
            status: studentAssignment ? studentAssignment.status : false
          };
        });

        // 3. Cek pengumuman 7 hari terakhir
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const announcements = await prisma.announcements.findMany({
          where: {
            id_teaching_assignment: schedule.teaching_assignment.id,
            date: {
              gte: sevenDaysAgo
            }
          },
          orderBy: {
            date: 'desc'
          }
        });

        // 4. Kirim WA menggunakan shared function
        console.log(`\n📱 Sending notification for ${student.name}...`);
        
        const phonesSent = new Set();
        
        // Kirim ke orangtua (wajib)
        if (student.parent_telephone) {
          const result = await sendSessionReportToParent({
            parentPhone: student.parent_telephone,
            studentName: student.name,
            className,
            subjectName,
            teacherName,
            timeSlot,
            date: today,
            attendanceStatus,
            attendanceNote: attendance?.note,
            assignments: formattedAssignments,
            announcements
          });
          console.log(`   - Parent (${student.parent_telephone}): ${result.success ? '✅' : '❌'}`);
          phonesSent.add(student.parent_telephone);
        }
        
        // Kirim ke siswa (opsional, jika ada nomor DAN berbeda dari orangtua)
        if (student.student_telephone && !phonesSent.has(student.student_telephone)) {
          const result = await sendSessionReportToParent({
            parentPhone: student.student_telephone,
            studentName: student.name,
            className,
            subjectName,
            teacherName,
            timeSlot,
            date: today,
            attendanceStatus,
            attendanceNote: attendance?.note,
            assignments: formattedAssignments,
            announcements
          });
          console.log(`   - Student (${student.student_telephone}): ${result.success ? '✅' : '❌'}`);
        } else if (student.student_telephone && phonesSent.has(student.student_telephone)) {
          console.log(`   - Student (${student.student_telephone}): ⏭️ Skipped (same as parent)`);
        }
        
        console.log('='.repeat(50));
      }

      // Update notification_sent_date
      await prisma.schedules.update({
        where: { id: schedule.id },
        data: { notification_sent_date: new Date() }
      });
      console.log(`✅ Schedule ${schedule.id} marked as notified`);
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

module.exports = { 
  scheduleNotifications,
  buildSessionReportMessage,
  sendSessionReportToParent
};
