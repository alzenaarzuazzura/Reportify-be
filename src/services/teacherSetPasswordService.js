const { PrismaClient } = require('@prisma/client');
const whatsappService = require('./whatsappService');
const resetPasswordService = require('./resetPasswordService');

const prisma = new PrismaClient();

// Frontend URL untuk link set password
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Send WhatsApp to teacher for setting up password
 * @param {number} teacherId - Teacher's user ID
 * @returns {Object} Result object with success status and message
 */
const sendTeacherSetPasswordWA = async (teacherId) => {
  try {

    // 1. Ambil data guru dari database
    const teacher = await prisma.users.findUnique({
      where: { 
        id: parseInt(teacherId),
        role: 'teacher' // Pastikan user adalah teacher
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        reset_token: true,
        reset_token_expired: true
      }
    });

    // Validasi: guru tidak ditemukan
    if (!teacher) {
      console.error('❌ Teacher not found or user is not a teacher');
      return { 
        success: false, 
        message: 'Guru tidak ditemukan atau user bukan teacher' 
      };
    }

    // Validasi: nomor WhatsApp tidak tersedia
    if (!teacher.phone) {
      console.error('❌ Teacher phone number not available');
      return { 
        success: false, 
        message: 'Nomor WhatsApp guru tidak tersedia' 
      };
    }

    console.log(`Teacher: ${teacher.name} (${teacher.email})`);
    console.log(`Phone: ${teacher.phone}`);

    // 2. Cek apakah token sudah ada dan masih valid
    const now = new Date();
    let plainToken;
    let tokenExpired;

    // Generate token baru menggunakan resetPasswordService
    console.log('🔄 Generating new reset token...');
    
    const tokenData = await resetPasswordService.createResetToken(teacherId, 60);
    plainToken = tokenData.plainToken;
    tokenExpired = tokenData.expiresAt;

    console.log('✅ New token generated and saved');

    // 3. Buat link set password (gunakan plain token, bukan hashed)
    const setPasswordLink = `${FRONTEND_URL}/reset-password?token=${plainToken}`;
    console.log(`Link: ${setPasswordLink}`);

    // 4. Buat template pesan WhatsApp
    const message = `Yth. Bapak/Ibu ${teacher.name},

Selamat bergabung di Sistem Reportify SMKN 2 Surabaya!

Akun Anda telah berhasil dibuat dengan detail sebagai berikut:
📧 Email: ${teacher.email}

Untuk keamanan akun Anda, silakan segera lakukan pengaturan password dengan mengklik link berikut:
${setPasswordLink}

⚠️ PENTING:
• Link ini berlaku selama 1 jam
• Jangan bagikan link ini kepada siapapun
• Segera set password setelah menerima pesan ini
• Gunakan password yang kuat (minimal 8 karakter, kombinasi huruf besar, kecil, angka, dan simbol)

Jika Anda mengalami kendala atau tidak merasa mendaftar, silakan hubungi administrator sekolah segera.

Terima kasih atas perhatian dan kerjasamanya.

Hormat kami,
Admin SMKN 2 Surabaya`;

    // 5. Kirim WhatsApp
    console.log('📱 Sending WhatsApp message...');
    const waResult = await whatsappService.sendMessage(teacher.phone, message);

    if (waResult.success) {
      console.log('✅ Set password link sent successfully');
      return {
        success: true,
        message: 'Link set password berhasil dikirim ke WhatsApp guru',
        data: {
          teacherId: teacher.id,
          teacherName: teacher.name,
          phone: teacher.phone,
          tokenExpired: tokenExpired
        }
      };
    } else {
      console.error('❌ Failed to send WhatsApp');
      return {
        success: false,
        message: 'Gagal mengirim WhatsApp',
        error: waResult.error
      };
    }

  } catch (error) {
    console.error('❌ Error in sendTeacherSetPasswordWA:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat mengirim link set password',
      error: error.message
    };
  }
};

module.exports = { 
  sendTeacherSetPasswordWA 
};
