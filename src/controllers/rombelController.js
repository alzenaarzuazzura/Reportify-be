const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllRombels = async (req, res) => {
  try {
    const rombels = await prisma.rombels.findMany();
    return res.status(200).json(
      successResponse('Berhasil mengambil data rombel', rombels)
    );
  } catch (error) {
    console.error('Error getAllRombels:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data rombel')
    );
  }
};

const getRombelById = async (req, res) => {
  try {
    const { id } = req.params;
    const rombel = await prisma.rombels.findUnique({
      where: { id: parseInt(id) }
    });

    if (!rombel) {
      return res.status(404).json(
        errorResponse('Rombel tidak ditemukan')
      );
    }

    return res.status(200).json(
      successResponse('Berhasil mengambil data rombel', rombel)
    );
  } catch (error) {
    console.error('Error getRombelById:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data rombel')
    );
  }
};

const createRombel = async (req, res) => {
  try {
    const { name } = req.body;

    // Validasi input
    if (!name) {
      return res.status(400).json(
        errorResponse('Nama rombel wajib diisi')
      );
    }

    const rombel = await prisma.rombels.create({
      data: { name }
    });

    return res.status(201).json(
      successResponse('Rombel berhasil ditambahkan', rombel)
    );
  } catch (error) {
    console.error('Error createRombel:', error);
    return res.status(500).json(
      errorResponse('Gagal menambahkan rombel')
    );
  }
};

const updateRombel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Cek rombel exists
    const existingRombel = await prisma.rombels.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRombel) {
      return res.status(404).json(
        errorResponse('Rombel tidak ditemukan')
      );
    }

    const updateData = {};
    if (name) updateData.name = name;

    const rombel = await prisma.rombels.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return res.status(200).json(
      successResponse('Rombel berhasil diupdate', rombel)
    );
  } catch (error) {
    console.error('Error updateRombel:', error);
    return res.status(500).json(
      errorResponse('Gagal mengupdate rombel')
    );
  }
};

const deleteRombel = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek rombel exists
    const existingRombel = await prisma.rombels.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRombel) {
      return res.status(404).json(
        errorResponse('Rombel tidak ditemukan')
      );
    }

    await prisma.rombels.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json(
      successResponse('Rombel berhasil dihapus', { id: parseInt(id) })
    );
  } catch (error) {
    console.error('Error deleteRombel:', error);
    return res.status(500).json(
      errorResponse('Gagal menghapus rombel')
    );
  }
};

module.exports = {
  getAllRombels,
  getRombelById,
  createRombel,
  updateRombel,
  deleteRombel
};
