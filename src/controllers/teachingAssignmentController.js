const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllTeachingAssignments = async (req, res) => {
  try {
    const { search, teacher, classes, subject, sortBy, order, sort, page, limit } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { teacher: { name: { contains: search } } },
        { classes: { name: { contains: search } } },
        { subject: { name: { contains: search } } },
      ];
    }

    if (teacher) {
      where.id_user = parseInt(teacher)
    }
    
    if (classes) {
      where.id_class = parseInt(classes)
    }
    
    if (subject) {
      where.id_subject = parseInt(subject)
    }

    const validSortFields = ['id', 'id_user', 'id_class', 'id_subject'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : (validSortFields.includes(order) ? order : 'id');
    const sortOrder = (sort === 'desc' || sort === 'asc') ? sort : (order === 'desc' ? 'desc' : 'asc');

    const orderBy = { [sortField]: sortOrder };    

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await prisma.teaching_assignments.count({ where });

    const teaching_assignments = await prisma.teaching_assignments.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        user: true,
        class: true,
        subject: true,
      }
    });    

    const transformed = teaching_assignments.map(assignmentData => ({
      id: assignmentData.id,
      id_user: {
        value: assignmentData.id_user,
        label: assignmentData.user.name
      },
      id_class: {
        value: assignmentData.id_class,
        label: assignmentData.class.name
      },
      id_subject: {
        value: assignmentData.id_subject,
        label: assignmentData.subject.name
      },
    }));   
    
    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data penugasan guru',
      data: transformed,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });    
  } catch (error) {
    console.error('Error getAllTeachingAssignments:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data penugasan guru')
    );
  }
}

const getTeachingAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.teaching_assignments.findUnique({
      where: { id: parseInt(id) }
    });

    if (!assignment) {
      return res.status(404).json(
        errorResponse('Penugasan tidak ditemukan')
      );
    }

    // Fetch related data manually
    const [user, classData, subject] = await Promise.all([
      prisma.users.findUnique({
        where: { id: assignment.id_user },
        select: { id: true, name: true }
      }),
      prisma.classes.findUnique({
        where: { id: assignment.id_class },
        select: { 
          id: true,
          level: { select: { name: true } },
          major: { select: { name: true } },
          rombel: { select: { name: true } }
        }
      }),
      prisma.subjects.findUnique({
        where: { id: assignment.id_subject },
        select: { id: true, name: true }
      })
    ]);

    // Format class name
    const formattedClass = classData ? {
      id: classData.id,
      name: `${classData.level.name} ${classData.major.name} ${classData.rombel.name}`
    } : null;

    // Format response
    const formattedAssignment = {
      id: assignment.id,
      id_user: user,
      id_class: formattedClass,
      id_subject: subject
    };

    return res.status(200).json(
      successResponse('Berhasil mengambil data penugasan', formattedAssignment)
    );
  } catch (error) {
    console.error('Error getTeachingAssignmentById:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data penugasan')
    );
  }
};

const createTeachingAssignment = async (req, res) => {
  try {
    const { id_user, id_class, id_subject } = req.body;

    // Create assignment
    const assignment = await prisma.teaching_assignments.create({
      data: {
        id_user,
        id_class,
        id_subject
      }
    });

    // Fetch related data manually
    const [user, classData, subject] = await Promise.all([
      prisma.users.findUnique({
        where: { id: id_user },
        select: { id: true, name: true }
      }),
      prisma.classes.findUnique({
        where: { id: id_class },
        select: { 
          id: true,
          level: { select: { name: true } },
          major: { select: { name: true } },
          rombel: { select: { name: true } }
        }
      }),
      prisma.subjects.findUnique({
        where: { id: id_subject },
        select: { id: true, name: true }
      })
    ]);

    // Format class name
    const formattedClass = classData ? {
      id: classData.id,
      name: `${classData.level.name} ${classData.major.name} ${classData.rombel.name}`
    } : null;

    // Format response
    const formattedAssignment = {
      id: assignment.id,
      id_user: user,
      id_class: formattedClass,
      id_subject: subject
    };

    return res.status(201).json(
      successResponse('Penugasan berhasil dibuat', formattedAssignment)
    );
  } catch (error) {
    console.error('Error createTeachingAssignment:', error);
    return res.status(500).json(
      errorResponse('Gagal membuat penugasan')
    );
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
      }
    });

    // Fetch related data manually
    const [user, classData, subject] = await Promise.all([
      prisma.users.findUnique({
        where: { id: id_user },
        select: { id: true, name: true }
      }),
      prisma.classes.findUnique({
        where: { id: id_class },
        select: { 
          id: true,
          level: { select: { name: true } },
          major: { select: { name: true } },
          rombel: { select: { name: true } }
        }
      }),
      prisma.subjects.findUnique({
        where: { id: id_subject },
        select: { id: true, name: true }
      })
    ]);

    // Format class name
    const formattedClass = classData ? {
      id: classData.id,
      name: `${classData.level.name} ${classData.major.name} ${classData.rombel.name}`
    } : null;

    // Format response
    const formattedAssignment = {
      id: assignment.id,
      id_user: user,
      id_class: formattedClass,
      id_subject: subject
    };

    return res.status(200).json(
      successResponse('Penugasan berhasil diupdate', formattedAssignment)
    );
  } catch (error) {
    console.error('Error updateTeachingAssignment:', error);
    return res.status(500).json(
      errorResponse('Gagal mengupdate penugasan')
    );
  }
};

const deleteTeachingAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.teaching_assignments.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json(
      successResponse('Penugasan berhasil dihapus', { id: parseInt(id) })
    );
  } catch (error) {
    console.error('Error deleteTeachingAssignment:', error);
    return res.status(500).json(
      errorResponse('Gagal menghapus penugasan')
    );
  }
};

module.exports = {
  getAllTeachingAssignments,
  getTeachingAssignmentById,
  createTeachingAssignment,
  updateTeachingAssignment,
  deleteTeachingAssignment
};
