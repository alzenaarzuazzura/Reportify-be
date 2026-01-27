const AttendanceService = require('../services/attendanceService');
const Validator = require('../utils/validator');

/**
 * Get all attendances dengan search, filter, sort, dan pagination
 * For teachers: automatically filter by their teaching assignments
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
    // Get logged in user
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate query parameters
    const queryParams = Validator.validateQueryParams(req.query, {
      sortFields: ['date', 'checked_at', 'status'],
      filterFields: ['id_student', 'id_teaching_assignment', 'id_schedule', 'status', 'date_from', 'date_to']
    });

    // For teachers, add filter by their teaching assignments
    if (userRole === 'teacher') {
      queryParams.filters.id_user = userId;
    }

    // Validate date range
    if (queryParams.filters.date_from && queryParams.filters.date_to) {
      if (!Validator.isValidDateRange(queryParams.filters.date_from, queryParams.filters.date_to)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid date range'
        });
      }
    }

    const result = await AttendanceService.getAttendances(queryParams);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      status: false,
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
      status: true,
      message: 'Data absensi berhasil diambil',
      data: attendance
    });
  } catch (error) {
    const statusCode = error.message === 'Absensi tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      status: false,
      message: error.message 
    });
  }
};

const createAttendance = async (req, res) => {
  try {
    const attendance = await AttendanceService.createAttendance(req.body);

    res.status(201).json({
      status: true,
      message: 'Absensi berhasil dibuat',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      message: error.message 
    });
  }
};

const createBulkAttendance = async (req, res) => {
  try {
    const { attendances } = req.body;

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Attendances harus berupa array dan tidak boleh kosong'
      });
    }

    const result = await AttendanceService.createBulkAttendance(attendances);

    res.status(201).json({
      status: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      message: error.message 
    });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await AttendanceService.updateAttendance(id, req.body);

    res.json({
      status: true,
      message: 'Absensi berhasil diupdate',
      data: attendance
    });
  } catch (error) {
    const statusCode = error.message === 'Absensi tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      status: false,
      message: error.message 
    });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AttendanceService.deleteAttendance(id);

    res.json({
      status: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.message === 'Absensi tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      status: false,
      message: error.message 
    });
  }
};

/**
 * Check if attendance exists for a specific schedule and date
 * Query params:
 * - id_schedule: number (required)
 * - date: YYYY-MM-DD (required)
 */
const checkAttendance = async (req, res) => {
  try {
    const { id_schedule, date } = req.query;

    // Validation
    if (!id_schedule || !date) {
      return res.status(400).json({
        status: false,
        message: 'Parameter id_schedule dan date wajib diisi'
      });
    }

    // Validate date format (YYYY-MM-DD)
    if (!Validator.isValidDate(date)) {
      return res.status(400).json({
        status: false,
        message: 'Format date harus YYYY-MM-DD'
      });
    }

    const exists = await AttendanceService.checkAttendanceExists(
      parseInt(id_schedule),
      date
    );

    res.json({
      status: true,
      message: 'Pengecekan absensi berhasil',
      exists
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      message: error.message 
    });
  }
};

/**
 * Get class session summary for sending report to parents
 * Includes: attendance, assignments, announcements for a specific schedule and date
 */
const getClassSessionSummary = async (req, res) => {
  try {
    const { id_schedule, date } = req.query;

    if (!id_schedule || !date) {
      return res.status(400).json({
        status: false,
        message: 'Parameter id_schedule dan date wajib diisi'
      });
    }

    const summary = await AttendanceService.getClassSessionSummary(
      parseInt(id_schedule),
      date
    );

    res.json({
      status: true,
      message: 'Ringkasan sesi berhasil diambil',
      data: summary
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
      message: error.message 
    });
  }
};

/**
 * Send class session report to parents via WhatsApp
 * Body:
 * - id_schedule: number (required)
 * - date: YYYY-MM-DD (required)
 */
const sendReportToParents = async (req, res) => {
  try {
    const { id_schedule, date } = req.body;

    if (!id_schedule || !date) {
      return res.status(400).json({
        status: false,
        message: 'Parameter id_schedule dan date wajib diisi'
      });
    }

    const result = await AttendanceService.sendReportToParents(
      parseInt(id_schedule),
      date
    );

    res.json({
      status: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ 
      status: false,
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
  deleteAttendance,
  checkAttendance,
  getClassSessionSummary,
  sendReportToParents
};
