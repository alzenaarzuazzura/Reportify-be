const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.classes.findMany({
      include: {
        level: true,
        major: true,
        rombel: true,
        _count: {
          select: { students: true }
        }
      }
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await prisma.classes.findUnique({
      where: { id: parseInt(id) },
      include: {
        level: true,
        major: true,
        rombel: true,
        students: true
      }
    });

    if (!classData) {
      return res.status(404).json({ message: 'Kelas tidak ditemukan' });
    }

    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { id_level, id_major, id_rombel } = req.body;

    const classData = await prisma.classes.create({
      data: {
        id_level,
        id_major,
        id_rombel
      },
      include: {
        level: true,
        major: true,
        rombel: true
      }
    });

    res.status(201).json(classData);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_level, id_major, id_rombel } = req.body;

    const classData = await prisma.classes.update({
      where: { id: parseInt(id) },
      data: {
        id_level,
        id_major,
        id_rombel
      },
      include: {
        level: true,
        major: true,
        rombel: true
      }
    });

    res.json(classData);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.classes.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Kelas berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
