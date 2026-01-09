const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllRombels = async (req, res) => {
  try {
    const rombels = await prisma.rombels.findMany();
    res.json(rombels);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getRombelById = async (req, res) => {
  try {
    const { id } = req.params;
    const rombel = await prisma.rombels.findUnique({
      where: { id: parseInt(id) }
    });

    if (!rombel) {
      return res.status(404).json({ message: 'Rombel tidak ditemukan' });
    }

    res.json(rombel);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createRombel = async (req, res) => {
  try {
    const { name } = req.body;

    const rombel = await prisma.rombels.create({
      data: { name }
    });

    res.status(201).json(rombel);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateRombel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const rombel = await prisma.rombels.update({
      where: { id: parseInt(id) },
      data: { name }
    });

    res.json(rombel);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const deleteRombel = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.rombels.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Rombel berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

module.exports = {
  getAllRombels,
  getRombelById,
  createRombel,
  updateRombel,
  deleteRombel
};
