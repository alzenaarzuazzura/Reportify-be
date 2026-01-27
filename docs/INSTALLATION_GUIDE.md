# Installation & Testing Guide - Unified Reset Password

## Prerequisites
- Node.js v16+ 
- MySQL Database
- Gmail account (untuk email service)
- WhatsApp API access (opsional, bisa fallback ke email)

## Installation Steps

### 1. Install Dependencies
```bash
cd be
npm install
```

**Dependencies yang dibutuhkan:**
- `nodemailer` - Email service ✅ (sudah terinstall)
- `axios` - WhatsApp API client ✅
- `bcrypt` - Password hashing ✅
- `jsonwebtoken` - JWT authentication ✅
- `@prisma/client` - Database ORM ✅

### 2. Configure Environment Variables

Edit file `be/.env`:

```env
# Database
DATABASE_URL="mysql://root@localhost:3306/db_reportify"

# JWT
JWT_SECRET="your-secret-key-here"

# Server
PORT=3000
NODE_ENV=development

# Email Configuration (REQUIRED)
MAIL_USER=reportifyidn@gmail.com
MAIL_PASS=rvpclddacapkjolo
MAIL_FROM=Reportify <reportifyidn@gmail.com>

# WhatsApp Configuration (OPTIONAL - fallback to email if not configured)
WA_API_URL=https://wa-reportify.devops.my.id/send/message
WA_API_USER=reportify
WA_API_PASSWORD=password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**Catatan Email:**
- Gunakan Gmail App Password, bukan password biasa
- Cara generate App Password: https://support.google.com/accounts/answer/185833
- Atau gunakan SMTP provider lain (Mailgun, SendGrid, dll)

### 3. Database Migration

Pastikan database sudah dibuat dan schema sudah di-migrate:

```bash
cd be
npx prisma generate
npx prisma migrate dev
```

### 4. Start Server

```bash
cd be
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## Testing Guide

### Test 1: Create Teacher (Auto Send Link)

**Endpoint:** `POST /reportify/users`

**Request:**
```json
{
  "name": "Test Teacher",
  "email": "teacher@test.com",
  "phone": "081234567890",
  "role": "teacher"
}
```

**Expected Result:**
1. User created successfully
2. Reset token generated
3. WhatsApp sent (if phone available & WA API configured)
4. Email sent (if WA failed or not configured)
5. Check console log untuk delivery status

**Console Log Example:**
```
📤 Sending set password link to teacher: Test Teacher
✅ Reset token created for user 5, expires at 2024-01-24T15:30:00.000Z
📱 Attempting WhatsApp delivery...
✅ WhatsApp sent to 6281234567890@s.whatsapp.net
✅ WhatsApp delivery successful
```

### Test 2: Forgot Password

**Endpoint:** `POST /reportify/auth/forgot-password`

**Request:**
```json
{
  "email": "teacher@test.com"
}
```

**Expected Result:**
1. User found by email
2. Reset token generated
3. WhatsApp sent (if phone available)
4. Email sent (if WA failed)
5. Response: "Link reset password telah dikirim via WhatsApp/Email"

**Console Log Example:**
```
=== FORGOT PASSWORD REQUEST ===
Email: teacher@test.com
User found: Test Teacher (teacher)
Reset link: http://localhost:5173/reset-password?token=abc123...
📱 Attempting WhatsApp delivery...
✅ WhatsApp delivery successful
```

### Test 3: Reset Password

**Endpoint:** `POST /reportify/auth/reset-password`

**Request:**
```json
{
  "token": "abc123...",
  "password": "newpassword123"
}
```

**Expected Result:**
1. Token verified successfully
2. Password updated
3. Token cleared from database
4. Response: "Password berhasil diubah"

**Console Log Example:**
```
=== RESET PASSWORD REQUEST ===
✅ Token valid for user: Test Teacher (teacher@test.com)
✅ Password updated successfully for user 5
✅ Reset token cleared for user 5
```

### Test 4: Resend Password Setup Link

**Endpoint:** `POST /reportify/users/:id/send-password-setup`

**Request:** (No body, just user ID in URL)

**Expected Result:**
1. User found
2. NEW token generated (old token replaced)
3. WhatsApp/Email sent
4. Response with delivery channel

**Console Log Example:**
```
📤 Resending set password link to: Test Teacher
✅ Reset token created for user 5, expires at 2024-01-24T16:30:00.000Z
📱 Attempting WhatsApp delivery...
✅ WhatsApp delivery successful
```

## Troubleshooting

### Error: Cannot find module 'nodemailer'

**Solution:**
```bash
cd be
npm install nodemailer
```

### Error: WhatsApp delivery failed

**Kemungkinan Penyebab:**
1. WA API credentials salah
2. WA API endpoint tidak accessible
3. Nomor phone format salah

**Solution:**
- Check `.env` untuk WA_API_URL, WA_API_USER, WA_API_PASSWORD
- Test WA API dengan curl/postman
- System akan otomatis fallback ke Email

**Fallback Behavior:**
```
📱 Attempting WhatsApp delivery...
❌ WhatsApp failed to 081234567890: Connection timeout
⚠️ WhatsApp delivery failed, trying email fallback...
📧 Attempting Email delivery...
✅ Email sent to teacher@test.com: <message-id>
✅ Email delivery successful
```

### Error: Email delivery failed

**Kemungkinan Penyebab:**
1. Gmail App Password salah
2. Gmail "Less secure app access" disabled
3. SMTP blocked by firewall

**Solution:**
1. Generate Gmail App Password baru
2. Enable "Less secure app access" (jika perlu)
3. Test dengan SMTP provider lain (Mailgun, SendGrid)
4. Check firewall settings

### Error: Token tidak valid atau sudah kadaluarsa

**Kemungkinan Penyebab:**
1. Token sudah expired (default 60 menit)
2. Token sudah digunakan (cleared after success)
3. System time server tidak sync

**Solution:**
1. Request token baru via forgot password atau resend
2. Check token expiry time di database
3. Sync system time

### Error: Password minimal 8 karakter

**Solution:**
- Gunakan password minimal 8 karakter
- Frontend sudah ada validasi, tapi backend juga validate

## Monitoring & Logs

### Console Logs

Service akan log setiap step dengan emoji untuk mudah dibaca:

```
✅ Success
❌ Error
⚠️ Warning
📱 WhatsApp action
📧 Email action
🔄 Processing
```

### Database Check

Check token di database:
```sql
SELECT id, name, email, reset_token, reset_token_expired 
FROM users 
WHERE email = 'teacher@test.com';
```

**Note:** Token di database dalam bentuk hashed (SHA256)

### Test Email Delivery

Jika ingin test email tanpa WhatsApp:
1. Kosongkan field `phone` saat create teacher
2. Atau set `WA_API_URL` ke URL invalid
3. System akan langsung fallback ke email

## Production Checklist

- [ ] Environment variables configured
- [ ] Gmail App Password generated
- [ ] WhatsApp API tested (or disabled)
- [ ] Database migrated
- [ ] Frontend URL correct
- [ ] Token expiry time appropriate (default 60 min)
- [ ] Email template reviewed
- [ ] WhatsApp template reviewed
- [ ] Error handling tested
- [ ] Fallback mechanism tested
- [ ] Security audit passed

## Next Steps

1. Test semua endpoint dengan Postman/Thunder Client
2. Test delivery channels (WA & Email)
3. Test token expiry
4. Test frontend integration
5. Monitor logs untuk error
6. Setup production email service (Mailgun, SendGrid, dll)
7. Setup monitoring & alerting

## Support

Jika ada masalah:
1. Check console logs
2. Check database (token & expiry)
3. Test delivery channels independently
4. Review environment variables
5. Check network connectivity
