# API Response Format

Semua endpoint API menggunakan format response yang konsisten dengan Generic Type.

## Response Structure

```javascript
interface ApiResponse<T> {
  status: boolean;    // true untuk sukses, false untuk error
  message: string;    // Pesan yang user-friendly
  data: T | null;     // Data hasil query (null jika error)
}
```

---

## Success Response Examples

### 1. Create User (POST /api/users)

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher"
}
```

**Response (201 Created):**
```json
{
  "status": true,
  "message": "User berhasil dibuat",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get User by ID (GET /api/users/:id)

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Berhasil mengambil data user",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Update User (PUT /api/users/:id)

**Request:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com"
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "User berhasil diupdate",
  "data": {
    "id": 1,
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "role": "teacher",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Delete User (DELETE /api/users/:id)

**Response (200 OK):**
```json
{
  "status": true,
  "message": "User berhasil dihapus",
  "data": {
    "id": 1
  }
}
```

---

### 5. Get All Users (GET /api/users)

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Berhasil mengambil data users",
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "teacher",
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin",
      "created_at": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

### 6. Login (POST /api/auth/login)

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "teacher"
    }
  }
}
```

---

### 7. Logout (POST /api/auth/logout)

**Response (200 OK):**
```json
{
  "status": true,
  "message": "Logout berhasil",
  "data": null
}
```

---

## Error Response Examples

### 1. Validation Error (400 Bad Request)

**Scenario:** Field wajib tidak diisi

```json
{
  "status": false,
  "message": "Semua field wajib diisi",
  "data": null
}
```

**Scenario:** Email sudah terdaftar

```json
{
  "status": false,
  "message": "Email sudah terdaftar",
  "data": null
}
```

---

### 2. Authentication Error (401 Unauthorized)

**Scenario:** Login gagal

```json
{
  "status": false,
  "message": "Email atau password salah",
  "data": null
}
```

**Scenario:** Token tidak valid

```json
{
  "status": false,
  "message": "Token tidak valid",
  "data": null
}
```

---

### 3. Authorization Error (403 Forbidden)

**Scenario:** User tidak memiliki akses

```json
{
  "status": false,
  "message": "Akses ditolak. Hanya admin yang diizinkan",
  "data": null
}
```

---

### 4. Not Found Error (404 Not Found)

**Scenario:** Resource tidak ditemukan

```json
{
  "status": false,
  "message": "User tidak ditemukan",
  "data": null
}
```

---

### 5. Server Error (500 Internal Server Error)

**Scenario:** Error pada server

```json
{
  "status": false,
  "message": "Gagal mengambil data user",
  "data": null
}
```

**Note:** Detail error akan di-log di console server, tidak dikirim ke client untuk keamanan.

---

## Implementation Example

### Controller Implementation

```javascript
const { successResponse, errorResponse } = require('../types/apiResponse');

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validasi input
    if (!name || !email || !password || !role) {
      return res.status(400).json(
        errorResponse('Semua field wajib diisi')
      );
    }

    // Cek email sudah ada
    const existingUser = await prisma.users.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json(
        errorResponse('Email sudah terdaftar')
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true
      }
    });

    return res.status(201).json(
      successResponse('User berhasil dibuat', user)
    );
  } catch (error) {
    console.error('Error createUser:', error);
    return res.status(500).json(
      errorResponse('Gagal membuat user')
    );
  }
};
```

---

## Benefits

1. **Konsisten**: Semua endpoint menggunakan format yang sama
2. **Type-Safe**: Menggunakan Generic Type untuk data response
3. **User-Friendly**: Pesan error yang mudah dipahami
4. **Secure**: Detail error tidak dikirim ke client
5. **Easy to Parse**: Frontend mudah handle response dengan checking `status` field

---

## Frontend Usage Example

```javascript
// Fetch API
const response = await fetch('/api/users/1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const result = await response.json();

if (result.status) {
  // Success
  console.log('User data:', result.data);
  console.log('Message:', result.message);
} else {
  // Error
  console.error('Error:', result.message);
  // result.data akan null
}
```

```javascript
// Axios
try {
  const response = await axios.get('/api/users/1', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.data.status) {
    console.log('User data:', response.data.data);
  }
} catch (error) {
  if (error.response) {
    console.error('Error:', error.response.data.message);
  }
}
```
