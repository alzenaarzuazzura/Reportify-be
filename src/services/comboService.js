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
 * @returns {Promise<Array>} Array of {value, label}
 */
const getStudents = async () => {
  const students = await prisma.students.findMany({
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

module.exports = {
  getLevels,
  getMajors,
  getRombels,
  getRoles,
  getTeachers,
  getStudents,
  getSubjects,
  getClasses,
  getTeachingAssignments
};
