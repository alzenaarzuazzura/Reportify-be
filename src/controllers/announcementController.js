const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all announcements for logged-in teacher
const getMyAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;

    const announcements = await prisma.announcements.findMany({
      where: {
        teaching_assignment: {
          id_user: userId
        }
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
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Transform to match frontend expectations
    const transformedAnnouncements = announcements.map(announcement => ({
      id: announcement.id,
      id_user: announcement.teaching_assignment.id_user,
      title: announcement.title,
      content: announcement.desc,
      announcement_date: announcement.date,
      created_at: announcement.created_at,
      updated_at: announcement.created_at,
      user: announcement.teaching_assignment.user
    }));

    res.json(transformedAnnouncements);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

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

    // Transform to match frontend expectations
    const transformedAnnouncement = {
      id: announcement.id,
      id_user: announcement.teaching_assignment.id_user,
      title: announcement.title,
      content: announcement.desc,
      announcement_date: announcement.date,
      created_at: announcement.created_at,
      updated_at: announcement.created_at,
      user: announcement.teaching_assignment.user
    };

    res.json(transformedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, announcement_date } = req.body;
    const userId = req.user.id;

    // Get first teaching assignment for this teacher
    // In real scenario, you might want to let teacher select which class
    const teachingAssignment = await prisma.teaching_assignments.findFirst({
      where: {
        id_user: userId
      }
    });

    if (!teachingAssignment) {
      return res.status(400).json({ message: 'Anda belum memiliki kelas yang diajar' });
    }

    const announcement = await prisma.announcements.create({
      data: {
        id_teaching_assignment: teachingAssignment.id,
        title,
        desc: content,
        date: new Date(announcement_date)
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

    // Transform response
    const transformedAnnouncement = {
      id: announcement.id,
      id_user: announcement.teaching_assignment.id_user,
      title: announcement.title,
      content: announcement.desc,
      announcement_date: announcement.date,
      created_at: announcement.created_at,
      updated_at: announcement.created_at,
      user: announcement.teaching_assignment.user
    };

    res.status(201).json(transformedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan', error: error.message });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, announcement_date } = req.body;

    const announcement = await prisma.announcements.update({
      where: { id: parseInt(id) },
      data: {
        title,
        desc: content,
        date: new Date(announcement_date)
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

    // Transform response
    const transformedAnnouncement = {
      id: announcement.id,
      id_user: announcement.teaching_assignment.id_user,
      title: announcement.title,
      content: announcement.desc,
      announcement_date: announcement.date,
      created_at: announcement.created_at,
      updated_at: announcement.created_at,
      user: announcement.teaching_assignment.user
    };

    res.json(transformedAnnouncement);
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
  getMyAnnouncements,
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
