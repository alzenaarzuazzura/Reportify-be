const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

class RoomService {
  /**
   * Get all rooms with pagination
   */
  static async getRooms({ page = 1, limit = 20, search = '', sortBy = 'name', sortOrder = 'asc' }) {
    const skip = (page - 1) * limit;
    const where = search ? {
      name: {
        contains: search
      }
    } : {};

    const [data, total] = await Promise.all([
      prisma.rooms.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.rooms.count({ where })
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get room by ID
   */
  static async getRoomById(id) {
    const room = await prisma.rooms.findUnique({
      where: { id: parseInt(id) }
    });

    if (!room) {
      throw new Error('Room tidak ditemukan');
    }

    return room;
  }

  /**
   * Create new room
   */
  static async createRoom(data) {
    // Check if name already exists
    const existing = await prisma.rooms.findFirst({
      where: { name: data.name }
    });

    if (existing) {
      throw new Error('Nama ruangan sudah ada');
    }

    return await prisma.rooms.create({
      data: {
        name: data.name
      }
    });
  }

  /**
   * Update room
   */
  static async updateRoom(id, data) {
    // Check if room exists
    await this.getRoomById(id);

    // Check if new name already exists (exclude current room)
    const existing = await prisma.rooms.findFirst({
      where: {
        name: data.name,
        NOT: { id: parseInt(id) }
      }
    });

    if (existing) {
      throw new Error('Nama ruangan sudah ada');
    }

    return await prisma.rooms.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name
      }
    });
  }

  /**
   * Delete room
   */
  static async deleteRoom(id) {
    // Check if room exists
    await this.getRoomById(id);

    // Check if room is used in schedules
    const scheduleCount = await prisma.schedules.count({
      where: { id_room: parseInt(id) }
    });

    if (scheduleCount > 0) {
      throw new Error(`Ruangan tidak dapat dihapus karena masih digunakan di ${scheduleCount} jadwal`);
    }

    return await prisma.rooms.delete({
      where: { id: parseInt(id) }
    });
  }
}

module.exports = RoomService;