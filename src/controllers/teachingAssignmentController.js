const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllTeachingAssignments = async (req, res) => {
  try {
    const assignments = await prisma.teaching_assignments.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
    });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getTeachingAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.teaching_assignments.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Penugasan tidak ditemukan' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createTeachingAssignment = async (req, res) => {
  try {
    const { id_user, id_class, id_subject } = req.body;

    const assignment = await prisma.teaching_assignments.create({
      data: {
        id_user,
        id_class,
        id_subject
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
    });

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateTeachingAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_user, id_class, id_subject } = req.body;

    const assignment = await prisma.teaching_assignments.update({
      where: { id: parseInt(id) },
      data: {
        id_user,
        id_class,
        id_subject
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
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
    });

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const deleteTeachingAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.teaching_assignments.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Penugasan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

module.exports = {
  getAllTeachingAssignments,
  getTeachingAssignmentById,
  createTeachingAssignment,
  updateTeachingAssignment,
  deleteTeachingAssignment
};
