const { PrismaClient } = require('@prisma/client');
const QueryBuilder = require('../utils/queryBuilder');

const prisma = new PrismaClient();

class AttendanceService {
  /**
   * Get attendances dengan search, filter, sort, dan pagination
   * @param {Object} queryParams - Query parameters
   * @returns {Object} Attendances data dengan pagination
   */
  static async getAttendances(queryParams) {
    const {
      search,
      order,
      sort,
      page,
      limit,
      filters
    } = queryParams;

    // Build base where clause
    const where = {};

    // Filter by user (teacher) - get attendances from their teaching assignments
    if (filters.id_user) {
      where.teaching_assignment = {
        id_user: parseInt(filters.id_user)
      };
      delete filters.id_user; // Remove from filters to avoid conflict
    }

    // Build query
    const query = QueryBuilder.buildQuery({
      search,
      searchFields: [],
      filters,
      order,
      sort: sort || 'asc',
      defaultSort: 'date',
      page,
      limit,
      maxLimit: 100
    });

    // Merge where clauses
    query.where = { ...query.where, ...where };

    // Execute query dengan include relations
    const [attendances, total] = await Promise.all([
      prisma.attendances.findMany({
        ...query,
        include: {
          student: {
            include: {
              class: {
                include: {
                  level: true,
                  major: true,
                  rombel: true
                }
              }
            }
          },
          teaching_assignment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              subject: true,
              class: {
                include: {
                  level: true,
                  major: true,
                  rombel: true
                }
              }
            }
          },
          schedule: true
        }
      }),
      prisma.attendances.count({ where: query.where })
    ]);

    return QueryBuilder.formatResponse(attendances, total, page, limit);
  }

  /**
   * Get attendance by ID
   * @param {number} id - Attendance ID
   * @returns {Object} Attendance data
   */
  static async getAttendanceById(id) {
    const attendance = await prisma.attendances.findUnique({
      where: { id: parseInt(id) },
      include: {
        student: {
          include: {
            class: {
              include: {
                level: true,
                major: true,
                rombel: true
              }
            }
          }
        },
        teaching_assignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            subject: true
          }
        },
        schedule: true
      }
    });

    if (!attendance) {
      throw new Error('Absensi tidak ditemukan');
    }

    return attendance;
  }

  /**
   * Create attendance
   * @param {Object} data - Attendance data
   * @returns {Object} Created attendance
   */
  static async createAttendance(data) {
    const { id_student, id_teaching_assignment, id_schedule, date, status, note } = data;

    const attendance = await prisma.attendances.create({
      data: {
        id_student,
        id_teaching_assignment,
        id_schedule,
        date: new Date(date),
        checked_at: new Date(),
        status,
        note
      },
      include: {
        student: true,
        teaching_assignment: {
          include: {
            subject: true
          }
        },
        schedule: true
      }
    });

    return attendance;
  }

  /**
   * Create bulk attendances
   * @param {Array} attendances - Array of attendance data
   * @returns {Object} Result
   */
  static async createBulkAttendance(attendances) {
    const attendanceData = attendances.map(att => ({
      id_student: att.id_student,
      id_teaching_assignment: att.id_teaching_assignment,
      id_schedule: att.id_schedule,
      date: new Date(att.date),
      checked_at: new Date(),
      status: att.status,
      note: att.note || null
    }));

    const result = await prisma.attendances.createMany({
      data: attendanceData
    });

    return { message: 'Absensi berhasil dibuat', count: result.count };
  }

  /**
   * Update attendance
   * @param {number} id - Attendance ID
   * @param {Object} data - Attendance data
   * @returns {Object} Updated attendance
   */
  static async updateAttendance(id, data) {
    // Check if attendance exists
    await this.getAttendanceById(id);

    const { id_student, id_teaching_assignment, id_schedule, date, status, note } = data;

    const attendance = await prisma.attendances.update({
      where: { id: parseInt(id) },
      data: {
        id_student,
        id_teaching_assignment,
        id_schedule,
        date: new Date(date),
        status,
        note
      },
      include: {
        student: true,
        teaching_assignment: {
          include: {
            subject: true
          }
        },
        schedule: true
      }
    });

    return attendance;
  }

  /**
   * Delete attendance
   * @param {number} id - Attendance ID
   * @returns {Object} Success message
   */
  static async deleteAttendance(id) {
    // Check if attendance exists
    await this.getAttendanceById(id);

    await prisma.attendances.delete({
      where: { id: parseInt(id) }
    });

    return { message: 'Absensi berhasil dihapus' };
  }

  /**
   * Check if attendance exists for a specific schedule and date
   * @param {number} idSchedule - Schedule ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {boolean} True if attendance exists
   */
  static async checkAttendanceExists(idSchedule, date) {
    const count = await prisma.attendances.count({
      where: {
        id_schedule: parseInt(idSchedule),
        date: new Date(date)
      }
    });

    return count > 0;
  }

  /**
   * Get class session summary for a specific schedule and date
   * Includes: attendance, assignments, announcements
   * @param {number} idSchedule - Schedule ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object} Session summary
   */
  static async getClassSessionSummary(idSchedule, date) {
    // Get schedule with teaching assignment details
    const schedule = await prisma.schedules.findUnique({
      where: { id: parseInt(idSchedule) },
      include: {
        teaching_assignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            subject: true,
            class: {
              include: {
                level: true,
                major: true,
                rombel: true
              }
            }
          }
        }
      }
    });

    if (!schedule) {
      throw new Error('Jadwal tidak ditemukan');
    }

    // Get attendances for this session
    const attendances = await prisma.attendances.findMany({
      where: {
        id_schedule: parseInt(idSchedule),
        date: new Date(date)
      },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            name: true,
            parent_telephone: true,
            student_telephone: true
          }
        }
      }
    });

    // Get assignments for this class
    // Ambil tugas yang:
    // - Belum deadline (deadline >= hari ini), ATAU
    // - Baru dibuat dalam 7 hari terakhir
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const assignments = await prisma.assignments.findMany({
      where: {
        id_teaching_assignment: schedule.id_teaching_assignment,
        OR: [
          {
            // Tugas yang belum deadline
            deadline: {
              gte: today
            }
          },
          {
            // Tugas yang baru dibuat dalam 7 hari terakhir
            created_at: {
              gte: sevenDaysAgo
            }
          }
        ]
      },
      select: {
        id: true,
        assignment_title: true,
        assignment_desc: true,
        deadline: true,
        created_at: true
      },
      orderBy: {
        deadline: 'asc'
      }
    });

    // Get announcements for this class on this date
    const announcements = await prisma.announcements.findMany({
      where: {
        id_teaching_assignment: schedule.id_teaching_assignment,
        date: new Date(date)
      },
      select: {
        id: true,
        title: true,
        desc: true,
        date: true
      }
    });

    // Calculate attendance statistics
    const totalStudents = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'hadir').length;
    const permitCount = attendances.filter(a => a.status === 'izin').length;
    const absentCount = attendances.filter(a => a.status === 'alfa').length;

    return {
      schedule: {
        id: schedule.id,
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        teacher: schedule.teaching_assignment.user.name,
        subject: schedule.teaching_assignment.subject.name,
        class: `${schedule.teaching_assignment.class.level.name} ${schedule.teaching_assignment.class.major.code} ${schedule.teaching_assignment.class.rombel.name}`
      },
      date,
      attendance: {
        total: totalStudents,
        present: presentCount,
        permit: permitCount,
        absent: absentCount,
        details: attendances
      },
      assignments: assignments.length > 0 ? assignments : null,
      announcements: announcements.length > 0 ? announcements : null
    };
  }

  /**
   * Send class session report to all parents via WhatsApp
   * @param {number} idSchedule - Schedule ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Object} Send result
   */
  static async sendReportToParents(idSchedule, date) {
    const { sendSessionReportToParent } = require('./notificationService');
    
    // Get session summary
    const summary = await this.getClassSessionSummary(idSchedule, date);

    // Prepare messages for each parent
    const sendResults = [];
    const errors = [];

    for (const attendance of summary.attendance.details) {
      const student = attendance.student;
      
      // Get student-specific assignment status
      const studentAssignments = await prisma.student_assignments.findMany({
        where: {
          id_student: student.id,
          assignment: {
            id_teaching_assignment: summary.schedule.id_teaching_assignment
          }
        },
        select: {
          id_assignment: true,
          status: true
        }
      });

      // Create map for quick lookup
      const assignmentStatusMap = new Map();
      studentAssignments.forEach(sa => {
        assignmentStatusMap.set(sa.id_assignment, sa.status);
      });

      // Format assignments dengan status per siswa
      const formattedAssignments = summary.assignments 
        ? summary.assignments.map(assignment => ({
            title: assignment.assignment_title,
            description: assignment.assignment_desc,
            deadline: assignment.deadline,
            status: assignmentStatusMap.get(assignment.id) || false
          }))
        : [];

      const phonesSent = new Set();
      
      // Kirim ke parent_telephone (wajib)
      if (student.parent_telephone) {
        const result = await sendSessionReportToParent({
          parentPhone: student.parent_telephone,
          studentName: student.name,
          className: summary.schedule.class,
          subjectName: summary.schedule.subject,
          teacherName: summary.schedule.teacher,
          timeSlot: `${summary.schedule.start_time} - ${summary.schedule.end_time}`,
          date,
          attendanceStatus: attendance.status,
          attendanceNote: attendance.note,
          assignments: formattedAssignments,
          announcements: summary.announcements || []
        });
        
        if (result.success) {
          sendResults.push({
            student: student.name,
            phone: student.parent_telephone,
            recipient: 'Parent',
            status: 'sent'
          });
          phonesSent.add(student.parent_telephone);
        } else {
          errors.push({
            student: student.name,
            phone: student.parent_telephone,
            recipient: 'Parent',
            reason: result.error
          });
        }
      }
      
      // Kirim ke student_telephone (opsional, jika ada dan berbeda dari parent)
      if (student.student_telephone && !phonesSent.has(student.student_telephone)) {
        const result = await sendSessionReportToParent({
          parentPhone: student.student_telephone,
          studentName: student.name,
          className: summary.schedule.class,
          subjectName: summary.schedule.subject,
          teacherName: summary.schedule.teacher,
          timeSlot: `${summary.schedule.start_time} - ${summary.schedule.end_time}`,
          date,
          attendanceStatus: attendance.status,
          attendanceNote: attendance.note,
          assignments: formattedAssignments,
          announcements: summary.announcements || []
        });
        
        if (result.success) {
          sendResults.push({
            student: student.name,
            phone: student.student_telephone,
            recipient: 'Student',
            status: 'sent'
          });
        } else {
          errors.push({
            student: student.name,
            phone: student.student_telephone,
            recipient: 'Student',
            reason: result.error
          });
        }
      }
      
      // Jika tidak ada nomor sama sekali
      if (!student.parent_telephone && !student.student_telephone) {
        errors.push({
          student: student.name,
          reason: 'Tidak ada nomor telepon (parent/student)'
        });
      }
    }

    return {
      message: 'Proses pengiriman laporan selesai',
      summary: {
        total: summary.attendance.total,
        sent: sendResults.length,
        failed: errors.length
      },
      sent: sendResults,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

module.exports = AttendanceService;
