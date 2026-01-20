const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const getAllSchedules = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await prisma.schedules.count();

    // Get schedules with pagination
    const schedules = await prisma.schedules.findMany({
      skip,
      take: limitNum
    });

    if (schedules.length === 0) {
      return res.status(200).json({
        status: true,
        message: 'Berhasil mengambil data jadwal',
        data: [],
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    }

    // Fetch teaching assignments
    const teachingAssignmentIds = [...new Set(schedules.map(s => s.id_teaching_assignment).filter(Boolean))];
    
    const teachingAssignments = await prisma.teaching_assignments.findMany({
      where: { id: { in: teachingAssignmentIds } }
    });

    // Fetch related data
    const userIds = [...new Set(teachingAssignments.map(ta => ta.id_user).filter(Boolean))];
    const classIds = [...new Set(teachingAssignments.map(ta => ta.id_class).filter(Boolean))];
    const subjectIds = [...new Set(teachingAssignments.map(ta => ta.id_subject).filter(Boolean))];

    const [users, classes, subjects] = await Promise.all([
      userIds.length > 0 ? prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true }
      }) : Promise.resolve([]),
      classIds.length > 0 ? prisma.classes.findMany({
        where: { id: { in: classIds } },
        select: { 
          id: true,
          level: { select: { name: true } },
          major: { select: { name: true } },
          rombel: { select: { name: true } }
        }
      }) : Promise.resolve([]),
      subjectIds.length > 0 ? prisma.subjects.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, name: true }
      }) : Promise.resolve([])
    ]);

    // Create lookup maps
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const classMap = Object.fromEntries(classes.map(c => [
      c.id, 
      { 
        id: c.id, 
        name: `${c.level.name} ${c.major.name} ${c.rombel.name}` 
      }
    ]));
    const subjectMap = Object.fromEntries(subjects.map(s => [s.id, s]));

    // Create teaching assignment map
    const taMap = Object.fromEntries(teachingAssignments.map(ta => [
      ta.id,
      {
        id: ta.id,
        id_user: userMap[ta.id_user] || null,
        id_class: classMap[ta.id_class] || null,
        id_subject: subjectMap[ta.id_subject] || null
      }
    ]));

    // Format response
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      id_teaching_assignment: taMap[schedule.id_teaching_assignment] || null,
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room
    }));

    return res.status(200).json({
      status: true,
      message: 'Berhasil mengambil data jadwal',
      data: formattedSchedules,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getAllSchedules:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data jadwal')
    );
  }
};

const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await prisma.schedules.findUnique({
      where: { id: parseInt(id) }
    });

    if (!schedule) {
      return res.status(404).json(
        errorResponse('Jadwal tidak ditemukan')
      );
    }

    // Fetch teaching assignment
    const teachingAssignment = await prisma.teaching_assignments.findUnique({
      where: { id: schedule.id_teaching_assignment }
    });

    if (!teachingAssignment) {
      return res.status(404).json(
        errorResponse('Data penugasan tidak ditemukan')
      );
    }

    // Fetch related data
    const [user, classData, subject] = await Promise.all([
      prisma.users.findUnique({
        where: { id: teachingAssignment.id_user },
        select: { id: true, name: true }
      }),
      prisma.classes.findUnique({
        where: { id: teachingAssignment.id_class },
        select: { 
          id: true,
          level: { select: { name: true } },
          major: { select: { name: true } },
          rombel: { select: { name: true } }
        }
      }),
      prisma.subjects.findUnique({
        where: { id: teachingAssignment.id_subject },
        select: { id: true, name: true }
      })
    ]);

    const formattedClass = classData ? {
      id: classData.id,
      name: `${classData.level.name} ${classData.major.name} ${classData.rombel.name}`
    } : null;

    const formattedSchedule = {
      id: schedule.id,
      id_teaching_assignment: {
        id: teachingAssignment.id,
        id_user: user,
        id_class: formattedClass,
        id_subject: subject
      },
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room
    };

    return res.status(200).json(
      successResponse('Berhasil mengambil data jadwal', formattedSchedule)
    );
  } catch (error) {
    console.error('Error getScheduleById:', error);
    return res.status(500).json(
      errorResponse('Gagal mengambil data jadwal')
    );
  }
};

const createSchedule = async (req, res) => {
  try {
    const { id_teaching_assignment, day, start_time, end_time, room } = req.body;

    // Convert day to lowercase to match enum
    const normalizedDay = day ? day.toLowerCase() : null;

    const schedule = await prisma.schedules.create({
      data: {
        id_teaching_assignment,
        day: normalizedDay,
        start_time,
        end_time,
        room
      }
    });

    // Fetch teaching assignment
    const teachingAssignment = await prisma.teaching_assignments.findUnique({
      where: { id: id_teaching_assignment }
    });

    // Fetch related data
    const [user, classData, subject] = await Promise.all([
      prisma.users.findUnique({
        where: { id: teachingAssignment.id_user },
        select: { id: true, name: true }
      }),
      prisma.classes.findUnique({
        where: { id: teachingAssignment.id_class },
        select: { 
          id: true,
          level: { select: { name: true } },
          major: { select: { name: true } },
          rombel: { select: { name: true } }
        }
      }),
      prisma.subjects.findUnique({
        where: { id: teachingAssignment.id_subject },
        select: { id: true, name: true }
      })
    ]);

    const formattedClass = classData ? {
      id: classData.id,
      name: `${classData.level.name} ${classData.major.name} ${classData.rombel.name}`
    } : null;

    const formattedSchedule = {
      id: schedule.id,
      id_teaching_assignment: {
        id: teachingAssignment.id,
        id_user: user,
        id_class: formattedClass,
        id_subject: subject
      },
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room
    };

    return res.status(201).json(
      successResponse('Jadwal berhasil dibuat', formattedSchedule)
    );
  } catch (error) {
    console.error('Error createSchedule:', error);
    return res.status(500).json(
      errorResponse('Gagal membuat jadwal')
    );
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_teaching_assignment, day, start_time, end_time, room } = req.body;

    // Convert day to lowercase to match enum
    const normalizedDay = day ? day.toLowerCase() : null;

    const schedule = await prisma.schedules.update({
      where: { id: parseInt(id) },
      data: {
        id_teaching_assignment,
        day: normalizedDay,
        start_time,
        end_time,
        room
      }
    });

    // Fetch teaching assignment
    const teachingAssignment = await prisma.teaching_assignments.findUnique({
      where: { id: id_teaching_assignment }
    });

    // Fetch related data
    const [user, classData, subject] = await Promise.all([
      prisma.users.findUnique({
        where: { id: teachingAssignment.id_user },
        select: { id: true, name: true }
      }),
      prisma.classes.findUnique({
        where: { id: teachingAssignment.id_class },
        select: { 
          id: true,
          level: { select: { name: true } },
          major: { select: { name: true } },
          rombel: { select: { name: true } }
        }
      }),
      prisma.subjects.findUnique({
        where: { id: teachingAssignment.id_subject },
        select: { id: true, name: true }
      })
    ]);

    const formattedClass = classData ? {
      id: classData.id,
      name: `${classData.level.name} ${classData.major.name} ${classData.rombel.name}`
    } : null;

    const formattedSchedule = {
      id: schedule.id,
      id_teaching_assignment: {
        id: teachingAssignment.id,
        id_user: user,
        id_class: formattedClass,
        id_subject: subject
      },
      day: schedule.day,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room
    };

    return res.status(200).json(
      successResponse('Jadwal berhasil diupdate', formattedSchedule)
    );
  } catch (error) {
    console.error('Error updateSchedule:', error);
    return res.status(500).json(
      errorResponse('Gagal mengupdate jadwal')
    );
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.schedules.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json(
      successResponse('Jadwal berhasil dihapus', { id: parseInt(id) })
    );
  } catch (error) {
    console.error('Error deleteSchedule:', error);
    return res.status(500).json(
      errorResponse('Gagal menghapus jadwal')
    );
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
