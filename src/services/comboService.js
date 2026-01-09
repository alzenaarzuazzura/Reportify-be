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

module.exports = {
  getLevels,
  getMajors,
  getRombels,
  getRoles,
  getTeachers,
  getStudents,
  getSubjects
};
