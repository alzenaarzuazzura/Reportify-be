const StudentService = require('../services/studentService');
const Validator = require('../utils/validator');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


/**
 * Import students from Excel file
 * Expected Excel format:
 * - Sheet name: "Data Siswa"
 * - Columns: nis, nama, kelas, telepon orangtua, telepon murid
 * - File name: Reportify.xlsx
 */
const importFromExcel = async (req, res) => {
  try {
    // Check if file exists
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        status: false,
        message: 'File Excel tidak ditemukan. Harap upload file dengan nama "file"'
      });
    }

    const file = req.files.file;

    // Validate file extension
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({
        status: false,
        message: 'Format file tidak valid. Harap upload file Excel (.xlsx atau .xls)'
      });
    }

    // Read Excel file
    const workbook = xlsx.read(file.data, { type: 'buffer' });

    // Check if sheet "Data Siswa" exists
    const sheetName = 'Data Siswa';
    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(400).json({
        status: false,
        message: `Sheet "${sheetName}" tidak ditemukan. Pastikan nama sheet adalah "Data Siswa"`
      });
    }

    // Get worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'File Excel kosong atau tidak ada data'
      });
    }

    // Validate and transform data
    const requiredColumns = ['NIS', 'NAMA', 'KELAS', 'TELEPON ORANGTUA'];
    const students = [];
    const errors = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 karena row 1 adalah header

      // Check required columns
      const missingColumns = requiredColumns.filter(col => !row[col]);
      if (missingColumns.length > 0) {
        errors.push({
          row: rowNumber,
          message: `Kolom wajib tidak lengkap: ${missingColumns.join(', ')}`
        });
        continue;
      }

      // Validate NIS (harus unik dan tidak kosong)
      if (!row.NIS || row.NIS.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'NIS tidak boleh kosong'
        });
        continue;
      }

      // Validate nama
      if (!row.NAMA || row.NAMA.toString().trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'Nama tidak boleh kosong'
        });
        continue;
      }

      // Validate kelas (harus berupa angka/ID)

      const classes = await prisma.classes.findMany({
        select: {
          id: true,
          level: { select: { name: true } },
          major: { select: { code: true } },
          rombel: { select: { name: true } },
        }
      });

      const classMap = {};
      classes.forEach(c => {
        const className = `${c.level.name} ${c.major.code} ${c.rombel.name}`.toUpperCase();
        classMap[className] = c.id;
      });

      const className = row.KELAS.toString().trim().toUpperCase();
      const id_class = classMap[className];

      if (!id_class) {
        errors.push({
          row: rowNumber,
          message: `Kelas "${row.KELAS}" tidak ditemukan di sistem`
        });
        continue;
      }

      // Validate telepon orangtua
      if (!row['TELEPON ORANGTUA'] || row['TELEPON ORANGTUA'].toString().trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'Telepon orangtua tidak boleh kosong'
        });
        continue;
      }

      students.push({
        nis: row.NIS.toString().trim(),
        name: row.NAMA.toString().trim(),
        id_class: id_class,
        parent_telephone: row['TELEPON ORANGTUA'].toString().trim(),
        student_telephone: row['TELEPON MURID'] ? row['TELEPON MURID'].toString().trim() : null
      });
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        status: false,
        message: 'Terdapat kesalahan validasi data',
        errors: errors,
        summary: {
          total: jsonData.length,
          valid: students.length,
          invalid: errors.length
        }
      });
    }

    // Import students using service
    const result = await StudentService.importStudents(students);

    return res.status(200).json({
      status: true,
      message: 'Import data siswa berhasil',
      data: result
    });

  } catch (error) {
    console.error('Error importing students:', error);
    return res.status(500).json({
      status: false,
      message: 'Gagal mengimport data siswa',
      error: error.message
    });
  }
};

/**
 * Get all students dengan search, filter, sort, dan pagination
 * Query params:
 * - search: string (search by name or nis)
 * - id_class: number (filter by class)
 * - level: number (filter by level)
 * - major: number (filter by major)
 * - rombel: number (filter by rombel)
 * - order: string (field name: name | nis | created_at | id_class)
 * - sort: string (direction: asc | desc)
 * - page: number (default: 1)
 * - limit: number (default: 10, max: 100)
 */
const getAllStudents = async (req, res) => {
  try {
    const queryParams = Validator.validateQueryParams(req.query, {
      sortFields: ['name', 'nis', 'created_at', 'id_class'],
      filterFields: ['id_class', 'level', 'major', 'rombel']
    });

    const result = await StudentService.getStudents(queryParams);

    const formattedData = result.data.map(student => ({
      id: student.id,
      id_class: student.id_class,
      nis: student.nis,
      name: student.name,
      parent_telephone: student.parent_telephone,
      student_telephone: student.student_telephone,
      created_at: student.created_at
    }));

    return res.json({
      status: true,
      message: 'Data siswa berhasil diambil',
      data: formattedData,
      pagination: result.pagination
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
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
      status: true,
      data: student
    });
  } catch (error) {
    const statusCode = error.message === 'Siswa tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      status: false,
      message: error.message 
    });
  }
};

const createStudent = async (req, res) => {
  try {
    const student = await StudentService.createStudent(req.body);

    res.status(201).json({
      status: true,
      message: 'Siswa berhasil dibuat',
      data: student
    });
  } catch (error) {
    const statusCode = error.message === 'NIS sudah terdaftar' ? 400 : 500;
    res.status(statusCode).json({ 
      status: false,
      message: error.message 
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await StudentService.updateStudent(id, req.body);

    res.json({
      status: true,
      message: 'Siswa berhasil diupdate',
      data: student
    });
  } catch (error) {
    const statusCode = error.message.includes('tidak ditemukan') ? 404 : 
                       error.message.includes('sudah terdaftar') ? 400 : 500;
    res.status(statusCode).json({ 
      status: false,
      message: error.message 
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await StudentService.deleteStudent(id);

    res.json({
      status: true,
      ...result
    });
  } catch (error) {
    const statusCode = error.message === 'Siswa tidak ditemukan' ? 404 : 500;
    res.status(statusCode).json({ 
      status: false,
      message: error.message 
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  importFromExcel
};
