const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

class ProfileService {
  /**
   * Change password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Password lama tidak sesuai');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.users.update({
      where: { id: userId },
      data: {
        password: hashedPassword
      }
    });

    return { message: 'Password berhasil diubah' };
  }

  /**
   * Get login history
   */
  static async getLoginHistory(userId, { page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;

    try {
      const [history, total] = await Promise.all([
        prisma.login_history.findMany({
          where: { id_user: userId },
          orderBy: { login_at: 'desc' },
          skip,
          take: limit
        }),
        prisma.login_history.count({
          where: { id_user: userId }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: history,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      // If table doesn't exist, return empty data
      return {
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      };
    }
  }
}

module.exports = ProfileService;
