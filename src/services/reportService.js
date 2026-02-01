const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class ReportService {
  /**
   * Get attendance report
   * Filters:
   * - startDate & endDate: required date range
   * - id_class: optional, filters by student's class
   * - id_student: optional, filters by specific student
   */
  static async getAttendanceReport({ startDate, endDate, id_class, id_student }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build where clause dynamically
    const where = {
      date: {
        gte: start,
        lte: end
      }
    };

    // Filter by specific student (highest priority)
    if (id_student) {
      where.id_student = parseInt(id_student);
    } 
    // Filter by class (only if no specific student selected)
    else if (id_class) {
      where.student = {
        id_class: parseInt(id_class)
      };
    }

    // Get attendance records with all necessary relations
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

    // Group by student - always build this from the filtered attendances
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

    const byStudent = Array.from(studentMap.values()).map(data => {
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
   * Filters:
   * - startDate & endDate: required date range for assignment deadline
   * - id_class: optional, filters by class
   * - id_subject: optional, filters by subject
   * 
   * Returns:
   * - Statistics of assignments
   * - Summary by subject
   * - Detailed list with student submission info
   */
  static async getAssignmentReport({ startDate, endDate, id_class, id_subject }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build where clause for teaching assignments (dynamic filtering)
    const taWhere = {};
    
    if (id_class) {
      taWhere.id_class = parseInt(id_class);
    }
    
    if (id_subject) {
      taWhere.id_subject = parseInt(id_subject);
    }

    // Get teaching assignments with filtered assignments by date range
    const teachingAssignments = await prisma.teaching_assignments.findMany({
      where: Object.keys(taWhere).length > 0 ? taWhere : undefined,
      include: {
        subject: true,
        class: {
          include: {
            level: true,
            major: true,
            rombel: true,
            students: {
              select: {
                id: true,
                nis: true,
                name: true
              },
              orderBy: {
                name: 'asc'
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        },
        assignments: {
          where: {
            deadline: {
              gte: start,
              lte: end
            }
          },
          include: {
            student_assignments: {
              where: {
                status: true // Only completed assignments
              },
              include: {
                student: {
                  select: {
                    id: true,
                    nis: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            deadline: 'desc'
          }
        }
      }
    });

    // Process assignments and build detailed report
    const assignmentDetails = [];
    const subjectMap = new Map();
    let totalAssignments = 0;
    let totalWithAssignment = 0;

    teachingAssignments.forEach(ta => {
      // Skip if no assignments in date range
      if (ta.assignments.length === 0) return;

      const className = `${ta.class.level.name} ${ta.class.major.code} ${ta.class.rombel.name}`;
      const totalStudents = ta.class.students.length;

      ta.assignments.forEach(assignment => {
        totalAssignments++;
        const hasAssignment = !!(assignment.assignment_title && assignment.assignment_title.trim() !== '');
        
        if (hasAssignment) {
          totalWithAssignment++;
        }

        // Count submissions (status = true means completed)
        const submittedCount = assignment.student_assignments.length;
        const notSubmittedCount = totalStudents - submittedCount;
        
        // Get list of students who submitted (with completion time)
        const submittedStudents = assignment.student_assignments.map(sub => ({
          id: sub.student.id,
          nis: sub.student.nis,
          name: sub.student.name,
          submittedAt: sub.completed_at || new Date()
        }));

        // Get list of students who haven't submitted
        const submittedStudentIds = new Set(submittedStudents.map(s => s.id));
        const notSubmittedStudents = ta.class.students
          .filter(student => !submittedStudentIds.has(student.id))
          .map(student => ({
            id: student.id,
            nis: student.nis,
            name: student.name
          }));

        assignmentDetails.push({
          id: assignment.id,
          date: assignment.deadline,
          assignment: assignment.assignment_title || '-',
          hasAssignment,
          subject: ta.subject.name,
          teacher: ta.user.name,
          class: className,
          totalStudents,
          submittedCount,
          notSubmittedCount,
          submittedStudents,
          notSubmittedStudents
        });

        // Track statistics by subject
        const subjectId = ta.subject.id;
        const subjectName = ta.subject.name;
        
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
        if (hasAssignment) {
          subjectData.withAssignment++;
        } else {
          subjectData.withoutAssignment++;
        }
      });
    });

    // Calculate overall statistics
    const stats = {
      total: totalAssignments,
      withAssignment: totalWithAssignment,
      withoutAssignment: totalAssignments - totalWithAssignment
    };

    stats.completionRate = stats.total > 0 
      ? ((stats.withAssignment / stats.total) * 100).toFixed(2) 
      : '0.00';

    // Build subject summary with completion rates
    const bySubject = Array.from(subjectMap.values()).map(data => ({
      ...data,
      completionRate: data.total > 0 
        ? ((data.withAssignment / data.total) * 100).toFixed(2)
        : '0.00'
    }));

    return {
      period: { startDate, endDate },
      statistics: stats,
      bySubject,
      details: assignmentDetails
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
      where.id_user = parseInt(id_teacher);
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
      where: { id: parseInt(id_student) },
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
        id_student: parseInt(id_student),
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
      where: { id: parseInt(id_class) },
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
          id_class: parseInt(id_class)
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
          id_class: parseInt(id_class)
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

  /**
   * Get notification report (WhatsApp messages sent to parents)
   */
  static async getNotificationReport({ startDate, endDate, id_class, id_student }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Build where clause for schedules
    const where = {};

    if (id_class) {
      where.teaching_assignment = {
        id_class: parseInt(id_class)
      };
    }

    // Get all schedules in the date range
    const schedules = await prisma.schedules.findMany({
      where,
      include: {
        teaching_assignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            subject: true,
            class: {
              include: {
                level: true,
                major: true,
                rombel: true,
                students: {
                  where: id_student ? { id: parseInt(id_student) } : {},
                  select: {
                    id: true,
                    nis: true,
                    name: true,
                    parent_telephone: true
                  }
                }
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

    // Process data to determine notification status
    const details = [];
    const studentNotificationMap = new Map();

    schedules.forEach(schedule => {
      const className = `${schedule.teaching_assignment.class.level.name} ${schedule.teaching_assignment.class.major.code} ${schedule.teaching_assignment.class.rombel.name}`;
      
      schedule.teaching_assignment.class.students.forEach(student => {
        // Check if there are attendances for this student in the date range
        const studentAttendances = schedule.attendances.filter(att => att.id_student === student.id);
        
        studentAttendances.forEach(attendance => {
          const notificationDate = schedule.notification_sent_date;
          const attendanceDate = new Date(attendance.date);
          attendanceDate.setHours(0, 0, 0, 0);
          
          // Notification is sent if notification_sent_date matches attendance date
          const isSent = notificationDate && 
                        new Date(notificationDate).getTime() === attendanceDate.getTime();

          const detail = {
            id: `${schedule.id}-${student.id}-${attendance.date}`,
            date: attendance.date,
            student: {
              id: student.id,
              nis: student.nis,
              name: student.name,
              phone: student.parent_telephone
            },
            class: className,
            subject: schedule.teaching_assignment.subject.name,
            teacher: schedule.teaching_assignment.user.name,
            attendanceStatus: attendance.status,
            notificationSent: isSent,
            notificationDate: isSent ? notificationDate : null
          };

          details.push(detail);

          // Track for statistics
          const key = `${student.id}-${attendance.date}`;
          if (!studentNotificationMap.has(key)) {
            studentNotificationMap.set(key, {
              student,
              class: className,
              date: attendance.date,
              sent: isSent
            });
          }
        });
      });
    });

    // Calculate statistics
    const totalNotifications = studentNotificationMap.size;
    const sentNotifications = Array.from(studentNotificationMap.values()).filter(n => n.sent).length;
    const notSentNotifications = totalNotifications - sentNotifications;

    const stats = {
      total: totalNotifications,
      sent: sentNotifications,
      notSent: notSentNotifications,
      sentRate: totalNotifications > 0 
        ? ((sentNotifications / totalNotifications) * 100).toFixed(2) 
        : '0.00'
    };

    // Group by student
    const byStudent = [];
    const studentMap = new Map();

    details.forEach(detail => {
      const studentId = detail.student.id;
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student: detail.student,
          class: detail.class,
          total: 0,
          sent: 0,
          notSent: 0
        });
      }

      const studentData = studentMap.get(studentId);
      studentData.total++;
      if (detail.notificationSent) {
        studentData.sent++;
      } else {
        studentData.notSent++;
      }
    });

    byStudent.push(...Array.from(studentMap.values()).map(data => ({
      ...data,
      sentRate: ((data.sent / data.total) * 100).toFixed(2)
    })));

    return {
      period: { startDate, endDate },
      statistics: stats,
      byStudent,
      details
    };
  }
}

module.exports = ReportService;
