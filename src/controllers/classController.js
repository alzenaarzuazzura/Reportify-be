const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllClasses = async (req, res) => {
  try {
    const { search, level, major, rombel, sortBy, order, sort, page, limit } = req.query;

    // Build where clause
    const where = {};

    // Search by level, major, or rombel name
    if (search) {
      where.OR = [
        { level: { name: { contains: search } } },
        { major: { name: { contains: search } } },
        { rombel: { name: { contains: search } } }
      ];
    }

    // Filter by level
    if (level) {
      where.id_level = parseInt(level);
    }

    // Filter by major
    if (major) {
      where.id_major = parseInt(major);
    }

    // Filter by rombel
    if (rombel) {
      where.id_rombel = parseInt(rombel);
    }

    // Build orderBy clause - support both sortBy/order and order/sort patterns
    const validSortFields = ['id', 'id_level', 'id_major', 'id_rombel'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : (validSortFields.includes(order) ? order : 'id');
    const sortOrder = (sort === 'desc' || sort === 'asc') ? sort : (order === 'desc' ? 'desc' : 'asc');

    const orderBy = { [sortField]: sortOrder };

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.classes.count({ where });

    // Get classes with filters, sort, and pagination
    const classes = await prisma.classes.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        level: true,
        major: true,
        rombel: true,
        _count: {
          select: { students: true }
        }
      }
    });

    // Transform data untuk frontend
    const transformedClasses = classes.map(classData => ({
      id: classData.id,
      id_level: {
        value: classData.id_level,
        label: classData.level.name
      },
      id_major: {
        value: classData.id_major,
        label: classData.major.name
      },
      id_rombel: {
        value: classData.id_rombel,
        label: classData.rombel.name
      },
      studentCount: classData._count.students
    }));

    // Return with pagination metadata
    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data kelas',
      data: transformedClasses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getAllClasses:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data kelas')
    );
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
      return res.status(404).json(
        errorResponse('Kelas tidak ditemukan')
      );
    }

    // Transform data untuk frontend (format yang sama dengan list)
    const transformedClass = {
      id: classData.id,
      id_level: {
        value: classData.id_level,
        label: classData.level.name
      },
      id_major: {
        value: classData.id_major,
        label: classData.major.name
      },
      id_rombel: {
        value: classData.id_rombel,
        label: classData.rombel.name
      },
      students: classData.students
    };

    return res.status(200).json(
      successResponse('Berhasil mengambil data kelas', transformedClass)
    );
  } catch (error) {
    console.error('Error getClassById:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data kelas')
    );
  }
};

const createClass = async (req, res) => {
  try {
    const { id_level, id_major, id_rombel } = req.body;

    // Validasi input
    if (!id_level || !id_major || !id_rombel) {
      return res.status(400).json(
        errorResponse('Level, jurusan, dan rombel wajib diisi')
      );
    }

    // Cek kombinasi sudah ada
    const existingClass = await prisma.classes.findFirst({
      where: {
        id_level,
        id_major,
        id_rombel
      }
    });

    if (existingClass) {
      return res.status(400).json(
        errorResponse('Kombinasi level, jurusan, dan rombel sudah ada')
      );
    }

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

    return res.status(201).json(
      successResponse('Kelas berhasil ditambahkan', classData)
    );
  } catch (error) {
    console.error('Error createClass:', error);
    return res.status(500).json(
      errorResponse('Gagal menambahkan kelas')
    );
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_level, id_major, id_rombel } = req.body;

    // Cek class exists
    const existingClass = await prisma.classes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingClass) {
      return res.status(404).json(
        errorResponse('Kelas tidak ditemukan')
      );
    }

    // Cek kombinasi conflict jika diubah
    if (id_level || id_major || id_rombel) {
      const conflictClass = await prisma.classes.findFirst({
        where: {
          id_level: id_level || existingClass.id_level,
          id_major: id_major || existingClass.id_major,
          id_rombel: id_rombel || existingClass.id_rombel,
          NOT: {
            id: parseInt(id)
          }
        }
      });

      if (conflictClass) {
        return res.status(400).json(
          errorResponse('Kombinasi level, jurusan, dan rombel sudah ada')
        );
      }
    }

    const updateData = {};
    if (id_level) updateData.id_level = id_level;
    if (id_major) updateData.id_major = id_major;
    if (id_rombel) updateData.id_rombel = id_rombel;

    const classData = await prisma.classes.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        level: true,
        major: true,
        rombel: true
      }
    });

    return res.status(200).json(
      successResponse('Kelas berhasil diupdate', classData)
    );
  } catch (error) {
    console.error('Error updateClass:', error);
    return res.status(500).json(
      errorResponse('Gagal mengupdate kelas')
    );
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek class exists
    const existingClass = await prisma.classes.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingClass) {
      return res.status(404).json(
        errorResponse('Kelas tidak ditemukan')
      );
    }

    await prisma.classes.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json(
      successResponse('Kelas berhasil dihapus', { id: parseInt(id) })
    );
  } catch (error) {
    console.error('Error deleteClass:', error);
    return res.status(500).json(
      errorResponse('Gagal menghapus kelas')
    );
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
