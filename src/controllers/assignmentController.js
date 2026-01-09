const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllAssignments = async (req, res) => {
  try {
    const assignments = await prisma.assignments.findMany({
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
            class: {
              include: {
                level: true,
                major: true,
                rombel: true
              }
            },
            subject: true
          }
        },
        student_assignments: {
          include: {
            student: true
          }
        }
      }
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignments.findUnique({
      where: { id: parseInt(id) },
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
            class: {
              include: {
                level: true,
                major: true,
                rombel: true
              }
            },
            subject: true
          }
        },
        student_assignments: {
          include: {
            student: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { id_teaching_assignment, assignment_title, assignment_desc, deadline, student_ids } = req.body;

    const assignment = await prisma.assignments.create({
      data: {
        id_teaching_assignment,
        assignment_title,
        assignment_desc,
        deadline: new Date(deadline)
      }
    });

    if (student_ids && student_ids.length > 0) {
      const studentAssignments = student_ids.map(studentId => ({
        id_student: studentId,
        id_assignment: assignment.id,
        status: false
      }));

      await prisma.student_assignments.createMany({
        data: studentAssignments
      });
    }

    const assignmentWithStudents = await prisma.assignments.findUnique({
      where: { id: assignment.id },
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
            subject: true
          }
        },
        student_assignments: {
          include: {
            student: true
          }
        }
      }
    });

    res.status(201).json(assignmentWithStudents);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_teaching_assignment, assignment_title, assignment_desc, deadline } = req.body;

    const assignment = await prisma.assignments.update({
      where: { id: parseInt(id) },
      data: {
        id_teaching_assignment,
        assignment_title,
        assignment_desc,
        deadline: new Date(deadline)
      },
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
            subject: true
          }
        },
        student_assignments: {
          include: {
            student: true
          }
        }
      }
    });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.assignments.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Tugas berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateStudentAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const assignment = await prisma.student_assignments.update({
      where: { id: parseInt(id) },
      data: {
        status,
        completed_at: status === true ? new Date() : null,
        note
      },
      include: {
        student: true,
        assignment: true
      }
    });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateStudentAssignment
};
