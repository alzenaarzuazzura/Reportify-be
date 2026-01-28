const { PrismaClient } = require('@prisma/client');
const passwordService = require('../services/passwordService');

const prisma = new PrismaClient();

/**
 * Get current user profile
 * @route GET /profile
 * @access Private (all authenticated users)
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log('=== GET PROFILE ===');
    console.log('User from JWT:', req.user);
    console.log('User ID:', userId);

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: 'User ID tidak ditemukan dalam token'
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        created_at: true,
      }
    });

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      status: true,
      message: 'Berhasil mengambil data profile',
      data: user
    });
  } catch (error) {
    console.error('Error getProfile:', error);
    res.status(500).json({
      status: false,
      message: 'Gagal mengambil data profile',
      error: error.message
    });
  }
};

/**
 * Change password
 * Delegates to authController.changePassword for consistency
 */
const changePassword = async (req, res) => {
  // Import authController untuk reuse logic
  const authController = require('./authController');
  return authController.changePassword(req, res);
};

module.exports = {
  getProfile,
  changePassword,
};
