const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllAssignments = async (req, res) => {
  try {
    // Get logged in user
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause
    const where = {};

    // For teachers, filter by their teaching assignments
    if (userRole === 'teacher') {
      where.teaching_assignment = {
        id_user: userId
      };
    }

    const assignments = await prisma.assignments.findMany({
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
      },
      orderBy: {
        created_at: 'desc'
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

    // Check if student assignment exists
    const existingAssignment = await prisma.student_assignments.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAssignment) {
      return res.status(404).json({
        status: false,
        message: 'Student assignment tidak ditemukan'
      });
    }

    // Build update data object
    const updateData = {};
    
    // Handle status (could be boolean or string "true"/"false")
    if (status !== undefined) {
      updateData.status = status === true || status === 'true' || status === 1;
      updateData.completed_at = updateData.status ? new Date() : null;
    }
    
    // Handle note
    if (note !== undefined) {
      updateData.note = note;
    }

    const assignment = await prisma.student_assignments.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        student: true,
        assignment: true
      }
    });

    res.json({
      status: true,
      message: 'Student assignment berhasil diupdate',
      data: assignment
    });
  } catch (error) {
    console.error('Error updating student assignment:', error);
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

/**
 * Get student completion status for an assignment
 * Shows which students completed and which haven't
 */
const getStudentCompletionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if assignment exists and get all student_assignments
    const assignment = await prisma.assignments.findUnique({
      where: { id: parseInt(id) },
      include: {
        student_assignments: {
          include: {
            student: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        status: false,
        message: 'Assignment tidak ditemukan'
      });
    }

    // Separate completed and not completed
    const completed = assignment.student_assignments.filter(sa => sa.status === true);
    const notCompleted = assignment.student_assignments.filter(sa => sa.status === false);

    res.json({
      status: true,
      data: {
        total: assignment.student_assignments.length,
        completed_count: completed.length,
        not_completed_count: notCompleted.length,
        completed_students: completed.map(sa => ({
          id: sa.id,
          student_id: sa.id_student,
          student_name: sa.student.name,
          nis: sa.student.nis,
          completed_at: sa.completed_at,
          note: sa.note
        })),
        not_completed_students: notCompleted.map(sa => ({
          id: sa.id,
          student_id: sa.id_student,
          student_name: sa.student.name,
          nis: sa.student.nis
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

/**
 * Get students that don't have student_assignments yet for an assignment
 */
const getMissingStudents = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if assignment exists
    const assignment = await prisma.assignments.findUnique({
      where: { id: parseInt(id) },
      include: {
        teaching_assignment: {
          include: {
            class: {
              include: {
                students: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        status: false,
        message: 'Assignment tidak ditemukan'
      });
    }

    // Get all students in the class
    const allStudents = assignment.teaching_assignment.class.students;

    // Get existing student_assignments
    const existing = await prisma.student_assignments.findMany({
      where: {
        id_assignment: parseInt(id)
      },
      select: {
        id_student: true
      }
    });

    const existingStudentIds = existing.map(e => e.id_student);
    
    // Filter students that don't have student_assignments yet
    const missingStudents = allStudents.filter(
      student => !existingStudentIds.includes(student.id)
    );

    res.json({
      status: true,
      data: {
        total_students: allStudents.length,
        generated: existingStudentIds.length,
        missing: missingStudents.length,
        missing_students: missingStudents
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

/**
 * Generate student assignments for an existing assignment
 * Body: { student_ids: [1, 2, 3] }
 */
const generateStudentAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_ids } = req.body;

    // Check if assignment exists
    const assignment = await prisma.assignments.findUnique({
      where: { id: parseInt(id) },
      include: {
        teaching_assignment: {
          include: {
            class: {
              include: {
                students: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({
        status: false,
        message: 'Assignment tidak ditemukan'
      });
    }

    // If student_ids not provided, use all students from the class
    let studentIdsToUse = student_ids;
    if (!studentIdsToUse || studentIdsToUse.length === 0) {
      studentIdsToUse = assignment.teaching_assignment.class.students.map(s => s.id);
    }

    // Check existing student_assignments
    const existing = await prisma.student_assignments.findMany({
      where: {
        id_assignment: parseInt(id)
      },
      select: {
        id_student: true
      }
    });

    const existingStudentIds = existing.map(e => e.id_student);
    const newStudentIds = studentIdsToUse.filter(sid => !existingStudentIds.includes(sid));

    if (newStudentIds.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Semua siswa sudah memiliki student_assignment'
      });
    }

    // Create student_assignments
    const studentAssignments = newStudentIds.map(studentId => ({
      id_student: studentId,
      id_assignment: parseInt(id),
      status: false
    }));

    await prisma.student_assignments.createMany({
      data: studentAssignments
    });

    // Get updated assignment
    const updatedAssignment = await prisma.assignments.findUnique({
      where: { id: parseInt(id) },
      include: {
        student_assignments: {
          include: {
            student: true
          }
        }
      }
    });

    res.status(201).json({
      status: true,
      message: `Berhasil menambahkan ${newStudentIds.length} student assignments`,
      data: updatedAssignment
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

module.exports = {
  getAllAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  updateStudentAssignment,
  generateStudentAssignments,
  getMissingStudents,
  getStudentCompletionStatus
};

