const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllLevels = async (req, res) => {
  try {
    const levels = await prisma.levels.findMany();
    return res.status(200).json(
      successResponse('Berhasil mengambil data level', levels)
    );
  } catch (error) {
    console.error('Error getAllLevels:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data level')
    );
  }
};

const getLevelById = async (req, res) => {
  try {
    const { id } = req.params;
    const level = await prisma.levels.findUnique({
      where: { id: parseInt(id) }
    });

    if (!level) {
      return res.status(404).json(
        errorResponse('Level tidak ditemukan')
      );
    }

    return res.status(200).json(
      successResponse('Berhasil mengambil data level', level)
    );
  } catch (error) {
    console.error('Error getLevelById:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data level')
    );
  }
};

const createLevel = async (req, res) => {
  try {
    const { name } = req.body;

    // Validasi input
    if (!name) {
      return res.status(400).json(
        errorResponse('Nama level wajib diisi')
      );
    }

    const level = await prisma.levels.create({
      data: { name }
    });

    return res.status(201).json(
      successResponse('Level berhasil ditambahkan', level)
    );
  } catch (error) {
    console.error('Error createLevel:', error);
    return res.status(500).json(
      errorResponse('Gagal menambahkan level')
    );
  }
};

const updateLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Cek level exists
    const existingLevel = await prisma.levels.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLevel) {
      return res.status(404).json(
        errorResponse('Level tidak ditemukan')
      );
    }

    const updateData = {};
    if (name) updateData.name = name;

    const level = await prisma.levels.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return res.status(200).json(
      successResponse('Level berhasil diupdate', level)
    );
  } catch (error) {
    console.error('Error updateLevel:', error);
    return res.status(500).json(
      errorResponse('Gagal mengupdate level')
    );
  }
};

const deleteLevel = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek level exists
    const existingLevel = await prisma.levels.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLevel) {
      return res.status(404).json(
        errorResponse('Level tidak ditemukan')
      );
    }

    await prisma.levels.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json(
      successResponse('Level berhasil dihapus', { id: parseInt(id) })
    );
  } catch (error) {
    console.error('Error deleteLevel:', error);
    return res.status(500).json(
      errorResponse('Gagal menghapus level')
    );
  }
};

module.exports = {
  getAllLevels,
  getLevelById,
  createLevel,
  updateLevel,
  deleteLevel
};
