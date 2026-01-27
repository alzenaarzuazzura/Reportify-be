const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * CORE SERVICE: Password Management
 * Single source of truth untuk semua operasi password
 * Digunakan untuk: Change Password & Reset Password
 */

/**
 * Hash password dengan bcrypt
 * @param {string} plainPassword - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (plainPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Gagal meng-hash password');
  }
};

/**
 * Verify password dengan bcrypt
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if match, false otherwise
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Error verifying password:', error);
    throw new Error('Gagal memverifikasi password');
  }
};

/**
 * Update user password (CORE FUNCTION)
 * Single source of truth untuk update password
 * @param {number} userId - User ID
 * @param {string} newPassword - New plain text password
 * @param {boolean} clearResetToken - Whether to clear reset token (default: false)
 * @returns {Promise<void>}
 */
const updatePassword = async (userId, newPassword, clearResetToken = false) => {
  try {
    // Validasi password minimal 8 karakter
    if (!newPassword || newPassword.length < 8) {
      throw new Error('Password minimal 8 karakter');
    }

    // Hash password baru
    const hashedPassword = await hashPassword(newPassword);

    // Build update data
    const updateData = {
      password: hashedPassword
    };

    // Clear reset token jika diminta (untuk reset password flow)
    if (clearResetToken) {
      updateData.reset_token = null;
      updateData.reset_token_expired = null;
    }

    // Update password di database
    await prisma.users.update({
      where: { id: parseInt(userId) },
      data: updateData
    });

    console.log(`✅ Password updated successfully for user ${userId}`);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Get user with password for verification
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object with password
 */
const getUserWithPassword = async (userId) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting user with password:', error);
    throw new Error('Gagal mengambil data user');
  }
};

/**
 * Validate current password for change password flow
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current plain text password
 * @returns {Promise<boolean>} True if valid, false otherwise
 */
const validateCurrentPassword = async (userId, currentPassword) => {
  try {
    const user = await getUserWithPassword(userId);

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    return isValid;
  } catch (error) {
    console.error('Error validating current password:', error);
    throw error;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  updatePassword,
  getUserWithPassword,
  validateCurrentPassword
};
