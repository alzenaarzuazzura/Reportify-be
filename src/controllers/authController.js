const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { successResponse, errorResponse } = require('../types/apiResponse');
const resetPasswordService = require('../services/resetPasswordService');
const passwordService = require('../services/passwordService');
const whatsappService = require('../services/whatsappService');
const emailService = require('../services/emailService');
const { validatePasswordStrength, getPasswordErrorMessage } = require('../utils/passwordValidator');

const prisma = new PrismaClient();

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Email dan password wajib diisi')
      );
    }

    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json(
        errorResponse('Email atau password salah')
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json(
        errorResponse('Email atau password salah')
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const loginData = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    return res.status(200).json(
      successResponse('Login berhasil', loginData)
    );
  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json(
      errorResponse('Gagal melakukan login')
    );
  }
};

const logout = async (req, res) => {
  try {
    return res.status(200).json(
      successResponse('Logout berhasil', null)
    );
  } catch (error) {
    console.error('Error logout:', error);
    return res.status(500).json(
      errorResponse('Gagal melakukan logout')
    );
  }
};

/**
 * UNIFIED Forgot Password
 * Digunakan untuk: Forgot Password & Resend Set Password Link
 * Flow: WhatsApp (default) → Email (fallback)
 * @route POST /auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validasi input
    if (!email) {
      return res.status(400).json(
        errorResponse('Email wajib diisi')
      );
    }

    console.log(`\n=== FORGOT PASSWORD REQUEST ===`);
    console.log(`Email: ${email}`);

    // Get user by email
    const user = await resetPasswordService.getUserByEmail(email);

    // Selalu return success untuk keamanan (tidak bocorkan email terdaftar atau tidak)
    if (!user) {
      console.log('⚠️ User not found, but returning success for security');
      return res.status(200).json(
        successResponse(
          'Jika email terdaftar, link reset password telah dikirim',
          null
        )
      );
    }

    console.log(`User found: ${user.name} (${user.role})`);

    // Generate reset token & link
    const { resetLink, expiresAt } = await resetPasswordService.createResetToken(user.id, 60);
    console.log(`Reset link: ${resetLink}`);

    // Send to BOTH WhatsApp AND Email (tidak ada fallback, kirim keduanya)
    const notifications = [];
    let anySuccess = false;

    // Send WhatsApp if phone available
    if (user.phone) {
      console.log('📱 Sending via WhatsApp...');
      try {
        const waResult = await whatsappService.sendResetPasswordLink(user, resetLink);
        notifications.push({
          channel: 'WhatsApp',
          success: waResult.success,
          phone: user.phone
        });
        if (waResult.success) {
          anySuccess = true;
          console.log('✅ WhatsApp sent successfully');
        }
      } catch (waError) {
        console.warn('⚠️ WhatsApp failed:', waError.message);
      }
    }

    // Send Email (always)
    console.log('📧 Sending via Email...');
    try {
      const emailResult = await emailService.sendResetPasswordLink(user, resetLink);
      notifications.push({
        channel: 'Email',
        success: emailResult.success,
        email: user.email
      });
      if (emailResult.success) {
        anySuccess = true;
        console.log('✅ Email sent successfully');
      }
    } catch (emailError) {
      console.warn('⚠️ Email failed:', emailError.message);
    }

    console.log(`📨 Notification results:`, notifications);

    // Return response
    if (anySuccess) {
      const successChannels = notifications.filter(n => n.success).map(n => n.channel).join(' dan ');
      return res.status(200).json(
        successResponse(
          `Link reset password telah dikirim via ${successChannels}`,
          { channels: notifications, expiresAt }
        )
      );
    } else {
      // Token sudah dibuat tapi gagal kirim semua
      console.error('❌ All delivery channels failed');
      return res.status(500).json(
        errorResponse('Gagal mengirim link reset password. Silakan hubungi administrator.')
      );
    }
  } catch (error) {
    console.error('Error forgot password:', error);
    return res.status(500).json(
      errorResponse('Gagal memproses permintaan reset password')
    );
  }
};

/**
 * UNIFIED Reset Password
 * Digunakan untuk: Set Password Pertama Kali & Reset Password
 * @route POST /auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Validasi input
    if (!token || !password) {
      return res.status(400).json(
        errorResponse('Token dan password wajib diisi')
      );
    }

    // Validasi password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      return res.status(400).json(
        errorResponse(getPasswordErrorMessage(validation.errors))
      );
    }

    console.log(`\n=== RESET PASSWORD REQUEST ===`);

    // Verify token
    const user = await resetPasswordService.verifyResetToken(token);

    if (!user) {
      console.log('❌ Invalid or expired token');
      return res.status(400).json(
        errorResponse('Token tidak valid atau sudah kadaluarsa')
      );
    }

    console.log(`✅ Token valid for user: ${user.name} (${user.email})`);

    // Update password using passwordService (with clearResetToken = true)
    await passwordService.updatePassword(user.id, password, true);

    console.log(`✅ Password reset successfully for user ${user.id}`);

    return res.status(200).json(
      successResponse('Password berhasil diubah', null)
    );
  } catch (error) {
    console.error('Error reset password:', error);
    return res.status(500).json(
      errorResponse('Gagal mengubah password')
    );
  }
};

/**
 * Change Password (untuk user yang sudah login)
 * Requires: JWT authentication
 * @route POST /auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Dari JWT middleware

    // Validasi input
    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        errorResponse('Password lama dan password baru wajib diisi')
      );
    }

    // Validasi password baru strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json(
        errorResponse(getPasswordErrorMessage(validation.errors))
      );
    }

    // Validasi password baru tidak sama dengan password lama
    if (currentPassword === newPassword) {
      return res.status(400).json(
        errorResponse('Password baru tidak boleh sama dengan password lama')
      );
    }

    console.log(`\n=== CHANGE PASSWORD REQUEST ===`);
    console.log(`User ID: ${userId}`);

    // Validasi current password
    const isCurrentPasswordValid = await passwordService.validateCurrentPassword(
      userId,
      currentPassword
    );

    if (!isCurrentPasswordValid) {
      console.log('❌ Current password invalid');
      return res.status(400).json(
        errorResponse('Password lama tidak sesuai')
      );
    }

    console.log('✅ Current password valid');

    // Update password using passwordService (with clearResetToken = false)
    await passwordService.updatePassword(userId, newPassword, false);

    console.log(`✅ Password changed successfully for user ${userId}`);

    return res.status(200).json(
      successResponse('Password berhasil diubah', null)
    );
  } catch (error) {
    console.error('Error change password:', error);
    return res.status(500).json(
      errorResponse('Gagal mengubah password')
    );
  }
};

module.exports = { login, logout, forgotPassword, resetPassword, changePassword };
