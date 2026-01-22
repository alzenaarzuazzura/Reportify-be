const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ReportService {
  /**
   * Get attendance report
   */
  static async getAttendanceReport({ startDate, endDate, id_class, id_student }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build where clause
    const where = {
      schedule: {
        date: {
          gte: start,
          lte: end
        }
      }
    };

    if (id_class) {
      where.schedule = {
        ...where.schedule,
        teaching_assignment: {
          id_class
        }
      };
    }

    if (id_student) {
      where.id_student = id_student;
    }

    // Get attendance records
    const attendances = await prisma.attendances.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            nis: true,
            class: {
              include: {
                level: true,
                major: true,
                rombel: true
              }
            }
          }
        },
        schedule: {
          include: {
            teaching_assignment: {
              include: {
                subject: true,
                class: {
                  include: {
                    level: true,
                    major: true,
                    rombel: true
                  }
                },
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        schedule: {
          date: 'desc'
        }
      }
    });

    // Calculate statistics
    const stats = {
      total: attendances.length,
      hadir: attendances.filter(a => a.status === 'Hadir').length,
      sakit: attendances.filter(a => a.status === 'Sakit').length,
      izin: attendances.filter(a => a.status === 'Izin').length,
      alpha: attendances.filter(a => a.status === 'Alpha').length
    };

    stats.attendanceRate = stats.total > 0 
      ? ((stats.hadir / stats.total) * 100).toFixed(2) 
      : 0;

    // Group by student if not filtered by student
    let byStudent = [];
    if (!id_student) {
      const studentMap = new Map();
      
      attendances.forEach(att => {
        const studentId = att.student.id;
        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            student: att.student,
            total: 0,
            hadir: 0,
            sakit: 0,
            izin: 0,
            alpha: 0
          });
        }
        
        const studentData = studentMap.get(studentId);
        studentData.total++;
        studentData[att.status.toLowerCase()]++;
      });

      byStudent = Array.from(studentMap.values()).map(data => ({
        ...data,
        attendanceRate: ((data.hadir / data.total) * 100).toFixed(2)
      }));
    }

    return {
      period: { startDate, endDate },
      statistics: stats,
      byStudent,
      details: attendances.map(att => ({
        id: att.id,
        date: att.schedule.date,
        status: att.status,
        notes: att.notes,
        student: {
          id: att.student.id,
          name: att.student.name,
          nis: att.student.nis,
          class: `${att.student.class.level.name} ${att.student.class.major.code} ${att.student.class.rombel.name}`
        },
        subject: att.schedule.teaching_assignment.subject.name,
        teacher: att.schedule.teaching_assignment.user.name,
        class: `${att.schedule.teaching_assignment.class.level.name} ${att.schedule.teaching_assignment.class.major.code} ${att.schedule.teaching_assignment.class.rombel.name}`
      }))
    };
  }

  /**
   * Get assignment report
   */
  static async getAssignmentReport({ startDate, endDate, id_class, id_subject }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build where clause
    const where = {
      schedule: {
        date: {
          gte: start,
          lte: end
        }
      }
    };

    if (id_class) {
      where.schedule = {
        ...where.schedule,
        teaching_assignment: {
          id_class
        }
      };
    }

    if (id_subject) {
      where.schedule = {
        ...where.schedule,
        teaching_assignment: {
          ...where.schedule?.teaching_assignment,
          id_subject
        }
      };
    }

    // Get assignments
    const assignments = await prisma.assignments.findMany({
      where,
      include: {
        schedule: {
          include: {
            teaching_assignment: {
              include: {
                subject: true,
                class: {
                  include: {
                    level: true,
                    major: true,
                    rombel: true
                  }
                },
                user: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        schedule: {
          date: 'desc'
        }
      }
    });

    // Calculate statistics
    const stats = {
      total: assignments.length,
      withAssignment: assignments.filter(a => a.assignment && a.assignment.trim() !== '').length,
      withoutAssignment: assignments.filter(a => !a.assignment || a.assignment.trim() === '').length
    };

    stats.completionRate = stats.total > 0 
      ? ((stats.withAssignment / stats.total) * 100).toFixed(2) 
      : 0;

    // Group by subject
    const subjectMap = new Map();
    assignments.forEach(ass => {
      const subjectId = ass.schedule.teaching_assignment.subject.id;
      const subjectName = ass.schedule.teaching_assignment.subject.name;
      
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: { id: subjectId, name: subjectName },
          total: 0,
          withAssignment: 0,
          withoutAssignment: 0
        });
      }
      
      const subjectData = subjectMap.get(subjectId);
      subjectData.total++;
      if (ass.assignment && ass.assignment.trim() !== '') {
        subjectData.withAssignment++;
      } else {
        subjectData.withoutAssignment++;
      }
    });

    const bySubject = Array.from(subjectMap.values()).map(data => ({
      ...data,
      completionRate: ((data.withAssignment / data.total) * 100).toFixed(2)
    }));

    return {
      period: { startDate, endDate },
      statistics: stats,
      bySubject,
      details: assignments.map(ass => ({
        id: ass.id,
        date: ass.schedule.date,
        assignment: ass.assignment,
        hasAssignment: !!(ass.assignment && ass.assignment.trim() !== ''),
        subject: ass.schedule.teaching_assignment.subject.name,
        teacher: ass.schedule.teaching_assignment.user.name,
        class: `${ass.schedule.teaching_assignment.class.level.name} ${ass.schedule.teaching_assignment.class.major.code} ${ass.schedule.teaching_assignment.class.rombel.name}`
      }))
    };
  }

  /**
   * Get teacher activity report
   */
  static async getTeacherActivityReport({ startDate, endDate, id_teacher }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build where clause for schedules
    const where = {
      date: {
        gte: start,
        lte: end
      }
    };

    if (id_teacher) {
      where.teaching_assignment = {
        id_user: id_teacher
      };
    }

    // Get schedules with reports
    const schedules = await prisma.schedules.findMany({
      where,
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
        },
        attendances: true,
        assignments: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate statistics per teacher
    const teacherMap = new Map();
    
    schedules.forEach(schedule => {
      const teacherId = schedule.teaching_assignment.user.id;
      
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          teacher: schedule.teaching_assignment.user,
          totalSchedules: 0,
          reportedSchedules: 0,
          attendanceReports: 0,
          assignmentReports: 0,
          subjects: new Set()
        });
      }
      
      const teacherData = teacherMap.get(teacherId);
      teacherData.totalSchedules++;
      teacherData.subjects.add(schedule.teaching_assignment.subject.name);
      
      const hasAttendance = schedule.attendances.length > 0;
      const hasAssignment = schedule.assignments.length > 0;
      
      if (hasAttendance) teacherData.attendanceReports++;
      if (hasAssignment) teacherData.assignmentReports++;
      if (hasAttendance || hasAssignment) teacherData.reportedSchedules++;
    });

    const byTeacher = Array.from(teacherMap.values()).map(data => ({
      teacher: data.teacher,
      totalSchedules: data.totalSchedules,
      reportedSchedules: data.reportedSchedules,
      attendanceReports: data.attendanceReports,
      assignmentReports: data.assignmentReports,
      subjects: Array.from(data.subjects),
      reportingRate: ((data.reportedSchedules / data.totalSchedules) * 100).toFixed(2)
    }));

    // Overall statistics
    const totalSchedules = schedules.length;
    const reportedSchedules = schedules.filter(s => 
      s.attendances.length > 0 || s.assignments.length > 0
    ).length;

    const stats = {
      totalSchedules,
      reportedSchedules,
      unreportedSchedules: totalSchedules - reportedSchedules,
      reportingRate: totalSchedules > 0 
        ? ((reportedSchedules / totalSchedules) * 100).toFixed(2) 
        : 0
    };

    return {
      period: { startDate, endDate },
      statistics: stats,
      byTeacher,
      details: schedules.map(schedule => ({
        id: schedule.id,
        date: schedule.date,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        teacher: schedule.teaching_assignment.user.name,
        subject: schedule.teaching_assignment.subject.name,
        class: `${schedule.teaching_assignment.class.level.name} ${schedule.teaching_assignment.class.major.code} ${schedule.teaching_assignment.class.rombel.name}`,
        hasAttendance: schedule.attendances.length > 0,
        hasAssignment: schedule.assignments.length > 0,
        isReported: schedule.attendances.length > 0 || schedule.assignments.length > 0
      }))
    };
  }

  /**
   * Get student performance report
   */
  static async getStudentPerformanceReport({ startDate, endDate, id_student }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get student info
    const student = await prisma.students.findUnique({
      where: { id: id_student },
      include: {
        class: {
          include: {
            level: true,
            major: true,
            rombel: true
          }
        }
      }
    });

    if (!student) {
      throw new Error('Siswa tidak ditemukan');
    }

    // Get attendance records
    const attendances = await prisma.attendances.findMany({
      where: {
        id_student,
        schedule: {
          date: {
            gte: start,
            lte: end
          }
        }
      },
      include: {
        schedule: {
          include: {
            teaching_assignment: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    // Calculate attendance stats
    const attendanceStats = {
      total: attendances.length,
      hadir: attendances.filter(a => a.status === 'Hadir').length,
      sakit: attendances.filter(a => a.status === 'Sakit').length,
      izin: attendances.filter(a => a.status === 'Izin').length,
      alpha: attendances.filter(a => a.status === 'Alpha').length
    };

    attendanceStats.attendanceRate = attendanceStats.total > 0 
      ? ((attendanceStats.hadir / attendanceStats.total) * 100).toFixed(2) 
      : 0;

    // Group attendance by subject
    const subjectAttendanceMap = new Map();
    attendances.forEach(att => {
      const subjectId = att.schedule.teaching_assignment.subject.id;
      const subjectName = att.schedule.teaching_assignment.subject.name;
      
      if (!subjectAttendanceMap.has(subjectId)) {
        subjectAttendanceMap.set(subjectId, {
          subject: { id: subjectId, name: subjectName },
          total: 0,
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpha: 0
        });
      }
      
      const data = subjectAttendanceMap.get(subjectId);
      data.total++;
      data[att.status.toLowerCase()]++;
    });

    const attendanceBySubject = Array.from(subjectAttendanceMap.values()).map(data => ({
      ...data,
      attendanceRate: ((data.hadir / data.total) * 100).toFixed(2)
    }));

    return {
      period: { startDate, endDate },
      student: {
        id: student.id,
        name: student.name,
        nis: student.nis,
        class: `${student.class.level.name} ${student.class.major.code} ${student.class.rombel.name}`
      },
      attendance: {
        statistics: attendanceStats,
        bySubject: attendanceBySubject
      }
    };
  }

  /**
   * Get class summary report
   */
  static async getClassSummaryReport({ startDate, endDate, id_class }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Get class info
    const classInfo = await prisma.classes.findUnique({
      where: { id: id_class },
      include: {
        level: true,
        major: true,
        rombel: true,
        students: {
          select: {
            id: true,
            name: true,
            nis: true
          }
        }
      }
    });

    if (!classInfo) {
      throw new Error('Kelas tidak ditemukan');
    }

    // Get all schedules for this class
    const schedules = await prisma.schedules.findMany({
      where: {
        teaching_assignment: {
          id_class
        },
        date: {
          gte: start,
          lte: end
        }
      },
      include: {
        teaching_assignment: {
          include: {
            subject: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        attendances: true,
        assignments: true
      }
    });

    // Calculate statistics
    const stats = {
      totalStudents: classInfo.students.length,
      totalSchedules: schedules.length,
      reportedSchedules: schedules.filter(s => 
        s.attendances.length > 0 || s.assignments.length > 0
      ).length,
      totalAttendanceRecords: schedules.reduce((sum, s) => sum + s.attendances.length, 0),
      totalAssignments: schedules.filter(s => 
        s.assignments.length > 0 && s.assignments[0].assignment
      ).length
    };

    stats.reportingRate = stats.totalSchedules > 0 
      ? ((stats.reportedSchedules / stats.totalSchedules) * 100).toFixed(2) 
      : 0;

    // Get attendance summary per student
    const studentAttendanceMap = new Map();
    classInfo.students.forEach(student => {
      studentAttendanceMap.set(student.id, {
        student,
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpha: 0
      });
    });

    schedules.forEach(schedule => {
      schedule.attendances.forEach(att => {
        if (studentAttendanceMap.has(att.id_student)) {
          const data = studentAttendanceMap.get(att.id_student);
          data.total++;
          data[att.status.toLowerCase()]++;
        }
      });
    });

    const studentSummary = Array.from(studentAttendanceMap.values()).map(data => ({
      ...data,
      attendanceRate: data.total > 0 
        ? ((data.hadir / data.total) * 100).toFixed(2) 
        : 0
    }));

    return {
      period: { startDate, endDate },
      class: {
        id: classInfo.id,
        name: `${classInfo.level.name} ${classInfo.major.code} ${classInfo.rombel.name}`,
        totalStudents: classInfo.students.length
      },
      statistics: stats,
      studentSummary
    };
  }
}

module.exports = ReportService;
