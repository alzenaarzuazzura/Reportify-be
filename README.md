# Reportify Backend

Backend sistem absensi dan pelacakan tugas untuk sekolah.

## Fitur

- Autentikasi (Login/Logout) dengan JWT
- Manajemen User (Admin & Guru)
- Manajemen Siswa
- Manajemen Kelas (Level, Major, Rombel)
- Manajemen Mata Pelajaran
- Manajemen Penugasan Guru (Teaching Assignment)
- Manajemen Jadwal
- Absensi Siswa
- Manajemen Tugas (Assignments)
- Pengumuman (Announcements)
- Notifikasi otomatis ke orangtua/siswa setelah jam pelajaran selesai
- **Search, Filter, Sort, dan Pagination** (Production-ready)

## Fitur Advanced

### Search, Filter, Sort & Pagination
- ✅ **Search**: Partial match, case-insensitive
- ✅ **Filter**: Multiple fields, date range, exact match
- ✅ **Sort**: Ascending/Descending
- ✅ **Pagination**: Page-based dengan metadata
- ✅ **Security**: Aman dari SQL Injection (Prisma ORM)
- ✅ **Performance**: Optimized queries, max limit 100 items
- ✅ **Clean Architecture**: Service Layer Pattern

**Contoh Penggunaan:**
```bash
GET /api/students?search=john&id_class=1&sortBy=name&order=asc&page=1&limit=20
GET /api/attendances?id_student=1&status=hadir&date_from=2024-01-01&date_to=2024-01-31
```

**Dokumentasi Lengkap:**
- [Search, Filter, Sort & Pagination Guide](SEARCH_FILTER_SORT_PAGINATION.md)
- [API Examples](EXAMPLES.md)
- [Implementation Guide](IMPLEMENTATION_GUIDE.md)

## Tech Stack

- Express.js
- MySQL
- Prisma ORM
- JWT Authentication
- Bcrypt
- Node-cron (untuk notifikasi otomatis)

## Struktur Folder

```
src/
├── controllers/        # HTTP request handlers
│   ├── authController.js
│   ├── studentController.js
│   ├── attendanceController.js
│   └── ...
├── services/          # Business logic layer
│   ├── studentService.js
│   ├── attendanceService.js
│   └── ...
├── routes/            # API routes
│   ├── authRoutes.js
│   ├── studentRoutes.js
│   └── ...
├── middleware/        # Custom middleware
│   └── authMiddleware.js
├── utils/             # Utility functions
│   ├── queryBuilder.js    # Query builder untuk search/filter/sort
│   └── validator.js       # Input validation
├── services/          # External services
│   └── notificationService.js
└── index.js           # App entry point
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy file .env.example menjadi .env dan sesuaikan konfigurasi:
```bash
cp .env.example .env
```

3. Konfigurasi database di file .env:
```
DATABASE_URL="mysql://user:password@localhost:3306/reportify"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Jalankan migrasi database:
```bash
npm run prisma:migrate
```

6. Jalankan server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST /reportify/auth/login - Login
- POST /reportify/auth/logout - Logout

### Users (Admin only)
- GET /reportify/users
- GET /reportify/users/:id
- POST /reportify/users
- PUT /reportify/users/:id
- DELETE /reportify/users/:id

### Students (Admin only)
- GET /reportify/students
- GET /reportify/students/:id
- POST /reportify/students
- PUT /reportify/students/:id
- DELETE /reportify/students/:id

### Classes (Admin only)
- GET /reportify/classes
- GET /reportify/classes/:id
- POST /reportify/classes
- PUT /reportify/classes/:id
- DELETE /reportify/classes/:id

### Levels (Admin only)
- GET /reportify/levels
- GET /reportify/levels/:id
- POST /reportify/levels
- PUT /reportify/levels/:id
- DELETE /reportify/levels/:id

### Majors (Admin only)
- GET /reportify/majors
- GET /reportify/majors/:id
- POST /reportify/majors
- PUT /reportify/majors/:id
- DELETE /reportify/majors/:id

### Rombels (Admin only)
- GET /reportify/rombels
- GET /reportify/rombels/:id
- POST /reportify/rombels
- PUT /reportify/rombels/:id
- DELETE /reportify/rombels/:id

### Subjects (Admin only)
- GET /reportify/subjects
- GET /reportify/subjects/:id
- POST /reportify/subjects
- PUT /reportify/subjects/:id
- DELETE /reportify/subjects/:id

### Teaching Assignments (Admin only)
- GET /reportify/teaching-assignments
- GET /reportify/teaching-assignments/:id
- POST /reportify/teaching-assignments
- PUT /reportify/teaching-assignments/:id
- DELETE /reportify/teaching-assignments/:id

### Schedules (Admin only)
- GET /reportify/schedules
- GET /reportify/schedules/:id
- POST /reportify/schedules
- PUT /reportify/schedules/:id
- DELETE /reportify/schedules/:id

### Attendances (Teacher & Admin)
- GET /reportify/attendances
- GET /reportify/attendances/:id
- POST /reportify/attendances
- POST /reportify/attendances/bulk
- PUT /reportify/attendances/:id
- DELETE /reportify/attendances/:id

### Assignments (Teacher & Admin)
- GET /reportify/assignments
- GET /reportify/assignments/:id
- POST /reportify/assignments
- PUT /reportify/assignments/:id
- DELETE /reportify/assignments/:id
- PUT /reportify/assignments/student-assignments/:id

### Announcements (Teacher & Admin)
- GET /reportify/announcements
- GET /reportify/announcements/:id
- POST /reportify/announcements
- PUT /reportify/announcements/:id
- DELETE /reportify/announcements/:id
