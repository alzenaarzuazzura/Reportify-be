# Reportify API Endpoints

## Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/reportify/auth/login` | Login user | Public |
| POST | `/reportify/auth/logout` | Logout user | Authenticated |

**Login Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

---

## Users Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/users` | Get all users | Admin |
| GET | `/reportify/users/:id` | Get user by ID | Admin |
| POST | `/reportify/users` | Create new user | Admin |
| PUT | `/reportify/users/:id` | Update user | Admin |
| DELETE | `/reportify/users/:id` | Delete user | Admin |
| POST | `/reportify/users/:id/send-password-setup` | Send password setup link to teacher | Admin |

**Create/Update User Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "password": "password123",
  "role": "teacher"
}
```

**Note:** 
- When creating a teacher (role: "teacher"), the system will automatically send a WhatsApp message with a password setup link to the provided phone number.
- The password setup link is valid for 1 hour.
- Use the `/send-password-setup` endpoint to resend the link if needed.

---

## Students Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/students` | Get all students | Admin |
| GET | `/reportify/students/:id` | Get student by ID | Admin |
| POST | `/reportify/students` | Create new student | Admin |
| PUT | `/reportify/students/:id` | Update student | Admin |
| DELETE | `/reportify/students/:id` | Delete student | Admin |

**Create/Update Student Request Body:**
```json
{
  "id_class": 1,
  "nis": "12345",
  "name": "Jane Doe",
  "parent_telephone": "081234567890",
  "student_telephone": "081234567891"
}
```

---

## Classes Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/classes` | Get all classes | Admin |
| GET | `/reportify/classes/:id` | Get class by ID | Admin |
| POST | `/reportify/classes` | Create new class | Admin |
| PUT | `/reportify/classes/:id` | Update class | Admin |
| DELETE | `/reportify/classes/:id` | Delete class | Admin |

**Create/Update Class Request Body:**
```json
{
  "id_level": 1,
  "id_major": 1,
  "id_rombel": 1
}
```

---

## Levels Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/levels` | Get all levels | Admin |
| GET | `/reportify/levels/:id` | Get level by ID | Admin |
| POST | `/reportify/levels` | Create new level | Admin |
| PUT | `/reportify/levels/:id` | Update level | Admin |
| DELETE | `/reportify/levels/:id` | Delete level | Admin |

**Create/Update Level Request Body:**
```json
{
  "name": "X"
}
```

---

## Majors Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/majors` | Get all majors | Admin |
| GET | `/reportify/majors/:id` | Get major by ID | Admin |
| POST | `/reportify/majors` | Create new major | Admin |
| PUT | `/reportify/majors/:id` | Update major | Admin |
| DELETE | `/reportify/majors/:id` | Delete major | Admin |

**Create/Update Major Request Body:**
```json
{
  "name": "Rekayasa Perangkat Lunak",
  "code": "RPL"
}
```

---

## Rombels Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/rombels` | Get all rombels | Admin |
| GET | `/reportify/rombels/:id` | Get rombel by ID | Admin |
| POST | `/reportify/rombels` | Create new rombel | Admin |
| PUT | `/reportify/rombels/:id` | Update rombel | Admin |
| DELETE | `/reportify/rombels/:id` | Delete rombel | Admin |

**Create/Update Rombel Request Body:**
```json
{
  "name": "1"
}
```

---

## Subjects Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/subjects` | Get all subjects | Admin |
| GET | `/reportify/subjects/:id` | Get subject by ID | Admin |
| POST | `/reportify/subjects` | Create new subject | Admin |
| PUT | `/reportify/subjects/:id` | Update subject | Admin |
| DELETE | `/reportify/subjects/:id` | Delete subject | Admin |

**Create/Update Subject Request Body:**
```json
{
  "name": "Matematika",
  "code": "MTK"
}
```

---

## Teaching Assignments Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/teaching-assignments` | Get all teaching assignments | Admin |
| GET | `/reportify/teaching-assignments/:id` | Get teaching assignment by ID | Admin |
| POST | `/reportify/teaching-assignments` | Create new teaching assignment | Admin |
| PUT | `/reportify/teaching-assignments/:id` | Update teaching assignment | Admin |
| DELETE | `/reportify/teaching-assignments/:id` | Delete teaching assignment | Admin |

**Create/Update Teaching Assignment Request Body:**
```json
{
  "id_user": 1,
  "id_class": 1,
  "id_subject": 1
}
```

---

## Schedules Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/schedules` | Get all schedules | Admin |
| GET | `/reportify/schedules/:id` | Get schedule by ID | Admin |
| POST | `/reportify/schedules` | Create new schedule | Admin |
| PUT | `/reportify/schedules/:id` | Update schedule | Admin |
| DELETE | `/reportify/schedules/:id` | Delete schedule | Admin |

**Create/Update Schedule Request Body:**
```json
{
  "id_teaching_assignment": 1,
  "day": "senin",
  "start_time": "08:00",
  "end_time": "09:30",
  "room": "Lab Komputer 1"
}
```

**Day Options:** `senin`, `selasa`, `rabu`, `kamis`, `jumat`

---

## Attendances Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/attendances` | Get all attendances | Teacher/Admin |
| GET | `/reportify/attendances/:id` | Get attendance by ID | Teacher/Admin |
| POST | `/reportify/attendances` | Create new attendance | Teacher/Admin |
| POST | `/reportify/attendances/bulk` | Create bulk attendances | Teacher/Admin |
| PUT | `/reportify/attendances/:id` | Update attendance | Teacher/Admin |
| DELETE | `/reportify/attendances/:id` | Delete attendance | Teacher/Admin |

**Create/Update Attendance Request Body:**
```json
{
  "id_student": 1,
  "id_teaching_assignment": 1,
  "id_schedule": 1,
  "date": "2024-01-15",
  "status": "hadir",
  "note": "Tepat waktu"
}
```

**Bulk Attendance Request Body:**
```json
{
  "attendances": [
    {
      "id_student": 1,
      "id_teaching_assignment": 1,
      "id_schedule": 1,
      "date": "2024-01-15",
      "status": "hadir",
      "note": ""
    },
    {
      "id_student": 2,
      "id_teaching_assignment": 1,
      "id_schedule": 1,
      "date": "2024-01-15",
      "status": "izin",
      "note": "Sakit"
    }
  ]
}
```

**Status Options:** `hadir`, `izin`, `alfa`

---

## Assignments Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/assignments` | Get all assignments | Teacher/Admin |
| GET | `/reportify/assignments/:id` | Get assignment by ID | Teacher/Admin |
| GET | `/reportify/assignments/:id/completion-status` | Get student completion status (sudah/belum mengerjakan) | Teacher/Admin |
| GET | `/reportify/assignments/:id/missing-students` | Get students without student_assignments (belum di-generate) | Teacher/Admin |
| POST | `/reportify/assignments` | Create new assignment | Teacher/Admin |
| POST | `/reportify/assignments/:id/generate-students` | Generate student_assignments for existing assignment | Teacher/Admin |
| PUT | `/reportify/assignments/:id` | Update assignment | Teacher/Admin |
| DELETE | `/reportify/assignments/:id` | Delete assignment | Teacher/Admin |
| PUT | `/reportify/assignments/student-assignments/:id` | Update student assignment status | Teacher/Admin |

**Create/Update Assignment Request Body:**
```json
{
  "id_teaching_assignment": 1,
  "assignment_title": "Tugas Matematika Bab 1",
  "assignment_desc": "Kerjakan soal halaman 10-15",
  "deadline": "2024-01-20",
  "student_ids": [1, 2, 3, 4, 5]
}
```

**Generate Student Assignments Request Body:**
```json
{
  "student_ids": [1, 2, 3, 4, 5]
}
```
_Note: If `student_ids` is empty or not provided, it will generate for all students in the class._

**Get Student Completion Status Response:**
```json
{
  "success": true,
  "data": {
    "total": 30,
    "completed_count": 20,
    "not_completed_count": 10,
    "completed_students": [
      {
        "id": 1,
        "student_id": 5,
        "student_name": "Ahmad",
        "nis": "12345",
        "completed_at": "2026-01-23T10:00:00.000Z",
        "note": "Sudah mengumpulkan"
      }
    ],
    "not_completed_students": [
      {
        "id": 2,
        "student_id": 6,
        "student_name": "Budi",
        "nis": "12346"
      }
    ]
  }
}
```

**Get Missing Students Response:**
```json
{
  "success": true,
  "data": {
    "total_students": 30,
    "generated": 25,
    "missing": 5,
    "missing_students": [
      {
        "id": 26,
        "name": "Student Name",
        "nis": "12345"
      }
    ]
  }
}
```

**Update Student Assignment Request Body:**
```json
{
  "status": true,
  "note": "Sudah dikerjakan dengan baik"
}
```

**Update Student Assignment Response:**
```json
{
  "success": true,
  "message": "Student assignment berhasil diupdate",
  "data": {
    "id": 1,
    "id_student": 1,
    "id_assignment": 2,
    "status": true,
    "completed_at": "2026-01-23T10:30:00.000Z",
    "note": "Sudah dikerjakan dengan baik"
  }
}
```

---

## Announcements Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reportify/announcements` | Get all announcements | Teacher/Admin |
| GET | `/reportify/announcements/:id` | Get announcement by ID | Teacher/Admin |
| POST | `/reportify/announcements` | Create new announcement | Teacher/Admin |
| PUT | `/reportify/announcements/:id` | Update announcement | Teacher/Admin |
| DELETE | `/reportify/announcements/:id` | Delete announcement | Teacher/Admin |

**Create/Update Announcement Request Body:**
```json
{
  "id_teaching_assignment": 1,
  "title": "Pengumuman Ujian Tengah Semester",
  "desc": "Ujian akan dilaksanakan pada tanggal 25 Januari 2024",
  "date": "2024-01-15"
}
```

---

## Authentication Header

Untuk semua endpoint yang memerlukan autentikasi, gunakan header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Response Format

**Success Response:**
```json
{
  "id": 1,
  "name": "Example",
  ...
}
```

**Error Response:**
```json
{
  "message": "Error message here",
  "error": "Detailed error (optional)"
}
```

---

## Status Codes

- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `400` - Bad Request (Invalid input)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found (Resource not found)
- `500` - Internal Server Error
