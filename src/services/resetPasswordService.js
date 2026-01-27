const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Frontend URL untuk link reset password
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * CORE SERVICE: Reset Password Token & Link Generation
 * Single source of truth untuk semua operasi reset password
 * Digunakan untuk: Set Password Pertama Kali & Forgot Password
 */

/**
 * Generate secure random token
 * @returns {Object} { plainToken, hashedToken }
 */
const generateToken = () => {
  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');
  
  return { plainToken, hashedToken };
};

/**
 * Generate reset password link
 * @param {string} plainToken - Plain token (not hashed)
 * @returns {string} Reset password URL
 */
const generateResetLink = (plainToken) => {
  return `${FRONTEND_URL}/reset-password?token=${plainToken}`;
};

/**
 * Create or update reset token for user
 * @param {number} userId - User ID
 * @param {number} expiryMinutes - Token expiry in minutes (default: 60)
 * @returns {Promise<Object>} { plainToken, resetLink, expiresAt }
 */
const createResetToken = async (userId, expiryMinutes = 60) => {
  try {
    // Generate token
    const { plainToken, hashedToken } = generateToken();
    
    // Calculate expiry time
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    // Update user with hashed token
    await prisma.users.update({
      where: { id: parseInt(userId) },
      data: {
        reset_token: hashedToken,
        reset_token_expired: expiresAt
      }
    });
    
    // Generate reset link
    const resetLink = generateResetLink(plainToken);
    
    console.log(`✅ Reset token created for user ${userId}, expires at ${expiresAt}`);
    
    return {
      plainToken,
      resetLink,
      expiresAt
    };
  } catch (error) {
    console.error('Error creating reset token:', error);
    throw new Error('Gagal membuat reset token');
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null
 */
const getUserByEmail = async (email) => {
  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error('Gagal mengambil data user');
  }
};

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const getUserById = async (userId) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new Error('Gagal mengambil data user');
  }
};

/**
 * Verify and consume reset token
 * @param {string} plainToken - Plain token from URL
 * @returns {Promise<Object|null>} User object if valid, null if invalid/expired
 */
const verifyResetToken = async (plainToken) => {
  try {
    // Hash token untuk dicocokkan dengan database
    const hashedToken = crypto
      .createHash('sha256')
      .update(plainToken)
      .digest('hex');
    
    // Cari user dengan token yang valid dan belum expired
    const user = await prisma.users.findFirst({
      where: {
        reset_token: hashedToken,
        reset_token_expired: {
          gt: new Date() // greater than now (belum expired)
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    throw new Error('Gagal memverifikasi token');
  }
};

/**
 * Clear reset token after successful password reset
 * @param {number} userId - User ID
 */
const clearResetToken = async (userId) => {
  try {
    await prisma.users.update({
      where: { id: parseInt(userId) },
      data: {
        reset_token: null,
        reset_token_expired: null
      }
    });
    
    console.log(`✅ Reset token cleared for user ${userId}`);
  } catch (error) {
    console.error('Error clearing reset token:', error);
    throw new Error('Gagal menghapus reset token');
  }
};

module.exports = {
  createResetToken,
  getUserByEmail,
  getUserById,
  verifyResetToken,
  clearResetToken
};
