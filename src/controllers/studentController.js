const StudentService = require('../services/studentService');
const Validator = require('../utils/validator');

/**
 * Get all students dengan search, filter, sort, dan pagination
 * Query params:
 * - search: string (search by name or nis)
 * - id_class: number (filter by class)
 * - sortBy: string (name | nis | created_at)
 * - order: string (asc | desc)
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 */
const getAllStudents = async (req, res) => {
  try {
    // Validate query parameters
    const queryParams = Validator.validateQueryParams(req.query, {
      sortFields: ['name', 'nis', 'created_at'],
      filterFields: ['id_class']
    });

    const result = await StudentService.getStudents(queryParams);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan', 
      error: error.message 
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await StudentService.getStudentById(id);

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    const statusCode = error.message === 'Siswa tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message 
    });
  }
};

const createStudent = async (req, res) => {
  try {
    const student = await StudentService.createStudent(req.body);

    res.status(201).json({
      success: true,
      message: 'Siswa berhasil dibuat',
      data: student
    });
  } catch (error) {
    const statusCode = error.message === 'NIS sudah terdaftar' ? 400 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message 
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await StudentService.updateStudent(id, req.body);

    res.json({
      success: true,
      message: 'Siswa berhasil diupdate',
      data: student
    });
  } catch (error) {
    const statusCode = error.message.includes('tidak ditemukan') ? 404 : 
                       error.message.includes('sudah terdaftar') ? 400 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message 
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await StudentService.deleteStudent(id);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.message === 'Siswa tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
