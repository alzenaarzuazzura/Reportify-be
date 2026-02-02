const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get all levels for combo select
 * @returns {Promise<Array>} Array of {value, label}
 */
const getLevels = async () => {
  const levels = await prisma.levels.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return levels.map((level) => ({
    value: level.id,
    label: level.name,
  }));
};

/**
 * Get all rooms for combo select
 * @returns {Promise<Array>} Array of {value, label}
 */
const getRooms = async () => {
  const rooms = await prisma.rooms.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return rooms.map((level) => ({
    value: level.id,
    label: level.name,
  }));
};

/**
 * Get all subjects for combo select
 * @returns {Promise<Array>} Array of {value, label}
 */
const getSubjects = async () => {
  const subjects = await prisma.subjects.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    }
  })

  return subjects.map((subject) => ({
    value: subject.id,
    label: subject.name,
  }))
}

/**
 * Get all majors for combo select
 * @returns {Promise<Array>} Array of {value, label}
 */
const getMajors = async () => {
  const majors = await prisma.majors.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return majors.map((major) => ({
    value: major.id,
    label: major.name,
  }));
};

/**
 * Get all rombels for combo select
 * @returns {Promise<Array>} Array of {value, label}
 */
const getRombels = async () => {
  const rombels = await prisma.rombels.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return rombels.map((rombel) => ({
    value: rombel.id,
    label: rombel.name,
  }));
};

/**
 * Get all roles (static enum)
 * @returns {Array} Array of {value, label}
 */
const getRoles = () => {
  return [
    { value: 'admin', label: 'admin' },
    { value: 'teacher', label: 'teacher' },
  ];
};

/**
 * Get all teachers (users with role = teacher) for combo select
 * @returns {Promise<Array>} Array of {value, label}
 */
const getTeachers = async () => {
  const teachers = await prisma.users.findMany({
    where: {
      role: 'teacher',
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return teachers.map((teacher) => ({
    value: teacher.id,
    label: teacher.name,
  }));
};

/**
 * Get all students for combo select
 * @param {number} idClass - Optional class ID to filter students
 * @returns {Promise<Array>} Array of {value, label}
 */
const getStudents = async (idClass = null) => {
  const whereClause = idClass ? { id_class: parseInt(idClass) } : {};
  
  const students = await prisma.students.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return students.map((student) => ({
    value: student.id,
    label: student.name,
  }));
};

/**
 * Get all classes for combo select
 * Format: "Level Major Rombel" (e.g., "X RPL 1")
 * @returns {Promise<Array>} Array of {value, label}
 */
const getClasses = async () => {
  const classes = await prisma.classes.findMany({
    select: {
      id: true,
      level: {
        select: {
          name: true,
        },
      },
      major: {
        select: {
          code: true,
        },
      },
      rombel: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { id_level: 'asc' },
      { id_major: 'asc' },
      { id_rombel: 'asc' },
    ],
  });

  return classes.map((classData) => ({
    value: classData.id,
    label: `${classData.level.name} ${classData.major.code} ${classData.rombel.name}`,
  }));
};

/**
 * Get all teaching assignments for combo select
 * Format: "Teacher - Class - Subject"
 * @returns {Promise<Array>} Array of {value, label}
 */
const getTeachingAssignments = async () => {
  const assignments = await prisma.teaching_assignments.findMany({
    select: {
      id: true,
      user: {
        select: {
          name: true,
        },
      },
      class: {
        select: {
          level: {
            select: {
              name: true,
            },
          },
          major: {
            select: {
              code: true,
            },
          },
          rombel: {
            select: {
              name: true,
            },
          },
        },
      },
      subject: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      { id_user: 'asc' },
      { id_class: 'asc' },
    ],
  });

  return assignments.map((assignment) => ({
    value: assignment.id,
    label: `${assignment.user.name} - ${assignment.class.level.name} ${assignment.class.major.code} ${assignment.class.rombel.name} - ${assignment.subject.name}`,
  }));
};

/**
 * Get current schedule for logged in teacher
 * Returns schedule that is currently ongoing based on day and time
 * @param {number} userId - ID of the logged in user
 * @returns {Promise<Array>} Array of current schedules
 */
const getCurrentSchedule = async (userId) => {
  // Get current day and time
  const now = new Date();
  const days = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  const currentDay = days[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 8); // Format HH:MM:SS

  console.log('=== DEBUG getCurrentSchedule ===');
  console.log('Current Day:', currentDay);
  console.log('Current Time:', currentTime);
  console.log('User ID:', userId);

  // Valid days in database enum (weekdays + Saturday)
  const validDays = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  
  // If Sunday (minggu), return empty array
  if (!validDays.includes(currentDay)) {
    console.log('⚠️ Sunday detected, no schedules available');
    return [];
  }

  // Get all schedules for this teacher on current day
  const schedules = await prisma.schedules.findMany({
    where: {
      day: currentDay,
      teaching_assignment: {
        id_user: userId,
      },
    },
    select: {
      id: true,
      day: true,
      start_time: true,
      end_time: true,
      room: {
        select: {
          name: true,
        },
      },
      id_teaching_assignment: true,
      teaching_assignment: {
        select: {
          id_class: true,
          subject: {
            select: {
              name: true,
            },
          },
          class: {
            select: {
              level: {
                select: {
                  name: true,
                },
              },
              major: {
                select: {
                  code: true,
                },
              },
              rombel: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  console.log('Schedules found:', schedules.length);
  schedules.forEach((s, i) => {
    console.log(`Schedule ${i + 1}:`, {
      id: s.id,
      start: s.start_time,
      end: s.end_time,
      day: s.day
    });
  });

  // Filter schedules that are currently ongoing
  const currentSchedules = schedules.filter((schedule) => {
    // Normalize time format (ensure HH:MM:SS)
    const startTime = schedule.start_time.length === 5 ? schedule.start_time + ':00' : schedule.start_time;
    const endTime = schedule.end_time.length === 5 ? schedule.end_time + ':00' : schedule.end_time;
    
    const isOngoing = currentTime >= startTime && currentTime <= endTime;
    console.log(`Checking schedule ${schedule.id}:`);
    console.log(`  Start: ${startTime}`);
    console.log(`  Current: ${currentTime}`);
    console.log(`  End: ${endTime}`);
    console.log(`  Is Ongoing: ${isOngoing}`);
    console.log(`  Comparison: ${startTime} <= ${currentTime} <= ${endTime}`);
    
    return isOngoing;
  });

  console.log('Current schedules found:', currentSchedules.length);

  // Format the response
  return currentSchedules.map((schedule) => {
    const className = `${schedule.teaching_assignment.class.level.name} ${schedule.teaching_assignment.class.major.code} ${schedule.teaching_assignment.class.rombel.name}`;
    const subjectName = schedule.teaching_assignment.subject.name;
    
    return {
      value: schedule.id,
      label: `${subjectName} - ${className} (${schedule.start_time}-${schedule.end_time})`,
      day: schedule.day,
      time: `${schedule.start_time}-${schedule.end_time}`,
      class_name: className,
      subject_name: subjectName,
      room: schedule.room?.name || '-',
      id_teaching_assignment: schedule.id_teaching_assignment,
      id_class: schedule.teaching_assignment.id_class,
    };
  });
};

module.exports = {
  getLevels,
  getMajors,
  getRombels,
  getRoles,
  getTeachers,
  getStudents,
  getSubjects,
  getClasses,
  getTeachingAssignments,
  getCurrentSchedule,
  getRooms
};
