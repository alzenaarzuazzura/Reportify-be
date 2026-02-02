const RoomService = require('../services/roomService');

/**
 * Get all rooms
 */
const getRooms = async (req, res) => {
  try {
    const { page, limit, search, sortBy, sortOrder } = req.query;
    
    const result = await RoomService.getRooms({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search: search || '',
      sortBy: sortBy || 'name',
      sortOrder: sortOrder || 'asc'
    });

    res.json({
      status: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

/**
 * Get room by ID
 */
const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await RoomService.getRoomById(id);

    res.json({
      status: true,
      data: room
    });
  } catch (error) {
    const statusCode = error.message === 'Room tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({
      status: false,
      message: error.message
    });
  }
};

/**
 * Create room
 */
const createRoom = async (req, res) => {
  try {
    const room = await RoomService.createRoom(req.body);

    res.status(201).json({
      status: true,
      message: 'Ruangan berhasil dibuat',
      data: room
    });
  } catch (error) {
    const statusCode = error.message === 'Nama ruangan sudah ada' ? 400 : 500;
    res.status(statusCode).json({
      status: false,
      message: error.message
    });
  }
};

/**
 * Update room
 */
const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await RoomService.updateRoom(id, req.body);

    res.json({
      status: true,
      message: 'Ruangan berhasil diupdate',
      data: room
    });
  } catch (error) {
    const statusCode = error.message.includes('tidak ditemukan') ? 404 :
                       error.message.includes('sudah ada') ? 400 : 500;
    res.status(statusCode).json({
      status: false,
      message: error.message
    });
  }
};

/**
 * Delete room
 */
const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    await RoomService.deleteRoom(id);

    res.json({
      status: true,
      message: 'Ruangan berhasil dihapus'
    });
  } catch (error) {
    const statusCode = error.message.includes('tidak ditemukan') ? 404 :
                       error.message.includes('tidak dapat dihapus') ? 400 : 500;
    res.status(statusCode).json({
      status: false,
      message: error.message
    });
  }
};

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
};