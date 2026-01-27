const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllTeachingAssignments = async (req, res) => {
  try {
    const { search, teacher, classes, subject, id_user, id_class, id_subject, sortBy, order, sort, page, limit } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { class: { 
          OR: [
            { level: { name: { contains: search } } },
            { major: { code: { contains: search } } },
            { rombel: { name: { contains: search } } }
          ]
        } },
        { subject: { name: { contains: search } } },
      ];
    }

    // Support both old and new parameter names
    if (teacher || id_user) {
      where.id_user = parseInt(teacher || id_user)
    }
    
    if (classes || id_class) {
      where.id_class = parseInt(classes || id_class)
    }
    
    if (subject || id_subject) {
      where.id_subject = parseInt(subject || id_subject)
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
        class: {
          include: {
            level: true,
            major: true,
            rombel: true,
          }
        },
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
        label: `${assignmentData.class.level.name} ${assignmentData.class.major.code} ${assignmentData.class.rombel.name}`
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
          major: { select: { code: true } },
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
      value: classData.id,
      label: `${classData.level.name} ${classData.major.code} ${classData.rombel.name}`
    } : null;

    // Format response
    const formattedAssignment = {
      id: assignment.id,
      id_user: user ? { value: user.id, label: user.name } : null,
      id_class: formattedClass,
      id_subject: subject ? { value: subject.id, label: subject.name } : null
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
