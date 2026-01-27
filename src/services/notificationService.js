const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// WhatsApp API Configuration
const WA_API_URL = 'https://wa-reportify.devops.my.id/send/message';
const WA_API_USER = 'reportify';
const WA_API_PASSWORD = 'password';

/**
 * Format phone number to WhatsApp format
 * @param {string} phone - Phone number (08xxx or 628xxx)
 * @returns {string} Formatted phone (628xxx@s.whatsapp.net)
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert 08xxx to 628xxx
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // Add WhatsApp suffix
  return `${cleaned}@s.whatsapp.net`;
};

/**
 * Send WhatsApp message using API
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 */
const sendWhatsApp = async (phone, message) => {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    const response = await axios.post(
      WA_API_URL,
      {
        phone: formattedPhone,
        message: message,
        is_forwarded: false
      },
      {
        auth: {
          username: WA_API_USER,
          password: WA_API_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ WA sent to ${formattedPhone}: Success`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ WA failed to ${phone}:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
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
    
    // Hitung 5 menit yang lalu (window untuk deteksi kelas baru selesai)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const timeWindowStart = `${String(fiveMinutesAgo.getHours()).padStart(2, '0')}:${String(fiveMinutesAgo.getMinutes()).padStart(2, '0')}:00`;

    console.log(`\n=== CHECKING NOTIFICATIONS ===`);
    console.log(`Day: ${currentDay}`);
    console.log(`Current Time: ${currentTime}`);
    console.log(`Time Window: ${timeWindowStart} - ${currentTime}`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cari schedule yang baru selesai dalam 5 menit terakhir DAN belum dikirim notifikasi hari ini
    const schedules = await prisma.schedules.findMany({
      where: {
        day: currentDay,
        end_time: {
          gte: timeWindowStart,  // Selesai >= 5 menit yang lalu
          lte: currentTime       // Selesai <= sekarang
        },
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
      console.log('No notifications to send');
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
              gte: today,  // >= 00:00:00 hari ini
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)  // < 00:00:00 besok
            }
          }
        });

        console.log(`   Checking attendance for ${student.name}:`, {
          found: !!attendance,
          status: attendance?.status,
          date: attendance?.date
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
              gte: today  // Belum deadline
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

        let taskText = '';
        if (assignments.length === 0) {
          taskText = 'Tidak ada tugas';
        } else {
          const taskLines = assignments.map((assignment, index) => {
            const studentAssignment = assignment.student_assignments[0];
            if (!studentAssignment) {
              return `Tugas ${index + 1} (${assignment.assignment_title}): Belum ada tugas`;
            }
            
            const status = studentAssignment.status ? 'Sudah mengerjakan' : 'Belum mengerjakan';
            const note = studentAssignment.note ? ` (Catatan: ${studentAssignment.note})` : '';
            return `Tugas ${index + 1} (${assignment.assignment_title}): ${status}${note}`;
          });
          taskText = taskLines.join('\n');
        }

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

        let announcementText = '';
        if (announcements.length === 0) {
          announcementText = 'Tidak ada pengumuman';
        } else {
          const announcementLines = announcements.map((announcement) => {
            const dateStr = new Date(announcement.date).toLocaleDateString('id-ID');
            return `- [${dateStr}] ${announcement.title}\n  ${announcement.desc}`;
          });
          announcementText = announcementLines.join('\n\n');
        }

        // 4. Generate pesan dengan format yang diminta
        const message = `Yth. Bapak/Ibu Wali Murid,

Kami sampaikan informasi pembelajaran dengan detail sebagai berikut:

Nama Siswa : ${student.name}
Kelas : ${className}
Mata Pelajaran : ${subjectName}
Guru Mata Pelajaran : ${teacherName}
Jam Pelajaran : ${timeSlot}

Absensi : ${attendanceStatus}
Tugas :
${taskText}

Pengumuman:
${announcementText}

Demikian informasi yang kami sampaikan.
Atas perhatian Bapak/Ibu, kami ucapkan terima kasih.

Hormat kami,
SMKN 2 Surabaya`;

        // 5. Kirim WA ke orangtua dan siswa (avoid double send jika nomornya sama)
        console.log(`\n📱 Sending notification for ${student.name}...`);
        
        const phonesSent = new Set(); // Track nomor yang sudah dikirim
        
        // Kirim ke orangtua (wajib)
        if (student.parent_telephone) {
          const parentResult = await sendWhatsApp(student.parent_telephone, message);
          console.log(`   - Parent (${student.parent_telephone}): ${parentResult.success ? '✅' : '❌'}`);
          phonesSent.add(student.parent_telephone);
        }
        
        // Kirim ke siswa (opsional, jika ada nomor DAN berbeda dari orangtua)
        if (student.student_telephone && !phonesSent.has(student.student_telephone)) {
          const studentResult = await sendWhatsApp(student.student_telephone, message);
          console.log(`   - Student (${student.student_telephone}): ${studentResult.success ? '✅' : '❌'}`);
        } else if (student.student_telephone && phonesSent.has(student.student_telephone)) {
          console.log(`   - Student (${student.student_telephone}): ⏭️ Skipped (same as parent)`);
        }
        
        console.log('='.repeat(50));
      }

      // Update notification_sent_date setelah semua siswa di schedule ini sudah dikirim notifikasi
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

module.exports = { scheduleNotifications };
