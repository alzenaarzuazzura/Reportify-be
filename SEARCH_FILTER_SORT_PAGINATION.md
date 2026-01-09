# Search, Filter, Sort, dan Pagination - Reportify API

## Overview

Fitur Search, Filter, Sort, dan Pagination telah diimplementasikan pada API Reportify dengan:
- **Aman dari SQL Injection** (menggunakan Prisma ORM)
- **Clean & Scalable Architecture** (Service Layer Pattern)
- **Production-Ready** (Error handling, validation, default values)

## Struktur Folder

```
src/
├── controllers/
│   ├── studentController.js      # Updated dengan query params
│   └── attendanceController.js   # Updated dengan query params
├── services/
│   ├── studentService.js         # Business logic untuk students
│   └── attendanceService.js      # Business logic untuk attendances
├── utils/
│   ├── queryBuilder.js           # Utility untuk build Prisma query
│   └── validator.js              # Validator untuk query params
└── routes/
    ├── studentRoutes.js
    └── attendanceRoutes.js
```

## Fitur yang Diimplementasikan

### 1. Search (Partial Match, Case-Insensitive)
- Menggunakan Prisma `contains` dengan `mode: 'insensitive'`
- Support multiple fields (OR condition)

### 2. Filter
- Exact match untuk field tertentu
- Date range (from/to)
- Array values (IN operator)

### 3. Sort
- Ascending (asc) atau Descending (desc)
- Default sort field jika tidak ada sortBy

### 4. Pagination
- Page-based pagination
- Default: page=1, limit=10
- Max limit: 100 items per page

## Contoh Penggunaan

### Students API

#### 1. Get All Students (Basic)
```
GET /api/students
```

Response:
```json
{
  "success": true,
  "data": [...],
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

#### 2. Search Students by Name or NIS
```
GET /api/students?search=john
```

#### 3. Filter Students by Class
```
GET /api/students?id_class=1
```

#### 4. Sort Students
```
GET /api/students?sortBy=name&order=asc
```

Available sortBy: `name`, `nis`, `created_at`

#### 5. Pagination
```
GET /api/students?page=2&limit=20
```

#### 6. Kombinasi (Search + Filter + Sort + Pagination)
```
GET /api/students?search=john&id_class=1&sortBy=name&order=asc&page=1&limit=10
```

---

### Attendances API

#### 1. Get All Attendances (Basic)
```
GET /api/attendances
```

#### 2. Filter by Student
```
GET /api/attendances?id_student=1
```

#### 3. Filter by Status
```
GET /api/attendances?status=hadir
```

Available status: `hadir`, `izin`, `alfa`

#### 4. Filter by Date Range
```
GET /api/attendances?date_from=2024-01-01&date_to=2024-01-31
```

#### 5. Sort by Date
```
GET /api/attendances?sortBy=date&order=desc
```

Available sortBy: `date`, `checked_at`, `status`

#### 6. Kombinasi Lengkap
```
GET /api/attendances?id_student=1&status=hadir&date_from=2024-01-01&date_to=2024-01-31&sortBy=date&order=desc&page=1&limit=20
```

---

## Query Parameters

### Common Parameters

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `search` | string | Search term (partial match) | - | `?search=john` |
| `sortBy` | string | Field to sort by | varies | `?sortBy=name` |
| `order` | string | Sort order (asc/desc) | `asc` | `?order=desc` |
| `page` | number | Page number (1-based) | `1` | `?page=2` |
| `limit` | number | Items per page (max: 100) | `10` | `?limit=20` |

### Students Specific

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id_class` | number | Filter by class ID | `?id_class=1` |

### Attendances Specific

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `id_student` | number | Filter by student ID | `?id_student=1` |
| `id_teaching_assignment` | number | Filter by teaching assignment | `?id_teaching_assignment=1` |
| `id_schedule` | number | Filter by schedule | `?id_schedule=1` |
| `status` | string | Filter by status | `?status=hadir` |
| `date_from` | date | Filter from date | `?date_from=2024-01-01` |
| `date_to` | date | Filter to date | `?date_to=2024-01-31` |

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      ...
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

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error (optional)"
}
```

---

## Best Practices

### 1. Security
- ✅ Aman dari SQL Injection (Prisma ORM)
- ✅ Input validation & sanitization
- ✅ Max limit untuk pagination (100 items)

### 2. Performance
- ✅ Pagination untuk large datasets
- ✅ Index pada field yang sering di-filter/sort
- ✅ Select only needed fields

### 3. Code Quality
- ✅ Service Layer Pattern (separation of concerns)
- ✅ Reusable QueryBuilder utility
- ✅ Consistent error handling
- ✅ Clear naming conventions

### 4. API Design
- ✅ RESTful conventions
- ✅ Consistent response format
- ✅ Meaningful HTTP status codes
- ✅ Pagination metadata

---

## Cara Menambahkan ke Endpoint Lain

### 1. Buat Service File
```javascript
// src/services/yourService.js
const { PrismaClient } = require('@prisma/client');
const QueryBuilder = require('../utils/queryBuilder');

const prisma = new PrismaClient();

class YourService {
  static async getItems(queryParams) {
    const { search, sortBy, order, page, limit, filters } = queryParams;

    const query = QueryBuilder.buildQuery({
      search,
      searchFields: ['field1', 'field2'], // Fields untuk search
      filters,
      sortBy,
      order,
      defaultSort: 'created_at',
      page,
      limit,
      maxLimit: 100
    });

    const [items, total] = await Promise.all([
      prisma.yourModel.findMany({
        ...query,
        include: { /* your relations */ }
      }),
      prisma.yourModel.count({ where: query.where })
    ]);

    return QueryBuilder.formatResponse(items, total, page, limit);
  }
}

module.exports = YourService;
```

### 2. Update Controller
```javascript
// src/controllers/yourController.js
const YourService = require('../services/yourService');
const Validator = require('../utils/validator');

const getAll = async (req, res) => {
  try {
    const queryParams = Validator.validateQueryParams(req.query, {
      sortFields: ['field1', 'field2', 'created_at'],
      filterFields: ['filter1', 'filter2']
    });

    const result = await YourService.getItems(queryParams);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
```

---

## Testing Examples

### cURL Examples

```bash
# Basic request
curl -X GET "http://localhost:3000/api/students" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With search
curl -X GET "http://localhost:3000/api/students?search=john" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/students?id_class=1&sortBy=name&order=asc&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Attendances with date range
curl -X GET "http://localhost:3000/api/attendances?date_from=2024-01-01&date_to=2024-01-31&status=hadir" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

- Semua endpoint yang memerlukan autentikasi harus menyertakan JWT token
- Default values akan digunakan jika query parameter tidak disediakan
- Invalid query parameters akan diabaikan (tidak error)
- Date format: `YYYY-MM-DD`
- Max limit per request: 100 items

