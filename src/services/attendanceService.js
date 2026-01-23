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
      sortBy,
      order,
      page,
      limit,
      filters
    } = queryParams;

    // Build query
    const query = QueryBuilder.buildQuery({
      search,
      searchFields: [],
      filters,
      sortBy,
      order,
      defaultSort: 'date',
      page,
      limit,
      maxLimit: 100
    });

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
}

module.exports = AttendanceService;
