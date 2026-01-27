# Arsitektur Services Backend

Dokumentasi ini menjelaskan perbedaan dan fungsi masing-masing service di backend sistem Reportify.

## 📋 Daftar Services

1. **whatsappService.js** - Delivery Channel (WhatsApp)
2. **emailService.js** - Delivery Channel (Email)
3. **passwordService.js** - Core Password Management
4. **resetPasswordService.js** - Reset Password Token & Link
5. **teacherSetPasswordService.js** - ⚠️ DEPRECATED (Legacy)
6. **notificationService.js** - Scheduled Notifications (Cron Job)

---

## 1. 🟢 whatsappService.js

### Fungsi Utama
**Delivery Channel** - Bertanggung jawab HANYA untuk mengirim pesan WhatsApp.

### Tanggung Jawab
- ✅ Format nomor telepon (08xxx → 628xxx@s.whatsapp.net)
- ✅ Kirim HTTP POST ke WhatsApp API
- ✅ Return success/error status

### Fungsi Utama
```javascript
sendMessage(phone, message)           // Generic send message
sendResetPasswordLink(user, resetLink) // Send reset password link
formatPhoneNumber(phone)              // Format phone number
```

### Kapan Digunakan
- Kirim link reset password ke teacher
- Kirim laporan pembelajaran ke wali murid
- Kirim notifikasi terjadwal
- Semua komunikasi via WhatsApp

### Karakteristik
- ✅ **Single Responsibility**: Hanya kirim WhatsApp
- ✅ **No Business Logic**: Tidak ada logic token, database, dll
- ✅ **Reusable**: Bisa digunakan di mana saja
- ✅ **Clean**: Fokus pada delivery channel

---

## 2. 🟢 emailService.js

### Fungsi Utama
**Fallback Delivery Channel** - Digunakan jika WhatsApp tidak tersedia atau gagal.

### Tanggung Jawab
- ✅ Kirim email via Nodemailer (Gmail)
- ✅ Format HTML email
- ✅ Return success/error status

### Fungsi Utama
```javascript
sendEmail(to, subject, html)          // Generic send email
sendResetPasswordLink(user, resetLink) // Send reset password link
```

### Kapan Digunakan
- Fallback jika WhatsApp gagal
- User tidak punya nomor telepon
- Komunikasi formal via email

### Karakteristik
- ✅ **Fallback Channel**: Backup untuk WhatsApp
- ✅ **No Business Logic**: Hanya kirim email
- ✅ **HTML Support**: Bisa kirim email dengan format HTML
- ✅ **Reusable**: Bisa digunakan di mana saja

---

## 3. 🟢 passwordService.js

### Fungsi Utama
**Core Password Management** - Single source of truth untuk semua operasi password.

### Tanggung Jawab
- ✅ Hash password dengan bcrypt
- ✅ Verify password dengan bcrypt
- ✅ Update password di database
- ✅ Validate current password

### Fungsi Utama
```javascript
hashPassword(plainPassword)                    // Hash password
verifyPassword(plainPassword, hashedPassword)  // Verify password
updatePassword(userId, newPassword, clearResetToken) // Update password
validateCurrentPassword(userId, currentPassword)     // Validate current password
getUserWithPassword(userId)                    // Get user with password
```

### Kapan Digunakan
- **Change Password**: User mengubah password sendiri
- **Reset Password**: User reset password via link
- **Set Password**: Teacher set password pertama kali
- Semua operasi yang berhubungan dengan password

### Karakteristik
- ✅ **Single Source of Truth**: Semua operasi password lewat sini
- ✅ **Security**: Menggunakan bcrypt untuk hashing
- ✅ **Centralized**: Tidak ada duplikasi logic password
- ✅ **Reusable**: Digunakan oleh semua flow password

---

## 4. 🟢 resetPasswordService.js

### Fungsi Utama
**Reset Password Token & Link Generation** - Single source of truth untuk token management.

### Tanggung Jawab
- ✅ Generate secure random token
- ✅ Hash token dengan SHA256
- ✅ Generate reset password link
- ✅ Verify token validity
- ✅ Clear token after use

### Fungsi Utama
```javascript
createResetToken(userId, expiryMinutes)  // Create reset token
verifyResetToken(plainToken)             // Verify token validity
clearResetToken(userId)                  // Clear token after use
getUserByEmail(email)                    // Get user by email
getUserById(userId)                      // Get user by ID
```

### Kapan Digunakan
- **Forgot Password**: User lupa password
- **Set Password Pertama Kali**: Teacher baru dibuat
- **Resend Link**: Admin kirim ulang link

### Karakteristik
- ✅ **Token Management**: Generate, verify, clear token
- ✅ **Security**: Token di-hash sebelum disimpan di database
- ✅ **Expiry**: Token punya waktu expired (default 60 menit)
- ✅ **Centralized**: Semua operasi token lewat sini

---

## 5. ⚠️ teacherSetPasswordService.js (DEPRECATED)

### Status
**DEPRECATED** - Service ini sudah tidak digunakan lagi.

### Alasan Deprecated
- ❌ **Duplikasi Logic**: Logic token sudah ada di `resetPasswordService.js`
- ❌ **Duplikasi WhatsApp**: Logic WhatsApp sudah ada di `whatsappService.js`
- ❌ **Not Reusable**: Hanya untuk teacher, tidak bisa digunakan untuk user lain
- ❌ **Hardcoded**: Banyak hardcoded values

### Pengganti
Gunakan kombinasi:
```javascript
// 1. Generate token
const { resetLink } = await resetPasswordService.createResetToken(userId, 60);

// 2. Send via WhatsApp
await whatsappService.sendResetPasswordLink(user, resetLink);

// 3. Fallback to Email
await emailService.sendResetPasswordLink(user, resetLink);
```

### Rekomendasi
🗑️ **Hapus file ini** setelah memastikan tidak ada yang menggunakannya.

---

## 6. 🟢 notificationService.js

### Fungsi Utama
**Scheduled Notifications** - Kirim notifikasi otomatis via cron job.

### Tanggung Jawab
- ✅ Deteksi jadwal yang baru selesai
- ✅ Ambil data absensi, tugas, pengumuman
- ✅ Generate pesan notifikasi
- ✅ Kirim ke wali murid dan siswa
- ✅ Track notifikasi yang sudah dikirim

### Fungsi Utama
```javascript
scheduleNotifications()  // Main function (dipanggil oleh cron job)
```

### Kapan Digunakan
- **Cron Job**: Berjalan otomatis setiap 5 menit
- **Automatic**: Tidak dipanggil manual
- **Background**: Berjalan di background

### Karakteristik
- ✅ **Automated**: Berjalan otomatis via cron
- ✅ **Smart Detection**: Deteksi jadwal yang baru selesai
- ✅ **Comprehensive**: Include absensi, tugas, pengumuman
- ✅ **Avoid Duplicate**: Track notifikasi yang sudah dikirim

### Perbedaan dengan Session End Report
| Feature | notificationService | Session End Report |
|---------|--------------------|--------------------|
| Trigger | Cron job (otomatis) | Manual (guru klik button) |
| Timing | 5 menit setelah jam selesai | Saat guru klik button |
| Content | Absensi + Tugas + Pengumuman | Absensi + Tugas + Pengumuman |
| Target | Semua siswa di kelas | Semua siswa di kelas |
| Control | Automatic | Manual |

---

## 🏗️ Arsitektur Flow

### Flow 1: Teacher Set Password (Pertama Kali)
```
userController.createUser()
    ↓
resetPasswordService.createResetToken()
    ↓
whatsappService.sendResetPasswordLink()
    ↓ (fallback)
emailService.sendResetPasswordLink()
```

### Flow 2: Forgot Password
```
authController.forgotPassword()
    ↓
resetPasswordService.getUserByEmail()
    ↓
resetPasswordService.createResetToken()
    ↓
whatsappService.sendResetPasswordLink()
    ↓ (fallback)
emailService.sendResetPasswordLink()
```

### Flow 3: Reset Password (via Link)
```
authController.resetPassword()
    ↓
resetPasswordService.verifyResetToken()
    ↓
passwordService.updatePassword(userId, newPassword, clearResetToken=true)
```

### Flow 4: Change Password (User Login)
```
profileController.changePassword()
    ↓
passwordService.validateCurrentPassword()
    ↓
passwordService.updatePassword(userId, newPassword, clearResetToken=false)
```

### Flow 5: Session End Report (Manual)
```
Teacher klik "Kirim Laporan"
    ↓
attendanceController.sendReportToParents()
    ↓
attendanceService.sendReportToParents()
    ↓
whatsappService.sendMessage() (untuk setiap wali murid)
```

### Flow 6: Scheduled Notification (Automatic)
```
Cron Job (setiap 5 menit)
    ↓
notificationService.scheduleNotifications()
    ↓
Deteksi jadwal yang baru selesai
    ↓
Ambil data absensi, tugas, pengumuman
    ↓
whatsappService.sendMessage() (untuk setiap wali murid)
```

---

## 📊 Comparison Table

| Service | Type | Responsibility | Reusable | Status |
|---------|------|----------------|----------|--------|
| whatsappService | Delivery | Send WhatsApp | ✅ Yes | ✅ Active |
| emailService | Delivery | Send Email | ✅ Yes | ✅ Active |
| passwordService | Core | Password Management | ✅ Yes | ✅ Active |
| resetPasswordService | Core | Token Management | ✅ Yes | ✅ Active |
| teacherSetPasswordService | Legacy | Teacher Setup | ❌ No | ⚠️ Deprecated |
| notificationService | Automation | Scheduled Notifications | ❌ No | ✅ Active |

---

## 🎯 Best Practices

### 1. Separation of Concerns
- **Delivery Services** (WhatsApp, Email): Hanya kirim pesan
- **Core Services** (Password, ResetPassword): Business logic
- **Automation Services** (Notification): Background jobs

### 2. Single Responsibility
Setiap service punya tanggung jawab yang jelas dan tidak overlap.

### 3. Reusability
Service yang reusable (WhatsApp, Email, Password, ResetPassword) bisa digunakan di mana saja.

### 4. No Duplication
Tidak ada duplikasi logic. Semua logic terpusat di satu tempat.

### 5. Clean Architecture
```
Controller → Service (Business Logic) → Delivery Service (WhatsApp/Email)
```

---

## 🔄 Migration Plan (Hapus teacherSetPasswordService)

### Step 1: Cari Penggunaan
```bash
grep -r "teacherSetPasswordService" be/src/
```

### Step 2: Replace dengan Service Baru
```javascript
// OLD (teacherSetPasswordService)
await teacherSetPasswordService.sendTeacherSetPasswordWA(teacherId);

// NEW (resetPasswordService + whatsappService)
const user = await resetPasswordService.getUserById(teacherId);
const { resetLink } = await resetPasswordService.createResetToken(teacherId, 60);
await whatsappService.sendResetPasswordLink(user, resetLink);
```

### Step 3: Hapus File
```bash
rm be/src/services/teacherSetPasswordService.js
```

---

## 📝 Summary

- **whatsappService**: Kirim WhatsApp (delivery channel)
- **emailService**: Kirim Email (fallback channel)
- **passwordService**: Manage password (hash, verify, update)
- **resetPasswordService**: Manage token (generate, verify, clear)
- **teacherSetPasswordService**: ⚠️ DEPRECATED (hapus)
- **notificationService**: Kirim notifikasi otomatis (cron job)

Semua service sudah terstruktur dengan baik mengikuti prinsip **Single Responsibility** dan **Separation of Concerns**.
