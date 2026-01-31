const ReportService = require('../services/reportService');

/**
 * Get attendance report
 * Query params:
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 * - id_class: number (optional)
 * - id_student: number (optional)
 */
const getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, id_class, id_student } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    const report = await ReportService.getAttendanceReport({
      startDate,
      endDate,
      id_class: id_class ? parseInt(id_class) : undefined,
      id_student: id_student ? parseInt(id_student) : undefined
    });

    res.json({
      status: true,
      data: report
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
 * Get assignment report
 * Query params:
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 * - id_class: number (optional)
 * - id_subject: number (optional)
 */
const getAssignmentReport = async (req, res) => {
  try {
    const { startDate, endDate, id_class, id_subject } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    const report = await ReportService.getAssignmentReport({
      startDate,
      endDate,
      id_class: id_class ? parseInt(id_class) : undefined,
      id_subject: id_subject ? parseInt(id_subject) : undefined
    });

    res.json({
      status: true,
      data: report
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
 * Get teacher activity report
 * Query params:
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 * - id_teacher: number (optional)
 */
const getTeacherActivityReport = async (req, res) => {
  try {
    const { startDate, endDate, id_teacher } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    const report = await ReportService.getTeacherActivityReport({
      startDate,
      endDate,
      id_teacher: id_teacher ? parseInt(id_teacher) : undefined
    });

    res.json({
      status: true,
      data: report
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
 * Get student performance report
 * Query params:
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 * - id_student: number
 */
const getStudentPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, id_student } = req.query;

    if (!startDate || !endDate || !id_student) {
      return res.status(400).json({
        status: false,
        message: 'Start date, end date, dan student ID harus diisi'
      });
    }

    const report = await ReportService.getStudentPerformanceReport({
      startDate,
      endDate,
      id_student: parseInt(id_student)
    });

    res.json({
      status: true,
      data: report
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
 * Get class summary report
 * Query params:
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 * - id_class: number
 */
const getClassSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate, id_class } = req.query;

    if (!startDate || !endDate || !id_class) {
      return res.status(400).json({
        status: false,
        message: 'Start date, end date, dan class ID harus diisi'
      });
    }

    const report = await ReportService.getClassSummaryReport({
      startDate,
      endDate,
      id_class: parseInt(id_class)
    });

    res.json({
      status: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

module.exports = {
  getAttendanceReport,
  getAssignmentReport,
  getTeacherActivityReport,
  getStudentPerformanceReport,
  getClassSummaryReport
};


/**
 * Get notification report (WhatsApp messages)
 * Query params:
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 * - id_class: number (optional)
 * - id_student: number (optional)
 */
const getNotificationReport = async (req, res) => {
  try {
    const { startDate, endDate, id_class, id_student } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: false,
        message: 'Start date dan end date harus diisi'
      });
    }

    const report = await ReportService.getNotificationReport({
      startDate,
      endDate,
      id_class: id_class ? parseInt(id_class) : undefined,
      id_student: id_student ? parseInt(id_student) : undefined
    });

    res.json({
      status: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: 'Terjadi kesalahan',
      error: error.message
    });
  }
};

module.exports = {
  getAttendanceReport,
  getAssignmentReport,
  getTeacherActivityReport,
  getStudentPerformanceReport,
  getClassSummaryReport,
  getNotificationReport
};
