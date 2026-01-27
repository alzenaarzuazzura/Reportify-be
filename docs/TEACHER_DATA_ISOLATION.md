# Teacher Data Isolation - Filter by User

## 📋 Overview

Setiap guru hanya dapat melihat dan mengelola data yang terkait dengan jadwal mengajar mereka sendiri. Data yang diisolasi meliputi:
- ✅ Absensi (Attendances)
- ✅ Tugas (Assignments)
- ✅ Pengumuman (Announcements)

## 🔒 Prinsip Isolasi Data

### Konsep Dasar
```
User (Guru) 
    ↓
Teaching Assignments (Kelas yang diajar)
    ↓
Schedules (Jadwal mengajar)
    ↓
Attendances / Assignments / Announcements
```

### Filter Hierarchy
1. **id_user** → Filter berdasarkan guru yang login
2. **id_teaching_assignment** → Filter berdasarkan kelas yang diajar
3. **id_schedule** → Filter berdasarkan jadwal spesifik (hari + jam)

## 🛠️ Implementasi Backend

### 1. Attendance Controller

**File**: `be/src/controllers/attendanceController.js`

**Perubahan**:
```javascript
const getAllAttendances = async (req, res) => {
  // Get logged in user
  const userId = req.user.id;
  const userRole = req.user.role;

  // For teachers, add filter by their teaching assignments
  if (userRole === 'teacher') {
    queryParams.filters.id_user = userId;
  }
  
  const result = await AttendanceService.getAttendances(queryParams);
  res.json(result);
};
```

**Hasil**: Guru hanya melihat absensi dari kelas yang mereka ajar.

---

### 2. Attendance Service

**File**: `be/src/services/attendanceService.js`

**Perubahan**:
```javascript
static async getAttendances(queryParams) {
  const where = {};

  // Filter by user (teacher)
  if (filters.id_user) {
    where.teaching_assignment = {
      id_user: parseInt(filters.id_user)
    };
  }

  // Execute query with where clause
  const attendances = await prisma.attendances.findMany({
    where,
    include: { teaching_assignment, student, schedule }
  });
}
```

**Hasil**: Query database hanya mengambil data absensi yang terkait dengan `teaching_assignment` guru tersebut.

---

### 3. Assignment Controller

**File**: `be/src/controllers/assignmentController.js`

**Perubahan**:
```javascript
const getAllAssignments = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  const where = {};

  // For teachers, filter by their teaching assignments
  if (userRole === 'teacher') {
    where.teaching_assignment = {
      id_user: userId
    };
  }

  const assignments = await prisma.assignments.findMany({
    where,
    include: { teaching_assignment, student_assignments }
  });
  
  res.json(assignments);
};
```

**Hasil**: Guru hanya melihat tugas yang mereka buat untuk kelas mereka.

---

### 4. Announcement Controller

**File**: `be/src/controllers/announcementController.js`

**Status**: ✅ Sudah diimplementasikan sebelumnya

**Implementasi**:
```javascript
const getMyAnnouncements = async (req, res) => {
  const userId = req.user.id;

  const announcements = await prisma.announcements.findMany({
    where: {
      teaching_assignment: {
        id_user: userId
      }
    }
  });
  
  res.json(announcements);
};
```

**Hasil**: Guru hanya melihat pengumuman yang mereka buat.

---

## 📊 Data Flow

### Scenario: Guru Login dan Melihat Absensi

```
1. Guru login → JWT token berisi { id: 5, role: 'teacher' }
   ↓
2. Frontend request: GET /attendances
   ↓
3. Backend extract: userId = 5, userRole = 'teacher'
   ↓
4. Backend add filter: queryParams.filters.id_user = 5
   ↓
5. Service build where: 
   where.teaching_assignment = { id_user: 5 }
   ↓
6. Prisma query:
   SELECT * FROM attendances
   WHERE teaching_assignment.id_user = 5
   ↓
7. Return: Hanya absensi dari kelas yang diajar guru ID 5
```

---

## 🔍 Contoh Query Database

### Sebelum (Tanpa Filter)
```sql
SELECT * FROM attendances
INNER JOIN teaching_assignments ON ...
-- Mengembalikan SEMUA absensi dari SEMUA guru
```

### Sesudah (Dengan Filter)
```sql
SELECT * FROM attendances
INNER JOIN teaching_assignments ON ...
WHERE teaching_assignments.id_user = 5
-- Hanya absensi dari guru ID 5
```

---

## 🎯 Benefit

### 1. Data Privacy
- ✅ Guru A tidak bisa melihat data Guru B
- ✅ Setiap guru hanya melihat data mereka sendiri

### 2. Data Accuracy
- ✅ Tidak ada data tercampur antar guru
- ✅ Absensi, tugas, pengumuman sesuai dengan jadwal masing-masing

### 3. Security
- ✅ Filter dilakukan di backend (tidak bisa di-bypass)
- ✅ Menggunakan JWT token untuk identifikasi user

### 4. Performance
- ✅ Query lebih cepat karena data lebih sedikit
- ✅ Tidak perlu load semua data lalu filter di frontend

---

## 📝 Testing Checklist

### Test Case 1: Guru A Login
- [ ] Guru A hanya melihat absensi dari kelas yang dia ajar
- [ ] Guru A tidak melihat absensi dari kelas Guru B
- [ ] Guru A hanya melihat tugas yang dia buat
- [ ] Guru A hanya melihat pengumuman yang dia buat

### Test Case 2: Guru B Login
- [ ] Guru B hanya melihat absensi dari kelas yang dia ajar
- [ ] Guru B tidak melihat absensi dari kelas Guru A
- [ ] Guru B hanya melihat tugas yang dia buat
- [ ] Guru B hanya melihat pengumuman yang dia buat

### Test Case 3: Admin Login
- [ ] Admin melihat SEMUA absensi dari SEMUA guru
- [ ] Admin melihat SEMUA tugas dari SEMUA guru
- [ ] Admin melihat SEMUA pengumuman dari SEMUA guru

---

## 🔧 Troubleshooting

### Problem: Guru melihat data guru lain
**Solution**: 
1. Cek apakah `req.user.id` terisi dengan benar
2. Cek apakah filter `id_user` diterapkan di controller
3. Cek apakah where clause di service sudah benar

### Problem: Guru tidak melihat data apapun
**Solution**:
1. Cek apakah guru punya `teaching_assignments`
2. Cek apakah `id_user` di `teaching_assignments` sesuai
3. Cek apakah data absensi/tugas terkait dengan `teaching_assignment` yang benar

### Problem: Data masih tercampur
**Solution**:
1. Clear cache di frontend
2. Logout dan login ulang
3. Cek JWT token apakah berisi user yang benar

---

## 📚 Related Files

### Backend
- `be/src/controllers/attendanceController.js`
- `be/src/services/attendanceService.js`
- `be/src/controllers/assignmentController.js`
- `be/src/controllers/announcementController.js`

### Frontend
- `fe/src/pages/teacher/attendance/List.tsx`
- `fe/src/pages/teacher/tasks/List.tsx`
- `fe/src/pages/teacher/announcements/List.tsx`

---

## 🎓 Summary

**Sebelum**:
- ❌ Semua guru melihat data semua guru
- ❌ Data tercampur dan tidak akurat
- ❌ Privacy issue

**Sesudah**:
- ✅ Setiap guru hanya melihat data mereka sendiri
- ✅ Data akurat sesuai jadwal masing-masing
- ✅ Privacy terjaga
- ✅ Filter otomatis berdasarkan `id_user` dari JWT token

**Filter Hierarchy**:
```
id_user (Guru) 
  → teaching_assignments (Kelas yang diajar)
    → schedules (Jadwal: hari + jam)
      → attendances / assignments / announcements
```

Setiap guru sekarang memiliki **workspace pribadi** yang hanya berisi data dari jadwal mengajar mereka sendiri! 🎉
