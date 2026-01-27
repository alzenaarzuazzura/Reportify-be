const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');

const prisma = new PrismaClient();

// WhatsApp API Configuration
const WA_API_URL = 'https://wa-reportify.devops.my.id/send/message';
const WA_API_USER = 'reportify';
const WA_API_PASSWORD = 'password';

// Frontend URL untuk link set password
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Format phone number to WhatsApp format
 * @param {string} phone - Phone number (08xxx or 628xxx)
 * @returns {string} Formatted phone (628xxx@s.whatsapp.net)
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Convert 08xxx to 628xxx
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // Add WhatsApp suffix
  return `${cleaned}@s.whatsapp.net`;
};

/**
 * Send WhatsApp message using API
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 * @returns {Object} Result object with success status
 */
const sendWhatsApp = async (phone, message) => {
  try {
    const formattedPhone = formatPhoneNumber(phone);
    
    const response = await axios.post(
      WA_API_URL,
      {
        phone: formattedPhone,
        message: message,
        is_forwarded: false
      },
      {
        auth: {
          username: WA_API_USER,
          password: WA_API_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Generate secure random token for password reset
 * @returns {Object} Object with plain token and hashed token
 */
const generateResetToken = () => {
  const plainToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');
  
  return { plainToken, hashedToken };
};

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
    let tokenExpired = teacher.reset_token_expired;

    // Generate token baru jika belum ada atau sudah expired
    if (!teacher.reset_token || !tokenExpired || new Date(tokenExpired) < now) {
      console.log('🔄 Generating new reset token...');
      
      const { plainToken: newPlainToken, hashedToken } = generateResetToken();
      plainToken = newPlainToken;
      
      // Token berlaku 1 jam ke depan
      tokenExpired = new Date(now.getTime() + 60 * 60 * 1000);

      // Update token di database (simpan hashed token)
      await prisma.users.update({
        where: { id: parseInt(teacherId) },
        data: {
          reset_token: hashedToken,
          reset_token_expired: tokenExpired
        }
      });

      console.log('✅ New token generated and saved');
    } else {
      console.log('⚠️ Token already exists but we need to regenerate for WhatsApp link');
      
      // Jika token sudah ada tapi kita perlu kirim ulang, generate token baru
      const { plainToken: newPlainToken, hashedToken } = generateResetToken();
      plainToken = newPlainToken;
      
      // Token berlaku 1 jam ke depan
      tokenExpired = new Date(now.getTime() + 60 * 60 * 1000);

      // Update token di database
      await prisma.users.update({
        where: { id: parseInt(teacherId) },
        data: {
          reset_token: hashedToken,
          reset_token_expired: tokenExpired
        }
      });

      console.log('✅ New token generated and saved');
    }

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
    const waResult = await sendWhatsApp(teacher.phone, message);

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
