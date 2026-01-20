const { PrismaClient } = require('@prisma/client');
const QueryBuilder = require('../utils/queryBuilder');

const prisma = new PrismaClient();

class StudentService {
  /**
   * Get students dengan search, filter, sort, dan pagination
   * @param {Object} queryParams - Query parameters
   * @returns {Object} Students data dengan pagination
   */
  static async getStudents(queryParams) {
    const {
      search,
      sortBy,
      order,
      page,
      limit,
      filters
    } = queryParams;

    // Define searchable fields
    const searchFields = ['name', 'nis'];

    // Build base query
    const query = QueryBuilder.buildQuery({
      search,
      searchFields,
      filters,
      sortBy,
      order,
      defaultSort: 'created_at',
      page,
      limit,
      maxLimit: 100
    });

    // Add nested filters untuk level, major, rombel
    if (filters.level || filters.major || filters.rombel) {
      query.where = query.where || {};
      query.where.class = {};
      
      if (filters.level) {
        query.where.class.id_level = parseInt(filters.level);
      }
      if (filters.major) {
        query.where.class.id_major = parseInt(filters.major);
      }
      if (filters.rombel) {
        query.where.class.id_rombel = parseInt(filters.rombel);
      }
    }

    // Execute query dengan include relations
    const [students, total] = await Promise.all([
      prisma.students.findMany({
        ...query,
        include: {
          class: {
            include: {
              level: true,
              major: true,
              rombel: true
            }
          }
        }
      }),
      prisma.students.count({ where: query.where })
    ]);

    // Transform data untuk frontend
    const transformedStudents = students.map(student => ({
      ...student,
      id_class: {
        value: student.class.id,
        label: `${student.class.level.name} ${student.class.major.code} ${student.class.rombel.name}`
      }
    }));

    return QueryBuilder.formatResponse(transformedStudents, total, page, limit);
  }

  /**
   * Get student by ID
   * @param {number} id - Student ID
   * @returns {Object} Student data
   */
  static async getStudentById(id) {
    const student = await prisma.students.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: {
          include: {
            level: true,
            major: true,
            rombel: true
          }
        }
      }
    });

    if (!student) {
      throw new Error('Siswa tidak ditemukan');
    }

    // Transform data untuk frontend
    return {
      ...student,
      id_class: {
        value: student.class.id,
        label: `${student.class.level.name} ${student.class.major.code} ${student.class.rombel.name}`
      }
    };
  }

  /**
   * Create new student
   * @param {Object} data - Student data
   * @returns {Object} Created student
   */
  static async createStudent(data) {
    const { id_class, nis, name, parent_telephone, student_telephone } = data;

    // Check if NIS already exists
    const existingStudent = await prisma.students.findUnique({
      where: { nis }
    });

    if (existingStudent) {
      throw new Error('NIS sudah terdaftar');
    }

    const student = await prisma.students.create({
      data: {
        id_class,
        nis,
        name,
        parent_telephone,
        student_telephone
      },
      include: {
        class: {
          include: {
            level: true,
            major: true,
            rombel: true
          }
        }
      }
    });

    // Transform data untuk frontend
    return {
      ...student,
      id_class: {
        value: student.class.id,
        label: `${student.class.level.name} ${student.class.major.code} ${student.class.rombel.name}`
      }
    };
  }

  /**
   * Update student
   * @param {number} id - Student ID
   * @param {Object} data - Student data
   * @returns {Object} Updated student
   */
  static async updateStudent(id, data) {
    const { id_class, nis, name, parent_telephone, student_telephone } = data;

    // Check if student exists
    await this.getStudentById(id);

    // Check if NIS already exists (exclude current student)
    if (nis) {
      const existingStudent = await prisma.students.findFirst({
        where: {
          nis,
          NOT: { id: parseInt(id) }
        }
      });

      if (existingStudent) {
        throw new Error('NIS sudah terdaftar');
      }
    }

    const student = await prisma.students.update({
      where: { id: parseInt(id) },
      data: {
        id_class,
        nis,
        name,
        parent_telephone,
        student_telephone
      },
      include: {
        class: {
          include: {
            level: true,
            major: true,
            rombel: true
          }
        }
      }
    });

    // Transform data untuk frontend
    return {
      ...student,
      id_class: {
        value: student.class.id,
        label: `${student.class.level.name} ${student.class.major.code} ${student.class.rombel.name}`
      }
    };
  }

  /**
   * Delete student
   * @param {number} id - Student ID
   * @returns {Object} Success message
   */
  static async deleteStudent(id) {
    // Check if student exists
    await this.getStudentById(id);

    await prisma.students.delete({
      where: { id: parseInt(id) }
    });

    return { message: 'Siswa berhasil dihapus' };
  }
}

module.exports = StudentService;
