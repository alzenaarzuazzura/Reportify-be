const axios = require('axios');

/**
 * WHATSAPP SERVICE: Delivery Channel
 * Bertanggung jawab HANYA untuk mengirim pesan WhatsApp
 * Tidak ada logic token atau business logic lainnya
 */

// WhatsApp API Configuration
const WA_API_URL = process.env.WA_API_URL || 'https://wa-reportify.devops.my.id/send/message';
const WA_API_USER = process.env.WA_API_USER || 'reportify';
const WA_API_PASSWORD = process.env.WA_API_PASSWORD || 'password';

/**
 * Format phone number to WhatsApp format
 * @param {string} phone - Phone number (08xxx or 628xxx)
 * @returns {string} Formatted phone (628xxx@s.whatsapp.net)
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
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
 * Send WhatsApp message
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 * @returns {Promise<Object>} { success, data/error }
 */
const sendMessage = async (phone, message) => {
  try {
    if (!phone) {
      return { success: false, error: 'Nomor WhatsApp tidak tersedia' };
    }
    
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
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    console.log(`✅ WhatsApp sent to ${formattedPhone}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`❌ WhatsApp failed to ${phone}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send reset password link via WhatsApp
 * @param {Object} user - User object { name, phone }
 * @param {string} resetLink - Reset password link
 * @returns {Promise<Object>} { success, data/error }
 */
const sendResetPasswordLink = async (user, resetLink) => {
  const message = `Yth. Bapak/Ibu ${user.name},

Anda telah meminta untuk mengatur/mengubah password akun Reportify Anda.

📧 Email: ${user.email}

Silakan klik link berikut untuk mengatur password baru:
🔗 ${resetLink}

⚠️ PENTING:
• Link ini berlaku selama 1 jam
• Jangan bagikan link ini kepada siapapun
• Gunakan password yang kuat (minimal 8 karakter)

Jika Anda tidak merasa meminta reset password, abaikan pesan ini atau hubungi administrator.

Hormat kami,
Admin Sekolah Pelita Bangsa`;

  return await sendMessage(user.phone, message);
};

module.exports = {
  sendMessage,
  sendResetPasswordLink,
  formatPhoneNumber
};
