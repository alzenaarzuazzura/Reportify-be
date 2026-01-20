const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { successResponse, errorResponse } = require('../types/apiResponse');

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
 * Forgot Password - Generate reset token
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

    // Cari user berdasarkan email
    const user = await prisma.users.findUnique({
      where: { email }
    });

    // Selalu return success untuk keamanan (tidak bocorkan email terdaftar atau tidak)
    // Tapi hanya generate token jika user ditemukan
    if (user) {
      // Generate random token (32 bytes = 64 hex characters)
      const resetToken = crypto.randomBytes(32).toString('hex');
      
      // Hash token sebelum disimpan di database
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Set expired 15 menit dari sekarang
      const resetTokenExpired = new Date(Date.now() + 15 * 60 * 1000);

      // Update user dengan reset token
      await prisma.users.update({
        where: { id: user.id },
        data: {
          reset_token: hashedToken,
          reset_token_expired: resetTokenExpired
        }
      });

      // TODO: Kirim email dengan link reset password
      // Link format: http://localhost:5173/reset-password?token=${resetToken}
      console.log('Reset token:', resetToken);
      console.log('Reset link:', `http://localhost:5173/reset-password?token=${resetToken}`);
    }

    // Selalu return success message yang sama
    return res.status(200).json(
      successResponse(
        'Jika email terdaftar, link reset password telah dikirim ke email Anda',
        null
      )
    );
  } catch (error) {
    console.error('Error forgot password:', error);
    return res.status(500).json(
      errorResponse('Gagal memproses permintaan reset password')
    );
  }
};

/**
 * Reset Password - Verify token and update password
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

    // Validasi password minimal 8 karakter
    if (password.length < 8) {
      return res.status(400).json(
        errorResponse('Password minimal 8 karakter')
      );
    }

    // Hash token dari request untuk dicocokkan dengan database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Cari user dengan token yang valid dan belum expired
    const user = await prisma.users.findFirst({
      where: {
        reset_token: hashedToken,
        reset_token_expired: {
          gt: new Date() // greater than now (belum expired)
        }
      }
    });

    if (!user) {
      return res.status(400).json(
        errorResponse('Token tidak valid atau sudah kadaluarsa')
      );
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password dan hapus reset token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        reset_token: null,
        reset_token_expired: null
      }
    });

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

module.exports = { login, logout, forgotPassword, resetPassword };
