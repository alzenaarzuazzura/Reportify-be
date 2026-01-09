const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
    if (!currentDay) return;

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = await prisma.schedules.findMany({
      where: {
        day: currentDay,
        end_time: {
          lte: currentTime
        }
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

    for (const schedule of schedules) {
      const students = schedule.teaching_assignment.class.students;

      for (const student of students) {
        const attendance = await prisma.attendances.findFirst({
          where: {
            id_student: student.id,
            id_teaching_assignment: schedule.teaching_assignment.id,
            id_schedule: schedule.id,
            date: today
          }
        });

        const assignments = await prisma.assignments.findMany({
          where: {
            id_teaching_assignment: schedule.teaching_assignment.id,
            created_at: {
              gte: today
            }
          },
          include: {
            student_assignments: {
              where: {
                id_student: student.id
              }
            }
          }
        });

        const attendanceStatus = attendance ? attendance.status : 'Tidak ada data';
        const taskList = assignments.map(assignment => {
          const studentAssignment = assignment.student_assignments[0];
          return `${assignment.assignment_title}: ${studentAssignment ? (studentAssignment.status ? 'Selesai' : 'Belum selesai') : 'Belum dikerjakan'}`;
        }).join(', ');

        const className = `${schedule.teaching_assignment.class.level.name} ${schedule.teaching_assignment.class.major.name} ${schedule.teaching_assignment.class.rombel.name}`;
        const message = `Laporan ${schedule.teaching_assignment.subject.name} - ${student.name} (${className}):\nAbsensi: ${attendanceStatus}\nTugas: ${taskList || 'Tidak ada tugas'}`;

        console.log(`Notifikasi untuk ${student.name}:`);
        console.log(`- Orangtua (${student.parent_telephone}): ${message}`);
        
        if (student.student_telephone) {
          console.log(`- Siswa (${student.student_telephone}): ${message}`);
        }
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

module.exports = { scheduleNotifications };
