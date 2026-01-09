const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllSchedules = async (req, res) => {
  try {
    const schedules = await prisma.schedules.findMany({
      include: {
        teaching_assignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
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
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await prisma.schedules.findUnique({
      where: { id: parseInt(id) },
      include: {
        teaching_assignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
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

    if (!schedule) {
      return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createSchedule = async (req, res) => {
  try {
    const { id_teaching_assignment, day, start_time, end_time, room } = req.body;

    const schedule = await prisma.schedules.create({
      data: {
        id_teaching_assignment,
        day,
        start_time,
        end_time,
        room
      },
      include: {
        teaching_assignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
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

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_teaching_assignment, day, start_time, end_time, room } = req.body;

    const schedule = await prisma.schedules.update({
      where: { id: parseInt(id) },
      data: {
        id_teaching_assignment,
        day,
        start_time,
        end_time,
        room
      },
      include: {
        teaching_assignment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
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

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.schedules.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
