# Password Management Architecture

## Overview
Arsitektur password management yang reusable dan tidak duplikat, mengikuti prinsip DRY (Don't Repeat Yourself) dan Single Responsibility Principle.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PASSWORD FLOWS                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Reset Password  │         │ Change Password  │          │
│  │   (with token)   │         │   (with JWT)     │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                             │                    │
│           ├─────────────┬───────────────┤                    │
│           │             │               │                    │
│           ▼             ▼               ▼                    │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Verify   │  │   Validate   │  │   Validate   │        │
│  │   Token    │  │     JWT      │  │   Current    │        │
│  │            │  │              │  │   Password   │        │
│  └────────────┘  └──────────────┘  └──────┬───────┘        │
│                                             │                │
│                  ┌──────────────────────────┘                │
│                  │                                           │
│                  ▼                                           │
│         ┌─────────────────┐                                 │
│         │ passwordService │  ◄── SINGLE SOURCE OF TRUTH     │
│         │  updatePassword │                                 │
│         └─────────────────┘                                 │
│                  │                                           │
│                  ▼                                           │
│         ┌─────────────────┐                                 │
│         │   Hash Password │                                 │
│         │   Update DB     │                                 │
│         │   Clear Token?  │                                 │
│         └─────────────────┘                                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Service Layer

### passwordService.js
**Location:** `be/src/services/passwordService.js`

**Responsibilities:**
- Hash password dengan bcrypt
- Verify password
- **Update password (CORE FUNCTION)** - Single source of truth
- Validate current password
- Get user with password

**Key Functions:**

```javascript
// CORE FUNCTION - Single source of truth untuk update password
updatePassword(userId, newPassword, clearResetToken)
  - Hash password baru
  - Update ke database
  - Clear reset token jika diminta (untuk reset password flow)
  - Validasi minimal 8 karakter

// Supporting functions
hashPassword(plainPassword)
verifyPassword(plainPassword, hashedPassword)
validateCurrentPassword(userId, currentPassword)
getUserWithPassword(userId)
```

## Controller Layer

### authController.js
**Location:** `be/src/controllers/authController.js`

**Functions:**

#### 1. resetPassword (POST /auth/reset-password)
```javascript
Flow:
1. Verify reset token (resetPasswordService)
2. Update password (passwordService.updatePassword with clearResetToken=true)
3. Return success
```

#### 2. changePassword (POST /auth/change-password)
```javascript
Flow:
1. Get userId from JWT (req.user.id)
2. Validate current password (passwordService.validateCurrentPassword)
3. Update password (passwordService.updatePassword with clearResetToken=false)
4. Return success
```

## Key Differences

| Aspect | Reset Password | Change Password |
|--------|---------------|-----------------|
| **Authentication** | Reset Token | JWT Token |
| **Verification** | Token validity & expiry | Current password |
| **Clear Token** | Yes (clearResetToken=true) | No (clearResetToken=false) |
| **Route** | /auth/reset-password | /auth/change-password |
| **Middleware** | None (public) | authenticate (protected) |

## Security Features

### 1. Password Hashing
- Menggunakan bcrypt dengan salt rounds 10
- Hash dilakukan di service layer (single point)

### 2. Token Management
- Reset token di-hash dengan SHA256 sebelum disimpan
- Token expired otomatis dicek saat verify
- Token dihapus setelah reset password berhasil

### 3. Validation
- Password minimal 8 karakter
- Current password harus valid untuk change password
- Confirm password harus match (frontend)

### 4. Error Handling
- Tidak bocorkan informasi sensitif
- Generic error message untuk security
- Detailed logging untuk debugging

## Database Schema

```sql
users {
  id: INT PRIMARY KEY
  email: VARCHAR(100) UNIQUE
  password: VARCHAR(255)  -- bcrypt hashed
  reset_token: VARCHAR(255) NULL  -- SHA256 hashed
  reset_token_expired: DATETIME NULL
  ...
}
```

## API Endpoints

### 1. Reset Password
```
POST /auth/reset-password
Body: { token, password }
Response: { status, message }
```

### 2. Change Password
```
POST /auth/change-password
Headers: { Authorization: Bearer <JWT> }
Body: { currentPassword, newPassword }
Response: { status, message }
```

## Frontend Integration

### Hook: useChangePassword
**Location:** `fe/src/hooks/auth/useChangePassword.ts`

```typescript
const { changePassword, isLoading } = useChangePassword();

changePassword({ currentPassword, newPassword });
```

### Component: ChangePassword
**Location:** `fe/src/pages/admin/profile/ChangePassword.tsx`

**Features:**
- Form validation (Ant Design)
- Password confirmation
- Loading state
- Success/error messages
- Security tips

## Best Practices Applied

1. **DRY (Don't Repeat Yourself)**
   - Password update logic hanya ada di satu tempat
   - Hash function reusable

2. **Single Responsibility**
   - Service: Business logic
   - Controller: Request handling
   - Middleware: Authentication

3. **Security First**
   - Password selalu di-hash
   - Token management yang aman
   - Validation di semua layer

4. **Scalability**
   - Easy to add new password-related features
   - Service layer dapat digunakan untuk fitur lain

## Testing Checklist

- [ ] Reset password dengan token valid
- [ ] Reset password dengan token expired
- [ ] Reset password dengan token invalid
- [ ] Change password dengan current password benar
- [ ] Change password dengan current password salah
- [ ] Change password tanpa authentication
- [ ] Password minimal 8 karakter
- [ ] Token dihapus setelah reset
- [ ] Token tidak dihapus setelah change

## Future Enhancements

1. Password strength meter
2. Password history (prevent reuse)
3. Force password change after X days
4. Two-factor authentication
5. Password complexity rules
6. Account lockout after failed attempts
