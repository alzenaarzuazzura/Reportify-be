# Combo API Documentation

API untuk mendapatkan data combo select (dropdown) dengan format standar.

## Base URL
```
http://localhost:3000/reportify/combo
```

## Authentication
Semua endpoint memerlukan authentication token.

## Response Format

### Success Response
```json
{
  "data": [
    {
      "value": 1,
      "label": "Item Name"
    }
  ],
  "message": "success",
  "status": true
}
```

### Error Response
```json
{
  "data": [],
  "message": "failed",
  "status": false
}
```

---

## Endpoints

### 1. Get Levels Combo

Mendapatkan daftar tingkat kelas (X, XI, XII).

**Endpoint:** `GET /combo/levels`

**Response Example:**
```json
{
  "data": [
    { "value": 1, "label": "X" },
    { "value": 2, "label": "XI" },
    { "value": 3, "label": "XII" }
  ],
  "message": "success",
  "status": true
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/reportify/combo/levels \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 2. Get Majors Combo

Mendapatkan daftar jurusan (RPL, TKJ, MM, dll).

**Endpoint:** `GET /combo/majors`

**Response Example:**
```json
{
  "data": [
    { "value": 1, "label": "RPL" },
    { "value": 2, "label": "TKJ" },
    { "value": 3, "label": "MM" }
  ],
  "message": "success",
  "status": true
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/reportify/combo/majors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Get Rombels Combo

Mendapatkan daftar rombongan belajar (X RPL 1, XI TKJ 2, dll).

**Endpoint:** `GET /combo/rombels`

**Response Example:**
```json
{
  "data": [
    { "value": 1, "label": "X RPL 1" },
    { "value": 2, "label": "X RPL 2" },
    { "value": 3, "label": "XI TKJ 1" }
  ],
  "message": "success",
  "status": true
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/reportify/combo/rombels \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Get Roles Combo

Mendapatkan daftar role user (admin, teacher).

**Endpoint:** `GET /combo/roles`

**Response Example:**
```json
{
  "data": [
    { "value": "admin", "label": "admin" },
    { "value": "teacher", "label": "teacher" }
  ],
  "message": "success",
  "status": true
}
```

**Note:** Data ini static (tidak dari database).

**cURL Example:**
```bash
curl -X GET http://localhost:3000/reportify/combo/roles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. Get Teachers Combo

Mendapatkan daftar guru (user dengan role = teacher).

**Endpoint:** `GET /combo/teachers`

**Response Example:**
```json
{
  "data": [
    { "value": 1, "label": "Pak Budi" },
    { "value": 2, "label": "Bu Ani" },
    { "value": 3, "label": "Pak Joko" }
  ],
  "message": "success",
  "status": true
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/reportify/combo/teachers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. Get Students Combo

Mendapatkan daftar siswa.

**Endpoint:** `GET /combo/students`

**Response Example:**
```json
{
  "data": [
    { "value": 1, "label": "Ahmad Fauzi" },
    { "value": 2, "label": "Siti Nurhaliza" },
    { "value": 3, "label": "Budi Santoso" }
  ],
  "message": "success",
  "status": true
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:3000/reportify/combo/students \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Data Sorting

Semua data diurutkan berdasarkan `name` secara ascending (A-Z), kecuali untuk roles yang static.

## Error Handling

Jika terjadi error, API akan mengembalikan:
- Status code: 500
- Response body:
```json
{
  "data": [],
  "message": "failed",
  "status": false
}
```

Error akan di-log di console server untuk debugging.

---

## Usage in Frontend

### Ant Design Select Example

```typescript
import { Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from './api';

const MyComponent = () => {
  const { data: levels } = useQuery({
    queryKey: ['combo', 'levels'],
    queryFn: async () => {
      const res = await api.get('/combo/levels');
      return res.data.data; // Returns array of {value, label}
    },
  });

  return (
    <Select
      options={levels}
      placeholder="Pilih Level"
    />
  );
};
```

### React Select Example

```typescript
import Select from 'react-select';

const MyComponent = () => {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    fetch('/reportify/combo/levels')
      .then(res => res.json())
      .then(data => setOptions(data.data));
  }, []);

  return (
    <Select
      options={options}
      placeholder="Pilih Level"
    />
  );
};
```

---

## Testing

### Test All Endpoints

```bash
# Test levels
curl http://localhost:3000/reportify/combo/levels

# Test majors
curl http://localhost:3000/reportify/combo/majors

# Test rombels
curl http://localhost:3000/reportify/combo/rombels

# Test roles
curl http://localhost:3000/reportify/combo/roles

# Test teachers
curl http://localhost:3000/reportify/combo/teachers

# Test students
curl http://localhost:3000/reportify/combo/students
```

---

## Database Schema Reference

### levels
```sql
id INT PRIMARY KEY
name VARCHAR
```

### majors
```sql
id INT PRIMARY KEY
name VARCHAR
```

### rombels
```sql
id INT PRIMARY KEY
name VARCHAR
```

### users
```sql
id INT PRIMARY KEY
name VARCHAR
role ENUM('admin', 'teacher')
```

### students
```sql
id INT PRIMARY KEY
name VARCHAR
```

---

## Notes

1. Semua endpoint memerlukan authentication
2. Data diurutkan berdasarkan name (ASC)
3. Format response konsisten untuk semua endpoint
4. Error handling yang proper
5. Menggunakan Prisma Client untuk query database
6. Kode terpisah: service → controller → route

---

**Last Updated:** 2026-01-07  
**Version:** 1.0.0
