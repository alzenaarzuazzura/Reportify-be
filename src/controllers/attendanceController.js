const AttendanceService = require('../services/attendanceService');
const Validator = require('../utils/validator');

/**
 * Get all attendances dengan search, filter, sort, dan pagination
 * Query params:
 * - id_student: number (filter by student)
 * - id_teaching_assignment: number (filter by teaching assignment)
 * - status: string (filter by status: hadir | izin | alfa)
 * - date_from: date (filter from date)
 * - date_to: date (filter to date)
 * - sortBy: string (date | checked_at | status)
 * - order: string (asc | desc)
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 */
const getAllAttendances = async (req, res) => {
  try {
    // Validate query parameters
    const queryParams = Validator.validateQueryParams(req.query, {
      sortFields: ['date', 'checked_at', 'status'],
      filterFields: ['id_student', 'id_teaching_assignment', 'id_schedule', 'status', 'date_from', 'date_to']
    });

    // Validate date range
    if (queryParams.filters.date_from && queryParams.filters.date_to) {
      if (!Validator.isValidDateRange(queryParams.filters.date_from, queryParams.filters.date_to)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date range'
        });
      }
    }

    const result = await AttendanceService.getAttendances(queryParams);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan', 
      error: error.message 
    });
  }
};

const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await AttendanceService.getAttendanceById(id);

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    const statusCode = error.message === 'Absensi tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message 
    });
  }
};

const createAttendance = async (req, res) => {
  try {
    const attendance = await AttendanceService.createAttendance(req.body);

    res.status(201).json({
      success: true,
      message: 'Absensi berhasil dibuat',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const createBulkAttendance = async (req, res) => {
  try {
    const { attendances } = req.body;

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Attendances harus berupa array dan tidak boleh kosong'
      });
    }

    const result = await AttendanceService.createBulkAttendance(attendances);

    res.status(201).json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await AttendanceService.updateAttendance(id, req.body);

    res.json({
      success: true,
      message: 'Absensi berhasil diupdate',
      data: attendance
    });
  } catch (error) {
    const statusCode = error.message === 'Absensi tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message 
    });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AttendanceService.deleteAttendance(id);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.message === 'Absensi tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  getAllAttendances,
  getAttendanceById,
  createAttendance,
  createBulkAttendance,
  updateAttendance,
  deleteAttendance
};
