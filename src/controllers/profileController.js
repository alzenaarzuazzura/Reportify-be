const passwordService = require('../services/passwordService');

/**
 * Change password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validasi input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: 'Password lama dan password baru wajib diisi'
      });
    }

    // Validasi confirm password jika ada
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: 'Password baru dan konfirmasi password tidak cocok'
      });
    }

    // Validasi password minimal 8 karakter
    if (newPassword.length < 8) {
      return res.status(400).json({
        status: false,
        message: 'Password baru minimal 8 karakter'
      });
    }

    // Validasi password baru tidak sama dengan password lama
    if (currentPassword === newPassword) {
      return res.status(400).json({
        status: false,
        message: 'Password baru tidak boleh sama dengan password lama'
      });
    }

    // Validasi current password
    const isCurrentPasswordValid = await passwordService.validateCurrentPassword(
      userId,
      currentPassword
    );

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: false,
        message: 'Password lama tidak sesuai'
      });
    }

    // Update password using passwordService
    await passwordService.updatePassword(userId, newPassword, false);

    res.json({
      status: true,
      message: 'Password berhasil diubah'
    });
  } catch (error) {
    const statusCode = error.message === 'Password lama tidak sesuai' ? 400 : 500;
    res.status(statusCode).json({
      status: false,
      message: error.message
    });
  }
};

module.exports = {
  changePassword,
};
