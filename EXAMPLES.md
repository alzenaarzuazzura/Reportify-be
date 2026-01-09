# API Examples - Search, Filter, Sort & Pagination

## Students API Examples

### 1. Basic Request (No Parameters)
```bash
GET /api/students
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_class": 1,
      "nis": "12345",
      "name": "John Doe",
      "parent_telephone": "081234567890",
      "student_telephone": "081234567891",
      "created_at": "2024-01-15T10:00:00.000Z",
      "class": {
        "id": 1,
        "level": { "id": 1, "name": "X" },
        "major": { "id": 1, "name": "RPL" },
        "rombel": { "id": 1, "name": "1" }
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2. Search by Name
```bash
GET /api/students?search=john
```

**Response:** Returns students with name or NIS containing "john" (case-insensitive)

### 3. Filter by Class
```bash
GET /api/students?id_class=1
```

**Response:** Returns only students from class ID 1

### 4. Sort by Name (Ascending)
```bash
GET /api/students?sortBy=name&order=asc
```

### 5. Sort by Created Date (Descending)
```bash
GET /api/students?sortBy=created_at&order=desc
```

### 6. Pagination
```bash
# Page 1, 10 items per page
GET /api/students?page=1&limit=10

# Page 2, 20 items per page
GET /api/students?page=2&limit=20

# Page 3, 50 items per page
GET /api/students?page=3&limit=50
```

### 7. Combined Query
```bash
GET /api/students?search=john&id_class=1&sortBy=name&order=asc&page=1&limit=20
```

**Explanation:**
- Search for "john" in name or NIS
- Filter by class ID 1
- Sort by name ascending
- Page 1 with 20 items per page

---

## Attendances API Examples

### 1. Basic Request
```bash
GET /api/attendances
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_student": 1,
      "id_teaching_assignment": 1,
      "id_schedule": 1,
      "date": "2024-01-15",
      "checked_at": "2024-01-15T08:30:00.000Z",
      "status": "hadir",
      "note": "Tepat waktu",
      "student": {
        "id": 1,
        "name": "John Doe",
        "nis": "12345",
        "class": {
          "level": { "name": "X" },
          "major": { "name": "RPL" },
          "rombel": { "name": "1" }
        }
      },
      "teaching_assignment": {
        "user": {
          "id": 1,
          "name": "Teacher Name",
          "email": "teacher@example.com"
        },
        "subject": {
          "id": 1,
          "name": "Matematika"
        }
      },
      "schedule": {
        "id": 1,
        "day": "senin",
        "start_time": "08:00",
        "end_time": "09:30",
        "room": "Lab Komputer 1"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2. Filter by Student
```bash
GET /api/attendances?id_student=1
```

**Response:** Returns all attendances for student ID 1

### 3. Filter by Status
```bash
# Get all "hadir" attendances
GET /api/attendances?status=hadir

# Get all "izin" attendances
GET /api/attendances?status=izin

# Get all "alfa" attendances
GET /api/attendances?status=alfa
```

### 4. Filter by Date Range
```bash
# January 2024
GET /api/attendances?date_from=2024-01-01&date_to=2024-01-31

# This week
GET /api/attendances?date_from=2024-01-15&date_to=2024-01-21

# Today only
GET /api/attendances?date_from=2024-01-15&date_to=2024-01-15
```

### 5. Filter by Teaching Assignment
```bash
GET /api/attendances?id_teaching_assignment=1
```

**Response:** Returns attendances for specific teaching assignment

### 6. Sort by Date
```bash
# Latest first
GET /api/attendances?sortBy=date&order=desc

# Oldest first
GET /api/attendances?sortBy=date&order=asc
```

### 7. Combined Query - Student Report
```bash
GET /api/attendances?id_student=1&date_from=2024-01-01&date_to=2024-01-31&sortBy=date&order=desc
```

**Use Case:** Get all attendances for a specific student in January 2024, sorted by date (newest first)

### 8. Combined Query - Class Report
```bash
GET /api/attendances?id_teaching_assignment=1&status=alfa&date_from=2024-01-01&date_to=2024-01-31
```

**Use Case:** Get all "alfa" (absent) records for a specific class in January 2024

### 9. Pagination with Filters
```bash
GET /api/attendances?id_student=1&page=1&limit=20&sortBy=date&order=desc
```

---

## Assignments API Examples

### 1. Basic Request
```bash
GET /api/assignments
```

### 2. Search by Title
```bash
GET /api/assignments?search=matematika
```

**Response:** Returns assignments with title containing "matematika"

### 3. Filter by Teaching Assignment
```bash
GET /api/assignments?id_teaching_assignment=1
```

### 4. Filter by Deadline Range
```bash
GET /api/assignments?deadline_from=2024-01-01&deadline_to=2024-01-31
```

### 5. Sort by Deadline
```bash
# Upcoming deadlines first
GET /api/assignments?sortBy=deadline&order=asc

# Latest deadlines first
GET /api/assignments?sortBy=deadline&order=desc
```

### 6. Combined Query - Teacher View
```bash
GET /api/assignments?id_teaching_assignment=1&sortBy=deadline&order=asc&page=1&limit=10
```

**Use Case:** Get all assignments for a specific teaching assignment, sorted by deadline (upcoming first)

---

## Error Responses

### 1. Invalid Date Range
```bash
GET /api/attendances?date_from=2024-01-31&date_to=2024-01-01
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid date range"
}
```

### 2. Invalid Sort Field
```bash
GET /api/students?sortBy=invalid_field
```

**Response:** Will use default sort field (created_at)

### 3. Invalid Page/Limit
```bash
# Negative page
GET /api/students?page=-1

# Will default to page=1
```

```bash
# Limit > 100
GET /api/students?limit=500

# Will cap at limit=100
```

### 4. Not Found
```bash
GET /api/students/999999
```

**Response:**
```json
{
  "success": false,
  "message": "Siswa tidak ditemukan"
}
```

---

## cURL Examples

### Students

```bash
# Basic
curl -X GET "http://localhost:3000/api/students" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With search
curl -X GET "http://localhost:3000/api/students?search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters and pagination
curl -X GET "http://localhost:3000/api/students?id_class=1&sortBy=name&order=asc&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Attendances

```bash
# Filter by student and date range
curl -X GET "http://localhost:3000/api/attendances?id_student=1&date_from=2024-01-01&date_to=2024-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by status
curl -X GET "http://localhost:3000/api/attendances?status=hadir&sortBy=date&order=desc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## JavaScript/Axios Examples

```javascript
// Students with search and pagination
const getStudents = async (search, page = 1, limit = 10) => {
  const response = await axios.get('/api/students', {
    params: { search, page, limit },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Attendances with filters
const getAttendances = async (filters) => {
  const response = await axios.get('/api/attendances', {
    params: {
      id_student: filters.studentId,
      date_from: filters.dateFrom,
      date_to: filters.dateTo,
      status: filters.status,
      page: filters.page,
      limit: filters.limit
    },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Usage
const students = await getStudents('john', 1, 20);
const attendances = await getAttendances({
  studentId: 1,
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31',
  status: 'hadir',
  page: 1,
  limit: 10
});
```

---

## React Example

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function StudentList() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    id_class: '',
    sortBy: 'name',
    order: 'asc',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students', {
        params: filters,
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSearch = (e) => {
    setFilters({ ...filters, search: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setFilters({ ...filters, page: newPage });
  };

  return (
    <div>
      <input 
        type="text" 
        placeholder="Search..." 
        value={filters.search}
        onChange={handleSearch}
      />
      
      <table>
        {/* Render students */}
      </table>
      
      <div>
        <button 
          disabled={!pagination.hasPrevPage}
          onClick={() => handlePageChange(filters.page - 1)}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.totalPages}</span>
        <button 
          disabled={!pagination.hasNextPage}
          onClick={() => handlePageChange(filters.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

