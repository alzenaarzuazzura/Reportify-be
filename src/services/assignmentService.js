const { PrismaClient } = require('@prisma/client');
const QueryBuilder = require('../utils/queryBuilder');

const prisma = new PrismaClient();

class AssignmentService {
  /**
   * Get assignments dengan search, filter, sort, dan pagination
   */
  static async getAssignments(queryParams) {
    const { search, sortBy, order, page, limit, filters } = queryParams;

    const query = QueryBuilder.buildQuery({
      search,
      searchFields: ['assignment_title'],
      filters,
      sortBy,
      order,
      defaultSort: 'created_at',
      page,
      limit,
      maxLimit: 100
    });

    const [assignments, total] = await Promise.all([
      prisma.assignments.findMany({
        ...query,
        include: {
          teaching_assignment: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              class: {
                include: { level: true, major: true, rombel: true }
              },
              subject: true
            }
          },
          student_assignments: {
            include: { student: true }
          }
        }
      }),
      prisma.assignments.count({ where: query.where })
    ]);

    return QueryBuilder.formatResponse(assignments, total, page, limit);
  }

  static async getAssignmentById(id) {
    const assignment = await prisma.assignments.findUnique({
      where: { id: parseInt(id) },
      include: {
        teaching_assignment: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            class: {
              include: { level: true, major: true, rombel: true }
            },
            subject: true
          }
        },
        student_assignments: {
          include: { student: true }
        }
      }
    });

    if (!assignment) {
      throw new Error('Tugas tidak ditemukan');
    }

    return assignment;
  }
}

module.exports = AssignmentService;
