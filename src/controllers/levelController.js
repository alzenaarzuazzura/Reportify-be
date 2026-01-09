const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllLevels = async (req, res) => {
  try {
    const levels = await prisma.levels.findMany();
    res.json(levels);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getLevelById = async (req, res) => {
  try {
    const { id } = req.params;
    const level = await prisma.levels.findUnique({
      where: { id: parseInt(id) }
    });

    if (!level) {
      return res.status(404).json({ message: 'Level tidak ditemukan' });
    }

    res.json(level);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createLevel = async (req, res) => {
  try {
    const { name } = req.body;

    const level = await prisma.levels.create({
      data: { name }
    });

    res.status(201).json(level);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const level = await prisma.levels.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json(level);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.levels.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Level berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

module.exports = {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel
};
