const nodemailer = require('nodemailer');

/**
 * EMAIL SERVICE: Fallback Delivery Channel
 * Digunakan jika WhatsApp tidak tersedia atau gagal
 * Bertanggung jawab HANYA untuk mengirim email
 */

// Email Configuration
const MAIL_USER = process.env.MAIL_USER || 'reportifyidn@gmail.com';
const MAIL_PASS = process.env.MAIL_PASS || 'rvpclddacapkjolo';
const MAIL_FROM = process.env.MAIL_FROM || 'Reportify';

/**
 * Create email transporter
 */
const createTransporter = async() => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS
    }
  });
};

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<Object>} { success, data/error }
 */
const sendEmail = async (to, subject, html) => {
  try {
    if (!to) {
      return { success: false, error: 'Email tidak tersedia' };
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: MAIL_FROM,
      to: to,
      subject: subject,
      html: html
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send reset password link via Email
 * @param {Object} user - User object { name, email }
 * @param {string} resetLink - Reset password link
 * @returns {Promise<Object>} { success, data/error }
 */
const sendResetPasswordLink = async (user, resetLink) => {
  const subject = 'Reset Password - Reportify';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset Password Reportify</h2>
      
      <p>Yth. Bapak/Ibu <strong>${user.name}</strong>,</p>
      
      <p>Anda telah meminta untuk mengatur/mengubah password akun Reportify Anda.</p>
      
      <p><strong>Email:</strong> ${user.email}</p>
      
      <p>Silakan klik tombol berikut untuk mengatur password baru:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
           style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p>Atau copy link berikut ke browser Anda:</p>
      <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">
        ${resetLink}
      </p>
      
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>⚠️ PENTING:</strong></p>
        <ul style="margin: 10px 0;">
          <li>Link ini berlaku selama 1 jam</li>
          <li>Jangan bagikan link ini kepada siapapun</li>
          <li>Gunakan password yang kuat (minimal 8 karakter)</li>
        </ul>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        Jika Anda tidak merasa meminta reset password, abaikan email ini atau hubungi administrator.
      </p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">
        Hormat kami,<br>
        <strong>Admin Sekolah Pelita Bangsa</strong>
      </p>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendResetPasswordLink
};
