# Quick Reference - Search, Filter, Sort & Pagination

## 🚀 Quick Start

### 1. Basic Request
```bash
GET /api/students
```

### 2. With Search
```bash
GET /api/students?search=john
```

### 3. With Filter
```bash
GET /api/students?id_class=1
```

### 4. With Sort
```bash
GET /api/students?sortBy=name&order=asc
```

### 5. With Pagination
```bash
GET /api/students?page=1&limit=20
```

### 6. Combined
```bash
GET /api/students?search=john&id_class=1&sortBy=name&order=asc&page=1&limit=20
```

---

## 📋 Query Parameters Cheat Sheet

| Parameter | Type | Values | Default | Example |
|-----------|------|--------|---------|---------|
| `search` | string | any | - | `?search=john` |
| `sortBy` | string | field name | varies | `?sortBy=name` |
| `order` | string | asc, desc | asc | `?order=desc` |
| `page` | number | 1+ | 1 | `?page=2` |
| `limit` | number | 1-100 | 10 | `?limit=20` |

---

## 🎯 Endpoints Reference

### Students
```bash
# Search by name or NIS
GET /api/students?search=john

# Filter by class
GET /api/students?id_class=1

# Sort options
?sortBy=name          # Sort by name
?sortBy=nis           # Sort by NIS
?sortBy=created_at    # Sort by created date
```

### Attendances
```bash
# Filter by student
GET /api/attendances?id_student=1

# Filter by status
GET /api/attendances?status=hadir

# Filter by date range
GET /api/attendances?date_from=2024-01-01&date_to=2024-01-31

# Sort options
?sortBy=date          # Sort by date
?sortBy=checked_at    # Sort by check time
?sortBy=status        # Sort by status
```

---

## 💻 Code Snippets

### JavaScript/Axios
```javascript
// Basic
const response = await axios.get('/api/students', {
  params: { page: 1, limit: 10 },
  headers: { Authorization: `Bearer ${token}` }
});

// With filters
const response = await axios.get('/api/students', {
  params: {
    search: 'john',
    id_class: 1,
    sortBy: 'name',
    order: 'asc',
    page: 1,
    limit: 20
  },
  headers: { Authorization: `Bearer ${token}` }
});
```

### React Hook
```javascript
const useStudents = (filters) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/students', {
          params: filters,
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data.data);
        setPagination(response.data.pagination);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  return { data, pagination, loading };
};

// Usage
const { data, pagination, loading } = useStudents({
  search: 'john',
  page: 1,
  limit: 10
});
```

### cURL
```bash
# Basic
curl -X GET "http://localhost:3000/api/students" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl -X GET "http://localhost:3000/api/students?search=john&id_class=1&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📦 Response Structure

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

---

## 🔧 Implementation Template

### Add to New Endpoint

#### 1. Create Service
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
      searchFields: ['field1', 'field2'],
      filters,
      sortBy,
      order,
      defaultSort: 'created_at',
      page,
      limit,
      maxLimit: 100
    });

    const [items, total] = await Promise.all([
      prisma.yourModel.findMany({ ...query }),
      prisma.yourModel.count({ where: query.where })
    ]);

    return QueryBuilder.formatResponse(items, total, page, limit);
  }
}

module.exports = YourService;
```

#### 2. Update Controller
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

module.exports = { getAll };
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Invalid sort field
**Problem**: `?sortBy=invalid_field`
**Solution**: Will use default sort field

### Issue 2: Invalid date range
**Problem**: `?date_from=2024-01-31&date_to=2024-01-01`
**Solution**: Returns 400 error with message "Invalid date range"

### Issue 3: Limit too high
**Problem**: `?limit=1000`
**Solution**: Will cap at max limit (100)

### Issue 4: Negative page
**Problem**: `?page=-1`
**Solution**: Will default to page 1

---

## 🎨 Frontend Integration

### React Table Component
```jsx
function DataTable({ endpoint, columns }) {
  const [filters, setFilters] = useState({
    search: '',
    sortBy: '',
    order: 'asc',
    page: 1,
    limit: 10
  });

  const { data, pagination, loading } = useData(endpoint, filters);

  return (
    <div>
      <input 
        type="text"
        placeholder="Search..."
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
      />
      
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th 
                key={col.key}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              {columns.map(col => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <Pagination 
        current={pagination.page}
        total={pagination.totalPages}
        onChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
}
```

---

## 📊 Performance Tips

1. **Use Pagination**: Always use pagination for large datasets
2. **Add Indexes**: Add database indexes on frequently filtered/sorted fields
3. **Limit Fields**: Use `select` to only fetch needed fields
4. **Cache Results**: Consider caching for frequently accessed data
5. **Optimize Queries**: Use `include` wisely, avoid N+1 queries

---

## 🔐 Security Checklist

- ✅ SQL Injection: Protected by Prisma ORM
- ✅ Input Validation: Validator utility
- ✅ Field Whitelisting: Only allowed fields
- ✅ Max Limit: 100 items per page
- ✅ Sanitization: Trim & remove dangerous chars
- ✅ Authentication: JWT required
- ✅ Authorization: Role-based access

---

## 📚 Related Documentation

- [Full Documentation](SEARCH_FILTER_SORT_PAGINATION.md)
- [API Examples](EXAMPLES.md)
- [Implementation Guide](IMPLEMENTATION_GUIDE.md)
- [Feature Summary](FEATURE_SUMMARY.md)
- [API Endpoints](API_ENDPOINTS.md)

---

## 🆘 Need Help?

1. Check [EXAMPLES.md](EXAMPLES.md) for usage examples
2. Check [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for detailed guide
3. Check [FEATURE_SUMMARY.md](FEATURE_SUMMARY.md) for feature overview

---

**Quick Links:**
- [Students API](#students)
- [Attendances API](#attendances)
- [Code Snippets](#-code-snippets)
- [Implementation Template](#-implementation-template)

