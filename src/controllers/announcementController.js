const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await prisma.announcements.findMany({
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
      },
      orderBy: {
        date: 'desc'
      }
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await prisma.announcements.findUnique({
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

    if (!announcement) {
      return res.status(404).json({ message: 'Pengumuman tidak ditemukan' });
    }

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { id_teaching_assignment, title, desc, date } = req.body;

    const announcement = await prisma.announcements.create({
      data: {
        id_teaching_assignment,
        title,
        desc,
        date: new Date(date)
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
            subject: true
          }
        }
      }
    });

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_teaching_assignment, title, desc, date } = req.body;

    const announcement = await prisma.announcements.update({
      where: { id: parseInt(id) },
      data: {
        id_teaching_assignment,
        title,
        desc,
        date: new Date(date)
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
            subject: true
          }
        }
      }
    });

    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.announcements.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Pengumuman berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
