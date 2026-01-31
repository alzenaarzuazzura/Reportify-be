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
      date: {
        gte: start,
        lte: end
      }
    };

    if (id_class) {
      where.teaching_assignment = {
        id_class
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
        date: 'desc'
      }
    });

    // Calculate statistics
    const stats = {
      total: attendances.length,
      hadir: attendances.filter(a => a.status === 'hadir').length,
      sakit: 0, // Not in enum
      izin: attendances.filter(a => a.status === 'izin').length,
      alpha: attendances.filter(a => a.status === 'alfa').length
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

      byStudent = Array.from(studentMap.values()).map(data => {
        const className = data.student.class 
          ? `${data.student.class.level.name} ${data.student.class.major.code} ${data.student.class.rombel.name}`
          : 'N/A';
        
        return {
          student: {
            id: data.student.id,
            name: data.student.name,
            nis: data.student.nis,
            class: className
          },
          total: data.total,
          hadir: data.hadir,
          sakit: data.sakit,
          izin: data.izin,
          alpha: data.alpha,
          attendanceRate: ((data.hadir / data.total) * 100).toFixed(2)
        };
      });
    }

    return {
      period: { startDate, endDate },
      statistics: stats,
      byStudent,
      details: attendances.map(att => ({
        id: att.id,
        date: att.date,
        status: att.status,
        notes: att.note,
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
      deadline: {
        gte: start,
        lte: end
      }
    };

    if (id_class) {
      where.teaching_assignment = {
        id_class
      };
    }

    if (id_subject) {
      where.teaching_assignment = {
        ...where.teaching_assignment,
        id_subject
      };
    }

    // Get assignments
    const assignments = await prisma.assignments.findMany({
      where,
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
      },
      orderBy: {
        deadline: 'desc'
      }
    });

    // Calculate statistics
    const stats = {
      total: assignments.length,
      withAssignment: assignments.filter(a => a.assignment_title && a.assignment_title.trim() !== '').length,
      withoutAssignment: assignments.filter(a => !a.assignment_title || a.assignment_title.trim() === '').length
    };

    stats.completionRate = stats.total > 0 
      ? ((stats.withAssignment / stats.total) * 100).toFixed(2) 
      : 0;

    // Group by subject
    const subjectMap = new Map();
    assignments.forEach(ass => {
      const subjectId = ass.teaching_assignment.subject.id;
      const subjectName = ass.teaching_assignment.subject.name;
      
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
      if (ass.assignment_title && ass.assignment_title.trim() !== '') {
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
        date: ass.deadline,
        assignment: ass.assignment_title,
        hasAssignment: !!(ass.assignment_title && ass.assignment_title.trim() !== ''),
        subject: ass.teaching_assignment.subject.name,
        teacher: ass.teaching_assignment.user.name,
        class: `${ass.teaching_assignment.class.level.name} ${ass.teaching_assignment.class.major.code} ${ass.teaching_assignment.class.rombel.name}`
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

    // Build where clause for teaching assignments
    const where = {};

    if (id_teacher) {
      where.id_user = id_teacher;
    }

    // Get teaching assignments with their schedules and related data
    const teachingAssignments = await prisma.teaching_assignments.findMany({
      where,
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
        },
        schedules: {
          include: {
            attendances: {
              where: {
                date: {
                  gte: start,
                  lte: end
                }
              }
            }
          }
        },
        assignments: {
          where: {
            deadline: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    // Calculate statistics per teacher
    const teacherMap = new Map();
    
    teachingAssignments.forEach(ta => {
      const teacherId = ta.user.id;
      
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          teacher: ta.user,
          totalSchedules: 0,
          reportedSchedules: 0,
          attendanceReports: 0,
          assignmentReports: 0,
          subjects: new Set()
        });
      }
      
      const teacherData = teacherMap.get(teacherId);
      teacherData.subjects.add(ta.subject.name);
      
      ta.schedules.forEach(schedule => {
        teacherData.totalSchedules++;
        
        const hasAttendance = schedule.attendances.length > 0;
        
        if (hasAttendance) {
          teacherData.attendanceReports++;
          teacherData.reportedSchedules++;
        }
      });
      
      teacherData.assignmentReports += ta.assignments.length;
    });

    const byTeacher = Array.from(teacherMap.values()).map(data => ({
      teacher: data.teacher,
      totalSchedules: data.totalSchedules,
      reportedSchedules: data.reportedSchedules,
      attendanceReports: data.attendanceReports,
      assignmentReports: data.assignmentReports,
      subjects: Array.from(data.subjects),
      reportingRate: data.totalSchedules > 0 
        ? ((data.reportedSchedules / data.totalSchedules) * 100).toFixed(2)
        : '0.00'
    }));

    // Overall statistics
    const totalSchedules = Array.from(teacherMap.values()).reduce((sum, t) => sum + t.totalSchedules, 0);
    const reportedSchedules = Array.from(teacherMap.values()).reduce((sum, t) => sum + t.reportedSchedules, 0);

    const stats = {
      totalSchedules,
      reportedSchedules,
      unreportedSchedules: totalSchedules - reportedSchedules,
      reportingRate: totalSchedules > 0 
        ? ((reportedSchedules / totalSchedules) * 100).toFixed(2) 
        : '0.00'
    };

    // Build details
    const details = [];
    teachingAssignments.forEach(ta => {
      ta.schedules.forEach(schedule => {
        const hasAttendance = schedule.attendances.length > 0;
        const hasAssignment = ta.assignments.length > 0;
        
        details.push({
          id: schedule.id,
          day: schedule.day,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          teacher: ta.user.name,
          subject: ta.subject.name,
          class: `${ta.class.level.name} ${ta.class.major.code} ${ta.class.rombel.name}`,
          hasAttendance,
          hasAssignment,
          isReported: hasAttendance || hasAssignment
        });
      });
    });

    return {
      period: { startDate, endDate },
      statistics: stats,
      byTeacher,
      details
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
        date: {
          gte: start,
          lte: end
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
      hadir: attendances.filter(a => a.status === 'hadir').length,
      sakit: 0, // Not in enum
      izin: attendances.filter(a => a.status === 'izin').length,
      alpha: attendances.filter(a => a.status === 'alfa').length
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
        attendances: {
          where: {
            date: {
              gte: start,
              lte: end
            }
          }
        }
      }
    });

    // Get assignments for this class in the date range
    const assignments = await prisma.assignments.findMany({
      where: {
        teaching_assignment: {
          id_class
        },
        deadline: {
          gte: start,
          lte: end
        }
      }
    });

    // Calculate statistics
    const stats = {
      totalStudents: classInfo.students.length,
      totalSchedules: schedules.length,
      reportedSchedules: schedules.filter(s => s.attendances.length > 0).length,
      totalAttendanceRecords: schedules.reduce((sum, s) => sum + s.attendances.length, 0),
      totalAssignments: assignments.length
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
