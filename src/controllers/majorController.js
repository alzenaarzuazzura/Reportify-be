const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllMajors = async (req, res) => {
  try {
    const { search, sortBy, order, sort } = req.query;

    // Build where clause for search
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ];
    }

    // Build orderBy clause - support both sortBy/order and order/sort patterns
    const validSortFields = ['id', 'name', 'code'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : (validSortFields.includes(order) ? order : 'code');
    const sortOrder = (sort === 'desc' || sort === 'asc') ? sort : (order === 'desc' ? 'desc' : 'asc');

    const orderBy = { [sortField]: sortOrder };

    const majors = await prisma.majors.findMany({
      where,
      orderBy
    });

    return res.status(200).json(
      successResponse('Berhasil mengambil data jurusan', majors)
    );
  } catch (error) {
    console.error('Error getAllMajors:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data jurusan')
    );
  }
};

const getMajorById = async (req, res) => {
  try {
    const { id } = req.params;
    const major = await prisma.majors.findUnique({
      where: { id: parseInt(id) }
    });

    if (!major) {
      return res.status(404).json(
        errorResponse('Jurusan tidak ditemukan')
      );
    }

    return res.status(200).json(
      successResponse('Berhasil mengambil data jurusan', major)
    );
  } catch (error) {
    console.error('Error getMajorById:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data jurusan')
    );
  }
};

const createMajor = async (req, res) => {
  try {
    const { name, code } = req.body;

    // Validasi input
    if (!name || !code) {
      return res.status(400).json(
        errorResponse('Kode dan nama jurusan wajib diisi')
      );
    }

    // Cek kode sudah ada
    const existingMajor = await prisma.majors.findFirst({
      where: { code }
    });

    if (existingMajor) {
      return res.status(400).json(
        errorResponse('Kode jurusan sudah digunakan')
      );
    }

    const major = await prisma.majors.create({
      data: { name, code }
    });

    return res.status(201).json(
      successResponse('Jurusan berhasil ditambahkan', major)
    );
  } catch (error) {
    console.error('Error createMajor:', error);
    return res.status(500).json(
      errorResponse('Gagal menambahkan jurusan')
    );
  }
};

const updateMajor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    // Cek major exists
    const existingMajor = await prisma.majors.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMajor) {
      return res.status(404).json(
        errorResponse('Jurusan tidak ditemukan')
      );
    }

    // Cek kode conflict jika kode diubah
    if (code && code !== existingMajor.code) {
      const codeExists = await prisma.majors.findFirst({
        where: { code }
      });

      if (codeExists) {
        return res.status(400).json(
          errorResponse('Kode jurusan sudah digunakan')
        );
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;

    const major = await prisma.majors.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return res.status(200).json(
      successResponse('Jurusan berhasil diupdate', major)
    );
  } catch (error) {
    console.error('Error updateMajor:', error);
    return res.status(500).json(
      errorResponse('Gagal mengupdate jurusan')
    );
  }
};

const deleteMajor = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek major exists
    const existingMajor = await prisma.majors.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingMajor) {
      return res.status(404).json(
        errorResponse('Jurusan tidak ditemukan')
      );
    }

    await prisma.majors.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json(
      successResponse('Jurusan berhasil dihapus', { id: parseInt(id) })
    );
  } catch (error) {
    console.error('Error deleteMajor:', error);
    return res.status(500).json(
      errorResponse('Gagal menghapus jurusan')
    );
  }
};

module.exports = {
  getAllMajors,
  getMajorById,
  createMajor,
  updateMajor,
  deleteMajor
};
