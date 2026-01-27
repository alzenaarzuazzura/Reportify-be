# Reset Password Architecture - Unified System

## Overview
Arsitektur unified untuk menangani **Set Password Pertama Kali** dan **Forgot Password** dengan satu logic tanpa duplikasi kode.

## Prinsip Arsitektur

### 1. Single Source of Truth
- **resetPasswordService.js** adalah satu-satunya tempat untuk generate token & link
- Tidak ada duplikasi logic token di controller atau service lain
- Semua operasi reset password menggunakan service ini

### 2. Separation of Concerns
- **Core Logic** (resetPasswordService): Token generation, validation, user management
- **Delivery Channels** (whatsappService, emailService): Hanya bertanggung jawab mengirim pesan
- **Controllers** (authController, userController): Orchestration & business flow

### 3. Delivery Channel Strategy
- **WhatsApp** = Default channel (lebih cepat, langsung ke HP)
- **Email** = Fallback channel (jika WA tidak tersedia atau gagal)
- Tidak ada hard dependency ke salah satu channel

## Struktur Folder

```
be/src/
├── services/
│   ├── resetPasswordService.js    # CORE: Token & Link generation
│   ├── whatsappService.js         # DELIVERY: WhatsApp channel
│   ├── emailService.js            # DELIVERY: Email channel (fallback)
│   └── notificationService.js     # Existing (student notifications)
│
├── controllers/
│   ├── authController.js          # Forgot Password & Reset Password
│   └── userController.js          # Create Teacher & Resend Link
│
└── routes/
    ├── authRoutes.js              # Public routes
    └── userRoutes.js              # Admin routes
```

## Service Responsibilities

### resetPasswordService.js (Core Logic)
**Tanggung Jawab:**
- Generate secure random token (plain + hashed)
- Create reset password link
- Save hashed token to database
- Verify token validity
- Clear token after use
- User data retrieval

**Fungsi Utama:**
- `createResetToken(userId, expiryMinutes)` - Generate & save token
- `verifyResetToken(plainToken)` - Validate token
- `clearResetToken(userId)` - Remove token after success
- `getUserByEmail(email)` - Get user for forgot password
- `getUserById(userId)` - Get user for set password

**Tidak Melakukan:**
- ❌ Mengirim WhatsApp/Email
- ❌ Business logic (siapa yang boleh reset, kapan kirim, dll)
- ❌ HTTP request/response handling

### whatsappService.js (Delivery Channel)
**Tanggung Jawab:**
- Format nomor WhatsApp
- Kirim pesan via WhatsApp API
- Template pesan reset password

**Fungsi Utama:**
- `sendResetPasswordLink(user, resetLink)` - Send WA with template
- `sendMessage(phone, message)` - Generic WA sender
- `formatPhoneNumber(phone)` - Format to WA format

**Tidak Melakukan:**
- ❌ Generate token
- ❌ Save to database
- ❌ Business logic

### emailService.js (Fallback Channel)
**Tanggung Jawab:**
- Setup email transporter
- Kirim email via SMTP
- Template email reset password (HTML)

**Fungsi Utama:**
- `sendResetPasswordLink(user, resetLink)` - Send email with template
- `sendEmail(to, subject, html)` - Generic email sender

**Tidak Melakukan:**
- ❌ Generate token
- ❌ Save to database
- ❌ Business logic

## Flow Diagram

### 1. Set Password Pertama Kali (Admin Create Teacher)

```
Admin Create Teacher
        ↓
userController.createUser()
        ↓
Create user in DB
        ↓
If role = teacher:
        ↓
resetPasswordService.createResetToken()
        ├─ Generate token (plain + hashed)
        ├─ Save hashed token to DB
        └─ Return plain token & link
        ↓
Try WhatsApp first:
        ├─ whatsappService.sendResetPasswordLink()
        └─ Success? → Done ✅
        ↓
If WA failed, try Email:
        ├─ emailService.sendResetPasswordLink()
        └─ Success? → Done ✅
        ↓
Return response to admin
```

### 2. Forgot Password (User Request)

```
User submit email
        ↓
authController.forgotPassword()
        ↓
resetPasswordService.getUserByEmail()
        ├─ User not found? → Return success (security)
        └─ User found? → Continue
        ↓
resetPasswordService.createResetToken()
        ├─ Generate token (plain + hashed)
        ├─ Save hashed token to DB
        └─ Return plain token & link
        ↓
Try WhatsApp first:
        ├─ whatsappService.sendResetPasswordLink()
        └─ Success? → Done ✅
        ↓
If WA failed, try Email:
        ├─ emailService.sendResetPasswordLink()
        └─ Success? → Done ✅
        ↓
Return response to user
```

### 3. Reset Password (User Set New Password)

```
User submit token + new password
        ↓
authController.resetPassword()
        ↓
resetPasswordService.verifyResetToken()
        ├─ Hash token
        ├─ Check DB for valid token
        └─ Token valid? → Return user
        ↓
Hash new password
        ↓
Update password in DB
        ↓
resetPasswordService.clearResetToken()
        ↓
Return success
```

### 4. Resend Link (Admin Manual Resend)

```
Admin click resend button
        ↓
userController.sendPasswordSetupLink()
        ↓
Get user by ID
        ↓
resetPasswordService.createResetToken()
        ├─ Generate NEW token
        ├─ Save to DB (replace old token)
        └─ Return plain token & link
        ↓
Try WhatsApp first → Fallback to Email
        ↓
Return response to admin
```

## API Endpoints

### Public Endpoints (authRoutes.js)

**1. Forgot Password**
```
POST /auth/forgot-password
Body: { email }
Response: { status, message, data: { channel, expiresAt } }
```

**2. Reset Password**
```
POST /auth/reset-password
Body: { token, password }
Response: { status, message }
```

### Admin Endpoints (userRoutes.js)

**1. Create Teacher (Auto Send)**
```
POST /users
Body: { name, email, phone, role: "teacher" }
Response: { status, message, data: user }
Note: Otomatis kirim link set password
```

**2. Resend Password Setup Link**
```
POST /users/:id/send-password-setup
Response: { status, message, data: { channel, expiresAt } }
```

## Security Features

1. **Token Hashing**: Token di-hash dengan SHA256 sebelum disimpan
2. **Token Expiry**: Default 60 menit (configurable)
3. **Plain Token in Link**: Link menggunakan plain token, backend hash untuk verify
4. **No Password Leak**: Password tidak pernah dikirim via WA/Email
5. **Security by Obscurity**: Forgot password selalu return success (tidak bocorkan email exist/not)

## Environment Variables

```env
# Email Configuration
MAIL_USER=reportifyidn@gmail.com
MAIL_PASS=rvpclddacapkjolo
MAIL_FROM=Reportify <reportifyidn@gmail.com>

# WhatsApp Configuration
WA_API_URL=https://wa-reportify.devops.my.id/send/message
WA_API_USER=reportify
WA_API_PASSWORD=password

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## Keuntungan Arsitektur Ini

### ✅ No Code Duplication
- Satu logic token untuk semua use case
- Satu template message untuk semua channel
- Satu endpoint reset password

### ✅ Easy to Maintain
- Perubahan logic token hanya di satu tempat
- Perubahan template message hanya di service masing-masing
- Clear separation of concerns

### ✅ Flexible Delivery
- Mudah tambah channel baru (SMS, Push Notification, dll)
- Mudah ubah priority channel
- Mudah disable salah satu channel

### ✅ Testable
- Service dapat di-test secara independent
- Mock delivery channel untuk testing
- Clear input/output contract

### ✅ Scalable
- Service stateless
- Dapat di-cache (token generation)
- Dapat di-queue (delivery channel)

## Migration dari Old Code

### File yang Dihapus
- ❌ `be/src/services/teacherSetPasswordService.js` (logic dipindah ke resetPasswordService + whatsappService)

### File yang Dimodifikasi
- ✏️ `be/src/controllers/authController.js` - Unified forgot & reset password
- ✏️ `be/src/controllers/userController.js` - Use new services
- ✏️ `be/.env` - Add WA & Email config

### File Baru
- ✅ `be/src/services/resetPasswordService.js` - Core logic
- ✅ `be/src/services/whatsappService.js` - WA delivery
- ✅ `be/src/services/emailService.js` - Email delivery

## Testing Checklist

### Set Password Pertama Kali
- [ ] Admin create teacher dengan phone → WA terkirim
- [ ] Admin create teacher tanpa phone → Email terkirim
- [ ] Admin create teacher, WA gagal → Email terkirim (fallback)
- [ ] Link dari WA dapat diakses dan valid
- [ ] Set password berhasil, token terhapus

### Forgot Password
- [ ] User submit email terdaftar → WA/Email terkirim
- [ ] User submit email tidak terdaftar → Return success (security)
- [ ] Link dari WA/Email dapat diakses dan valid
- [ ] Reset password berhasil, token terhapus

### Resend Link
- [ ] Admin resend link → Token baru di-generate
- [ ] Token lama menjadi invalid
- [ ] Link baru terkirim via WA/Email

### Security
- [ ] Token expired tidak dapat digunakan
- [ ] Token invalid return error
- [ ] Password minimal 8 karakter
- [ ] Token di-hash di database

## Troubleshooting

### WhatsApp Gagal Terkirim
1. Check WA API credentials di `.env`
2. Check nomor phone format (08xxx atau 628xxx)
3. Check WA API endpoint accessible
4. Lihat log error di console
5. Email fallback harus terkirim

### Email Gagal Terkirim
1. Check email credentials di `.env`
2. Check SMTP settings (Gmail: allow less secure apps)
3. Check email format valid
4. Lihat log error di console

### Token Invalid/Expired
1. Check token expiry time (default 60 menit)
2. Check system time server
3. Check token di database (hashed)
4. Generate token baru via resend

## Future Improvements

1. **Queue System**: Gunakan queue (Bull, BullMQ) untuk delivery channel
2. **Retry Mechanism**: Auto retry jika delivery gagal
3. **Notification History**: Log semua notification yang terkirim
4. **Multiple Recipients**: Support CC/BCC untuk email
5. **SMS Channel**: Tambah SMS sebagai channel ketiga
6. **Rate Limiting**: Limit request forgot password per email
7. **Analytics**: Track delivery success rate per channel
