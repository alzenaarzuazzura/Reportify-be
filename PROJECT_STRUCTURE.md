# Project Structure - Reportify Backend

## 📁 Folder Structure

```
reportify-backend/
├── prisma/
│   └── schema.prisma              # Database schema
├── src/
│   ├── controllers/               # HTTP request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── studentController.js   ✨ Updated (Search/Filter/Sort)
│   │   ├── attendanceController.js ✨ Updated (Search/Filter/Sort)
│   │   ├── classController.js
│   │   ├── levelController.js
│   │   ├── majorController.js
│   │   ├── rombelController.js
│   │   ├── subjectController.js
│   │   ├── teachingAssignmentController.js
│   │   ├── scheduleController.js
│   │   ├── assignmentController.js
│   │   └── announcementController.js
│   ├── services/                  # Business logic layer ✨ NEW
│   │   ├── studentService.js      ✨ NEW
│   │   ├── attendanceService.js   ✨ NEW
│   │   └── assignmentService.js   ✨ NEW (partial)
│   ├── routes/                    # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── studentRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── classRoutes.js
│   │   ├── levelRoutes.js
│   │   ├── majorRoutes.js
│   │   ├── rombelRoutes.js
│   │   ├── subjectRoutes.js
│   │   ├── teachingAssignmentRoutes.js
│   │   ├── scheduleRoutes.js
│   │   ├── assignmentRoutes.js
│   │   └── announcementRoutes.js
│   ├── middleware/                # Custom middleware
│   │   └── authMiddleware.js
│   ├── utils/                     # Utility functions ✨ NEW
│   │   ├── queryBuilder.js        ✨ NEW
│   │   └── validator.js           ✨ NEW
│   ├── services/                  # External services
│   │   └── notificationService.js
│   └── index.js                   # App entry point
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── .gitignore
├── package.json
├── README.md                      ✨ Updated
├── API_ENDPOINTS.md               # API documentation
├── SEARCH_FILTER_SORT_PAGINATION.md ✨ NEW
├── EXAMPLES.md                    ✨ NEW
├── IMPLEMENTATION_GUIDE.md        ✨ NEW
├── FEATURE_SUMMARY.md             ✨ NEW
├── QUICK_REFERENCE.md             ✨ NEW
└── PROJECT_STRUCTURE.md           ✨ NEW (this file)
```

## 📂 Directory Explanation

### `/prisma`
Database schema dan migrations
- `schema.prisma` - Prisma schema definition

### `/src/controllers`
HTTP request handlers - menerima request, validate, call service, return response
- Handle HTTP request/response
- Validate query parameters
- Call service layer
- Format response
- Handle errors

**Example:**
```javascript
const getAllStudents = async (req, res) => {
  try {
    const queryParams = Validator.validateQueryParams(req.query, {...});
    const result = await StudentService.getStudents(queryParams);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### `/src/services` ✨ NEW
Business logic layer - pure business logic, no HTTP concerns
- Business logic
- Data access (Prisma)
- Data transformation
- Validation rules

**Example:**
```javascript
class StudentService {
  static async getStudents(queryParams) {
    const query = QueryBuilder.buildQuery({...});
    const [students, total] = await Promise.all([
      prisma.students.findMany({...query}),
      prisma.students.count({ where: query.where })
    ]);
    return QueryBuilder.formatResponse(students, total, page, limit);
  }
}
```

### `/src/routes`
API route definitions
- Define routes
- Apply middleware
- Map routes to controllers

**Example:**
```javascript
router.get('/', authenticate, authorizeAdmin, studentController.getAllStudents);
```

### `/src/middleware`
Custom middleware functions
- `authMiddleware.js` - Authentication & authorization

### `/src/utils` ✨ NEW
Utility functions - reusable helper functions
- `queryBuilder.js` - Build Prisma queries (search, filter, sort, pagination)
- `validator.js` - Validate and sanitize input

### `/src/services` (external)
External service integrations
- `notificationService.js` - Notification service (cron job)

## 🏗️ Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Request
                     ▼
┌─────────────────────────────────────────────────────────┐
│                      Routes                             │
│  - Define endpoints                                     │
│  - Apply middleware (auth, validation)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Middleware                            │
│  - Authentication (JWT)                                 │
│  - Authorization (Role-based)                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   Controllers                           │
│  - Receive HTTP request                                 │
│  - Validate query parameters (Validator)                │
│  - Call service layer                                   │
│  - Format HTTP response                                 │
│  - Handle errors                                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Services                             │
│  - Business logic                                       │
│  - Data validation                                      │
│  - Call QueryBuilder                                    │
│  - Call Prisma                                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  QueryBuilder                           │
│  - Build search query (WHERE with OR)                   │
│  - Build filter query (WHERE with AND)                  │
│  - Build sort query (ORDER BY)                          │
│  - Build pagination (SKIP & TAKE)                       │
│  - Format response with metadata                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     Prisma                              │
│  - ORM layer                                            │
│  - Type-safe queries                                    │
│  - SQL injection prevention                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                     MySQL                               │
│  - Database                                             │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### Example: GET /api/students?search=john&page=1&limit=10

1. **Client** sends HTTP GET request
   ```
   GET /api/students?search=john&page=1&limit=10
   Headers: Authorization: Bearer <token>
   ```

2. **Routes** (`studentRoutes.js`)
   ```javascript
   router.get('/', authenticate, authorizeAdmin, studentController.getAllStudents);
   ```

3. **Middleware** (`authMiddleware.js`)
   - Verify JWT token
   - Check user role (admin)

4. **Controller** (`studentController.js`)
   ```javascript
   const queryParams = Validator.validateQueryParams(req.query, {
     sortFields: ['name', 'nis', 'created_at'],
     filterFields: ['id_class']
   });
   // queryParams = { search: 'john', page: 1, limit: 10, ... }
   ```

5. **Service** (`studentService.js`)
   ```javascript
   const query = QueryBuilder.buildQuery({
     search: 'john',
     searchFields: ['name', 'nis'],
     page: 1,
     limit: 10
   });
   ```

6. **QueryBuilder** (`queryBuilder.js`)
   ```javascript
   // Returns:
   {
     where: {
       OR: [
         { name: { contains: 'john', mode: 'insensitive' } },
         { nis: { contains: 'john', mode: 'insensitive' } }
       ]
     },
     orderBy: { created_at: 'asc' },
     skip: 0,
     take: 10
   }
   ```

7. **Prisma** executes query
   ```javascript
   const [students, total] = await Promise.all([
     prisma.students.findMany({...query}),
     prisma.students.count({ where: query.where })
   ]);
   ```

8. **MySQL** returns data

9. **Service** formats response
   ```javascript
   return QueryBuilder.formatResponse(students, total, page, limit);
   ```

10. **Controller** sends HTTP response
    ```json
    {
      "success": true,
      "data": [...],
      "pagination": {...}
    }
    ```

## 📝 File Naming Conventions

### Controllers
- Pattern: `{resource}Controller.js`
- Example: `studentController.js`, `attendanceController.js`

### Services
- Pattern: `{resource}Service.js`
- Example: `studentService.js`, `attendanceService.js`

### Routes
- Pattern: `{resource}Routes.js`
- Example: `studentRoutes.js`, `attendanceRoutes.js`

### Middleware
- Pattern: `{purpose}Middleware.js`
- Example: `authMiddleware.js`

### Utils
- Pattern: `{purpose}.js`
- Example: `queryBuilder.js`, `validator.js`

## 🎯 Code Organization Principles

### 1. Separation of Concerns
- Controllers: HTTP layer
- Services: Business logic
- Utils: Reusable functions
- Middleware: Cross-cutting concerns

### 2. Single Responsibility
- Each file has one clear purpose
- Each function does one thing well

### 3. DRY (Don't Repeat Yourself)
- QueryBuilder: Reusable query building
- Validator: Reusable validation
- Service layer: Reusable business logic

### 4. Dependency Injection
- Services don't know about HTTP
- Controllers don't know about database
- Clear boundaries between layers

## 📊 Database Schema Overview

```
users (admin, teacher)
  ↓
teaching_assignments
  ├── classes (level + major + rombel)
  │     ↓
  │   students
  │     ↓
  │   attendances
  │     ↓
  │   student_assignments
  ├── subjects
  └── schedules
      ↓
    attendances

assignments
  ↓
student_assignments

announcements
```

## 🔧 Configuration Files

### `.env`
Environment variables (not in git)
```
DATABASE_URL="mysql://user:password@localhost:3306/reportify"
JWT_SECRET="your-secret-key"
PORT=3000
```

### `.env.example`
Environment template (in git)
```
DATABASE_URL="mysql://user:password@localhost:3306/reportify"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### `package.json`
Dependencies and scripts
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

## 📚 Documentation Files

### Core Documentation
- `README.md` - Project overview, setup guide
- `API_ENDPOINTS.md` - Complete API reference

### Feature Documentation ✨ NEW
- `SEARCH_FILTER_SORT_PAGINATION.md` - Feature overview
- `EXAMPLES.md` - Usage examples
- `IMPLEMENTATION_GUIDE.md` - Implementation details
- `FEATURE_SUMMARY.md` - Feature summary
- `QUICK_REFERENCE.md` - Quick reference guide
- `PROJECT_STRUCTURE.md` - This file

## 🚀 Getting Started

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Configure database in `.env`
5. Generate Prisma client: `npm run prisma:generate`
6. Run migrations: `npm run prisma:migrate`
7. Start server: `npm run dev`

## 🧪 Testing Structure (To Be Implemented)

```
tests/
├── unit/
│   ├── utils/
│   │   ├── queryBuilder.test.js
│   │   └── validator.test.js
│   └── services/
│       ├── studentService.test.js
│       └── attendanceService.test.js
├── integration/
│   ├── students.test.js
│   └── attendances.test.js
└── e2e/
    └── api.test.js
```

## 📈 Future Enhancements

### Short Term
- [ ] Add search/filter/sort to all endpoints
- [ ] Add database indexes
- [ ] Add unit tests
- [ ] Add integration tests

### Medium Term
- [ ] Migrate to TypeScript
- [ ] Add caching (Redis)
- [ ] Add rate limiting
- [ ] Add API documentation (Swagger)

### Long Term
- [ ] Add GraphQL support
- [ ] Add monitoring & logging
- [ ] Add performance metrics
- [ ] Add cursor-based pagination

## 🎓 Learning Path

1. **Understand the flow**: Follow a request from client to database
2. **Read the code**: Start with controllers, then services, then utils
3. **Check examples**: See EXAMPLES.md for usage patterns
4. **Implement new endpoint**: Use IMPLEMENTATION_GUIDE.md
5. **Test your code**: Write tests for your implementation

## 📞 Support

- Check documentation files in root folder
- Review code comments in source files
- Follow examples in EXAMPLES.md

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0

