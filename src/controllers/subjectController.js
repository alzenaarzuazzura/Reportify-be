const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllSubjects = async (req, res) => {
  try {
    const { search, sortBy, order, page, limit } = req.query;

    // Build where clause
    const where = {};

    // Search by name or code
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const validSortFields = ['id', 'name', 'code', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'id';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    const orderBy = { [sortField]: sortOrder };

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.subjects.count({ where });

    // Get subjects with filters, sort, and pagination
    const subjects = await prisma.subjects.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      select: {
        id: true,
        code: true,
        name: true,
        created_at: true
      }
    });

    // Return with pagination metadata
    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data mata pelajaran',
      data: subjects,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getAllSubjects:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data mata pelajaran'
    });
  }
};

const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await prisma.subjects.findUnique({
      where: { id: parseInt(id) }
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Berhasil mengambil data mata pelajaran',
      data: subject
    });
  } catch (error) {
    console.error('Error getSubjectById:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data mata pelajaran'
    });
  }
};

const createSubject = async (req, res) => {
  try {
    const { name, code } = req.body;

    // Validasi input
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Kode dan nama mata pelajaran wajib diisi'
      });
    }

    // Cek kode sudah ada
    const existingSubject = await prisma.subjects.findFirst({
      where: { code }
    });

    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Kode mata pelajaran sudah digunakan'
      });
    }

    const subject = await prisma.subjects.create({
      data: { name, code }
    });

    return res.status(201).json({
      success: true,
      message: 'Mata pelajaran berhasil ditambahkan',
      data: subject
    });
  } catch (error) {
    console.error('Error createSubject:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menambahkan mata pelajaran'
    });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    // Cek subject exists
    const existingSubject = await prisma.subjects.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }

    // Cek kode conflict jika kode diubah
    if (code && code !== existingSubject.code) {
      const codeExists = await prisma.subjects.findFirst({
        where: { code }
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Kode mata pelajaran sudah digunakan'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;

    const subject = await prisma.subjects.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: 'Mata pelajaran berhasil diupdate',
      data: subject
    });
  } catch (error) {
    console.error('Error updateSubject:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengupdate mata pelajaran'
    });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek subject exists
    const existingSubject = await prisma.subjects.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: 'Mata pelajaran tidak ditemukan'
      });
    }

    await prisma.subjects.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      success: true,
      message: 'Mata pelajaran berhasil dihapus',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('Error deleteSubject:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus mata pelajaran'
    });
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
