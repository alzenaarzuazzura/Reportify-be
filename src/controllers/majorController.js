const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllMajors = async (req, res) => {
  try {
    const majors = await prisma.majors.findMany();
    res.json(majors);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getMajorById = async (req, res) => {
  try {
    const { id } = req.params;
    const major = await prisma.majors.findUnique({
      where: { id: parseInt(id) }
    });

    if (!major) {
      return res.status(404).json({ message: 'Jurusan tidak ditemukan' });
    }

    res.json(major);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createMajor = async (req, res) => {
  try {
    const { name, code } = req.body;

    const major = await prisma.majors.create({
      data: { name, code }
    });

    res.status(201).json(major);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateMajor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const major = await prisma.majors.update({
      where: { id: parseInt(id) },
      data: { name, code }
    });

    res.json(major);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const deleteMajor = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.majors.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Jurusan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

module.exports = {
  getAllMajors,
  getMajorById,
  createMajor,
  updateMajor,
  deleteMajor
};
