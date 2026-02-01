const { PrismaClient } = require('@prisma/client');
const { successResponse, errorResponse } = require('../types/apiResponse');

const prisma = new PrismaClient();

const formatTeachingAssignmentLabel = (user, kelas, subject) => {
  return `${user?.name ?? '-'} - ${kelas ?? '-'} - ${subject?.name ?? '-'}`;
};


const getAllSchedules = async (req, res) => {
  try {
    const { search, id_teaching_assignment, id_user, id_class, id_subject, day, room, start_time, end_time, sortBy, order, sort, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    const andConditions = [];

    // Build where clause for search
    if (search) {
      where.OR = [
        { teaching_assignment: { 
          user: { name: { contains: search } }
        }},
        { teaching_assignment: { 
          class: { 
            OR: [
              { level: { name: { contains: search } } },
              { major: { code: { contains: search } } },
              { rombel: { name: { contains: search } } }
            ]
          }
        }},
        { teaching_assignment: { 
          subject: { name: { contains: search } }
        }},
        { room: { contains: search } }
      ];
    }

    // Filter by teaching assignment
    if (id_teaching_assignment) {
      where.id_teaching_assignment = parseInt(id_teaching_assignment);
    }

    // Filter by teacher, class, or subject through teaching assignment
    if (id_user || id_class || id_subject) {
      where.teaching_assignment = where.teaching_assignment || {};
      if (id_user) {
        where.teaching_assignment.id_user = parseInt(id_user);
      }
      if (id_class) {
        where.teaching_assignment.id_class = parseInt(id_class);
      }
      if (id_subject) {
        where.teaching_assignment.id_subject = parseInt(id_subject);
      }
    }

    // Filter by day
    if (day) {
      where.day = day.toLowerCase();
    }

    // Filter by room
    if (room) {
      where.room = { contains: room };
    }

    // Filter by time range - find schedules that overlap with the given time range
    // A schedule overlaps if: schedule.start_time < filter.end_time AND schedule.end_time > filter.start_time
    if (start_time && end_time) {
      andConditions.push({
        start_time: { lte: end_time }
      });
      andConditions.push({
        end_time: { gte: start_time }
      });
    }

    // Combine AND conditions if any
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Sorting
    const validSortFields = ['id', 'id_teaching_assignment', 'day', 'start_time', 'end_time', 'room'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : (validSortFields.includes(order) ? order : 'id');
    const sortOrder = (sort === 'desc' || sort === 'asc') ? sort : (order === 'desc' ? 'desc' : 'asc');
    const orderBy = { [sortField]: sortOrder };

    // Get total count
    const total = await prisma.schedules.count({ where });

    // Get schedules with pagination
    const schedules = await prisma.schedules.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        teaching_assignment: {
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
        }
      }
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

    // Format response - data already included from query
    const formattedSchedules = schedules.map(schedule => {
      const ta = schedule.teaching_assignment;
      const user = ta?.user;
      const kelas = ta?.class;
      const subject = ta?.subject;
      
      const classLabel = kelas 
        ? `${kelas.level.name} ${kelas.major.code} ${kelas.rombel.name}`
        : '-';
      
      return {
        id: schedule.id,
        id_teaching_assignment: {
          value: ta?.id || null,
          label: `${user?.name ?? '-'} - ${classLabel} - ${subject?.name ?? '-'}`
        },
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room: schedule.room
      };
    });

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
          major: { select: { code: true } },
          rombel: { select: { name: true } }
        }
      }),
      prisma.subjects.findUnique({
        where: { id: teachingAssignment.id_subject },
        select: { id: true, name: true }
      })
    ]);

    const formattedSchedule = {
      id: schedule.id,
      id_teaching_assignment: {
        value: teachingAssignment.id,
        label: formatTeachingAssignmentLabel(
          user,
          `${classData.level.name} ${classData.major.code} ${classData.rombel.name}`,
          subject
        )
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
          major: { select: { code: true } },
          rombel: { select: { name: true } }
        }
      }),
      prisma.subjects.findUnique({
        where: { id: teachingAssignment.id_subject },
        select: { id: true, name: true }
      })
    ]);

    const formattedSchedule = {
      id: schedule.id,
      id_teaching_assignment: {
        value: teachingAssignment.id,
        label: formatTeachingAssignmentLabel(
          user,
          `${classData.level.name} ${classData.major.code} ${classData.rombel.name}`,
          subject
        )
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

    // Check if schedule exists
    const existingSchedule = await prisma.schedules.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingSchedule) {
      return res.status(404).json(
        errorResponse('Jadwal tidak ditemukan')
      );
    }

    // Build update data (only update fields that are provided)
    const updateData = {};
    if (id_teaching_assignment !== undefined) updateData.id_teaching_assignment = id_teaching_assignment;
    if (day !== undefined) updateData.day = day.toLowerCase(); // Convert to lowercase for enum
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (room !== undefined) updateData.room = room;

    // Update schedule
    const schedule = await prisma.schedules.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Use the updated or existing id_teaching_assignment
    const finalTeachingAssignmentId = id_teaching_assignment !== undefined 
      ? id_teaching_assignment 
      : existingSchedule.id_teaching_assignment;

    // Fetch teaching assignment with related data
    const teachingAssignment = await prisma.teaching_assignments.findUnique({
      where: { id: finalTeachingAssignmentId },
      include: {
        user: {
          select: { id: true, name: true }
        },
        class: {
          select: { 
            id: true,
            level: { select: { name: true } },
            major: { select: { code: true } },
            rombel: { select: { name: true } }
          }
        },
        subject: {
          select: { id: true, name: true }
        }
      }
    });

    if (!teachingAssignment) {
      return res.status(404).json(
        errorResponse('Teaching assignment tidak ditemukan')
      );
    }

    const formattedSchedule = {
      id: schedule.id,
      id_teaching_assignment: {
        value: teachingAssignment.id,
        label: formatTeachingAssignmentLabel(
          teachingAssignment.user,
          `${teachingAssignment.class.level.name} ${teachingAssignment.class.major.code} ${teachingAssignment.class.rombel.name}`,
          teachingAssignment.subject
        )
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

const checkScheduleConflict = async (req, res) => {
  try {
    const { day, start_time, end_time, exclude_id } = req.query;

    if (!day || !start_time || !end_time) {
      return res.status(400).json(
        errorResponse('Parameter day, start_time, dan end_time harus diisi')
      );
    }

    const where = {
      day: day.toLowerCase(),
      AND: [
        {
          start_time: { lt: end_time }
        },
        {
          end_time: { gt: start_time }
        }
      ]
    };

    if (exclude_id) {
      where.NOT = {
        id: parseInt(exclude_id)
      };
    }

    const conflictingSchedules = await prisma.schedules.findMany({
      where,
      include: {
        teaching_assignment: {
          include: {
            user: true,
            class: {
              include: {
                level: true,
                major: true,
                rombel: true
              }
            },
            subject: true
          }
        }
      }
    });

    if (conflictingSchedules.length > 0) {
      const conflicts = conflictingSchedules.map(schedule => ({
        id: schedule.id,
        teacher: schedule.teaching_assignment.user.name,
        class: `${schedule.teaching_assignment.class.level.name} ${schedule.teaching_assignment.class.major.code} ${schedule.teaching_assignment.class.rombel.name}`,
        subject: schedule.teaching_assignment.subject.name,
        day: schedule.day,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room: schedule.room
      }));

      return res.status(200).json({
        status: true,
        message: 'Ditemukan jadwal yang bentrok',
        data: {
          hasConflict: true,
          conflicts: conflicts
        }
      });
    }

    return res.status(200).json({
      status: true,
      message: 'Tidak ada jadwal yang bentrok',
      data: {
        hasConflict: false
      }
    });
  } catch (error) {
    console.error('Error checkScheduleConflict:', error);
    return res.status(500).json(
      errorResponse('Gagal mengecek jadwal')
    );
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  checkScheduleConflict
};
