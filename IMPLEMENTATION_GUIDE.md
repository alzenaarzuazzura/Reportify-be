# Implementation Guide - Search, Filter, Sort & Pagination

## Arsitektur

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request dengan Query Params
       ▼
┌─────────────┐
│   Routes    │ ← Routing & Middleware
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │ ← Validate Query Params
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │ ← Business Logic
└──────┬──────┘
       │
       ▼
┌─────────────┐
│QueryBuilder │ ← Build Prisma Query
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Prisma    │ ← Execute Query (Safe from SQL Injection)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   MySQL     │
└─────────────┘
```

## Components

### 1. QueryBuilder (src/utils/queryBuilder.js)

**Purpose:** Utility untuk membangun Prisma query yang aman

**Key Methods:**
- `buildSearchQuery()` - Build WHERE clause untuk search
- `buildFilterQuery()` - Build WHERE clause untuk filter
- `buildSortQuery()` - Build ORDER BY clause
- `buildPagination()` - Build SKIP & TAKE
- `buildQuery()` - Combine semua query
- `formatResponse()` - Format response dengan pagination metadata

**Example:**
```javascript
const query = QueryBuilder.buildQuery({
  search: 'john',
  searchFields: ['name', 'email'],
  filters: { status: 'active', id_class: 1 },
  sortBy: 'name',
  order: 'asc',
  page: 1,
  limit: 10
});

// Output:
{
  where: {
    AND: [
      { OR: [
        { name: { contains: 'john', mode: 'insensitive' } },
        { email: { contains: 'john', mode: 'insensitive' } }
      ]},
      { status: 'active', id_class: 1 }
    ]
  },
  orderBy: { name: 'asc' },
  skip: 0,
  take: 10
}
```

### 2. Validator (src/utils/validator.js)

**Purpose:** Validate dan sanitize query parameters

**Key Methods:**
- `validateQueryParams()` - Validate semua query params
- `isValidDateRange()` - Validate date range
- `sanitizeString()` - Sanitize string input

**Example:**
```javascript
const queryParams = Validator.validateQueryParams(req.query, {
  sortFields: ['name', 'created_at'],
  filterFields: ['status', 'id_class']
});

// Input: ?search=john&sortBy=name&order=asc&page=1&limit=10&status=active
// Output:
{
  search: 'john',
  sortBy: 'name',
  order: 'asc',
  page: 1,
  limit: 10,
  filters: { status: 'active' }
}
```

### 3. Service Layer

**Purpose:** Business logic dan data access

**Pattern:**
```javascript
class YourService {
  static async getItems(queryParams) {
    // 1. Build query
    const query = QueryBuilder.buildQuery({...});
    
    // 2. Execute query
    const [items, total] = await Promise.all([
      prisma.yourModel.findMany({...query}),
      prisma.yourModel.count({ where: query.where })
    ]);
    
    // 3. Format response
    return QueryBuilder.formatResponse(items, total, page, limit);
  }
}
```

### 4. Controller Layer

**Purpose:** Handle HTTP request/response

**Pattern:**
```javascript
const getAll = async (req, res) => {
  try {
    // 1. Validate query params
    const queryParams = Validator.validateQueryParams(req.query, {
      sortFields: ['field1', 'field2'],
      filterFields: ['filter1', 'filter2']
    });
    
    // 2. Call service
    const result = await YourService.getItems(queryParams);
    
    // 3. Send response
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
```

## Security Features

### 1. SQL Injection Prevention
✅ Menggunakan Prisma ORM (parameterized queries)
✅ Tidak ada raw SQL queries
✅ Type-safe query building

### 2. Input Validation
✅ Validate sortBy field (whitelist)
✅ Validate order (asc/desc only)
✅ Validate page & limit (positive integers)
✅ Validate filter fields (whitelist)

### 3. Rate Limiting
✅ Max limit per request: 100 items
✅ Prevent large data dumps

### 4. Sanitization
✅ Trim whitespace
✅ Remove dangerous characters
✅ Type coercion

## Performance Optimization

### 1. Database Indexes
```prisma
// Add indexes untuk fields yang sering di-filter/sort
model students {
  id         Int      @id @default(autoincrement())
  name       String   @db.VarChar(100)
  nis        String   @unique @db.VarChar(50)
  created_at DateTime @default(now()) @db.DateTime(0)
  
  @@index([name])
  @@index([created_at])
  @@index([id_class])
}
```

### 2. Pagination
- Gunakan cursor-based pagination untuk large datasets
- Default limit: 10 items
- Max limit: 100 items

### 3. Select Only Needed Fields
```javascript
prisma.students.findMany({
  select: {
    id: true,
    name: true,
    nis: true
    // Don't select unnecessary fields
  }
});
```

### 4. Use Promise.all
```javascript
// Execute count dan findMany secara parallel
const [items, total] = await Promise.all([
  prisma.model.findMany({...}),
  prisma.model.count({...})
]);
```

## Error Handling

### 1. Controller Level
```javascript
try {
  const result = await Service.getItems(queryParams);
  res.json(result);
} catch (error) {
  const statusCode = error.message.includes('tidak ditemukan') ? 404 : 500;
  res.status(statusCode).json({ 
    success: false,
    message: error.message 
  });
}
```

### 2. Service Level
```javascript
static async getItemById(id) {
  const item = await prisma.model.findUnique({
    where: { id: parseInt(id) }
  });
  
  if (!item) {
    throw new Error('Item tidak ditemukan');
  }
  
  return item;
}
```

## Testing

### 1. Unit Tests (Example with Jest)
```javascript
describe('QueryBuilder', () => {
  test('buildSearchQuery should create OR conditions', () => {
    const result = QueryBuilder.buildSearchQuery('john', ['name', 'email']);
    expect(result).toEqual({
      OR: [
        { name: { contains: 'john', mode: 'insensitive' } },
        { email: { contains: 'john', mode: 'insensitive' } }
      ]
    });
  });
});
```

### 2. Integration Tests
```javascript
describe('GET /api/students', () => {
  test('should return paginated students', async () => {
    const response = await request(app)
      .get('/api/students?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });
});
```

## Common Patterns

### 1. Date Range Filter
```javascript
// Query: ?date_from=2024-01-01&date_to=2024-01-31
filters: {
  date_from: '2024-01-01',
  date_to: '2024-01-31'
}

// QueryBuilder akan convert menjadi:
{
  date: {
    gte: new Date('2024-01-01'),
    lte: new Date('2024-01-31')
  }
}
```

### 2. Array Filter (IN operator)
```javascript
// Query: ?status=hadir,izin
filters: {
  status: ['hadir', 'izin']
}

// QueryBuilder akan convert menjadi:
{
  status: { in: ['hadir', 'izin'] }
}
```

### 3. Nested Relations
```javascript
prisma.students.findMany({
  include: {
    class: {
      include: {
        level: true,
        major: true,
        rombel: true
      }
    }
  }
});
```

## Migration Guide

### Dari Controller Lama ke Baru

**Before:**
```javascript
const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.students.findMany({
      include: { class: true }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

**After:**
```javascript
const getAllStudents = async (req, res) => {
  try {
    const queryParams = Validator.validateQueryParams(req.query, {
      sortFields: ['name', 'nis', 'created_at'],
      filterFields: ['id_class']
    });
    
    const result = await StudentService.getStudents(queryParams);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};
```

## Best Practices Checklist

- ✅ Use Service Layer for business logic
- ✅ Validate query parameters
- ✅ Set default values
- ✅ Set max limits
- ✅ Use consistent response format
- ✅ Handle errors properly
- ✅ Add database indexes
- ✅ Document API endpoints
- ✅ Write tests
- ✅ Use TypeScript (optional but recommended)

## Next Steps

1. Add more endpoints (users, classes, etc.)
2. Add caching (Redis)
3. Add rate limiting
4. Add API documentation (Swagger)
5. Add monitoring & logging
6. Add unit & integration tests

