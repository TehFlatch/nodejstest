# Project Management Application - Advanced Features

## Overview

A full-stack project management application with enterprise-grade architectural patterns:

- ✅ **Multi-tenancy Support** - Tenant isolation at database level
- ✅ **Real-time WebSockets** - Socket.io integration for live updates
- ✅ **Message Queues** - BullMQ with Redis for background jobs
- ✅ **Event-Driven Architecture** - Domain events for decoupled communication

**Tech Stack:**
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Frontend:** Angular 19 (Standalone, Zoneless), Material Design
- **Infrastructure:** Docker, Redis, Socket.io, BullMQ

---

## Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["Angular Frontend"]
        A[App Component] --> B[Socket Service]
        C[Project List] --> B
        C --> D[API Service]
        B --> E[WebSocket Connection]
    end
    
    subgraph Backend["Express Backend"]
        F[HTTP Server] --> G[Express App]
        F --> H[WebSocket Server]
        G --> I[Tenant Middleware]
        I --> J[Controllers]
        J --> K[Event Bus]
        K --> H
        K --> L[Queue Workers]
        L --> M[Redis]
        J --> N[Prisma Client]
        N --> O[(PostgreSQL)]
    end
    
    E -.Real-time.-> H
    D --REST API--> G
    
    style Frontend fill:#e1f5ff
    style Backend fill:#fff4e1
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (or use Docker)

### Installation

1. **Clone and Install Dependencies**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

2. **Start Infrastructure**
```bash
# Start Redis and Adminer
docker-compose up -d
```

3. **Configure Environment**
```bash
# backend/.env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/projectmgmt"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="supersecret_jwt_key_12345"
```

4. **Setup Database**
```bash
cd backend
npx prisma db push
npx prisma generate
```

5. **Run Application**
```bash
# Backend (in backend/)
npm run dev

# Frontend (in frontend/)
npm start
```

**Access:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- Adminer (DB UI): http://localhost:8080

---

## Database Schema

```mermaid
erDiagram
    TENANT ||--o{ USER : has
    TENANT ||--o{ PROJECT : owns
    TENANT ||--o{ TASK : owns
    USER ||--o{ NOTIFICATION : receives
    PROJECT ||--o{ TASK : contains
    
    TENANT {
        string id PK
        string name
        string slug UK
        datetime createdAt
        datetime updatedAt
    }
    
    USER {
        string id PK
        string email UK
        string password
        string name
        string role
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }
    
    PROJECT {
        int id PK
        string title
        string description
        string status
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }
    
    TASK {
        int id PK
        string title
        string description
        string status
        datetime dueDate
        int projectId FK
        string tenantId FK
        datetime createdAt
        datetime updatedAt
    }
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register tenant & user | `{ email, password, name, tenantName }` |
| POST | `/api/auth/login` | Login user | `{ email, password }` |

### Projects

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| GET | `/api/projects` | Get all projects | `x-tenant-id` |
| GET | `/api/projects/:id` | Get project by ID | `x-tenant-id` |
| POST | `/api/projects` | Create project | `x-tenant-id` |
| DELETE | `/api/projects/:id` | Delete project | `x-tenant-id` |

### Tasks

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| GET | `/api/tasks` | Get all tasks | `x-tenant-id` |
| GET | `/api/tasks/project/:projectId` | Get tasks by project | `x-tenant-id` |
| POST | `/api/tasks` | Create task | `x-tenant-id` |
| PUT | `/api/tasks/:id` | Update task | `x-tenant-id` |
| DELETE | `/api/tasks/:id` | Delete task | `x-tenant-id` |

---

## Event Flow Example

### Creating a Task

1. **Frontend** → POST `/api/tasks` with task data
2. **Tenant Middleware** → Extracts `tenantId` from headers
3. **Task Controller** → Creates task in database with `tenantId`
4. **Event Bus** → Emits `TASK.CREATED` event
5. **WebSocket Server** → Broadcasts to `tenant:${tenantId}` room
6. **Queue** → Enqueues notification job
7. **Worker** → Processes job (sends email)
8. **Frontend** → Receives WebSocket event, shows notification

---

## Testing Multi-tenancy

### 1. Register Two Tenants

```bash
# Tenant A
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tenantA.com",
    "password": "password",
    "name": "Admin A",
    "tenantName": "Tenant A"
  }'

# Tenant B
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tenantB.com",
    "password": "password",
    "name": "Admin B",
    "tenantName": "Tenant B"
  }'
```

### 2. Create Projects with Different Tenants

```bash
# As Tenant A
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: <tenant-a-id>" \
  -d '{ "title": "Project A", "description": "Tenant A Project" }'

# As Tenant B
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: <tenant-b-id>" \
  -d '{ "title": "Project B", "description": "Tenant B Project" }'
```

### 3. Verify Isolation

```bash
# Tenant A should only see Project A
curl http://localhost:3000/api/projects \
  -H "x-tenant-id: <tenant-a-id>"
```

---

## Testing Real-time Features

1. **Open Two Browser Windows** at http://localhost:4200
2. **WebSocket Connection** is automatic on app load
3. **Create Project in Window 1**
4. **Observe in Window 2:**
   - Snackbar notification appears
   - Project list auto-refreshes

---

## Key Features

### Multi-tenancy
- Complete data isolation per tenant
- Tenant-scoped queries at database level
- Middleware-based tenant extraction from headers

### Real-time Updates
- Socket.io WebSocket connections
- Room-based broadcasting for tenant isolation
- Automatic event forwarding from backend to frontend
- Material Snackbar notifications

### Message Queues
- BullMQ for background job processing
- Redis-backed queue persistence
- Worker processes for async tasks
- Automatic retry and error handling

### Event-Driven Architecture
- Domain events for decoupled communication
- Event Bus pattern with Node.js EventEmitter
- Events: `project:created`, `task:created`, etc.
- Automatic WebSocket broadcasting

---

## Project Structure

### Backend

```
backend/
├── config/
│   ├── prisma.ts          # Prisma client
│   └── redis.ts           # Redis configuration
├── controllers/
│   ├── auth.controller.ts # Register/Login
│   ├── project.controller.ts
│   └── task.controller.ts
├── middleware/
│   ├── tenant.middleware.ts
│   ├── validation.middleware.ts
│   └── error.middleware.ts
├── workers/
│   └── queue.ts           # BullMQ queues & workers
├── utils/
│   ├── events.ts          # Event Bus
│   ├── logger.ts
│   └── schemas.ts
├── prisma/
│   └── schema.prisma      # Database schema
├── websocket.ts           # Socket.io server
└── server.ts              # Express app
```

### Frontend

```
frontend/src/app/
├── components/
│   ├── dashboard/
│   ├── project-list/      # Real-time updates
│   ├── project-detail/
│   └── loader/
├── services/
│   ├── api.service.ts
│   ├── socket.service.ts  # WebSocket wrapper
│   └── loading.service.ts
├── interfaces/
│   ├── project.interface.ts
│   └── task.interface.ts
└── app.ts                 # Socket initialization
```

---

## Production Considerations

> [!CAUTION]
> **Security & Performance**
> 
> This implementation is for demonstration. Production requires:

### Security
- [ ] Hash passwords with bcrypt
- [ ] Implement JWT authentication
- [ ] Validate tenant ownership strictly
- [ ] Add rate limiting
- [ ] Sanitize WebSocket connections
- [ ] Environment-based CORS configuration

### Performance
- [ ] Add database indexes on `tenantId`
- [ ] Implement caching layer (Redis)
- [ ] Add pagination for large datasets
- [ ] Optimize WebSocket room management
- [ ] Connection pooling for database

### Reliability
- [ ] Add queue job retry logic
- [ ] Implement dead letter queues
- [ ] Add monitoring and alerting
- [ ] Database backup strategy
- [ ] Graceful shutdown handling

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Recreate database
npx prisma db push --force-reset
```

### Redis Connection Issues

```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
redis-cli ping
```

### WebSocket Not Connecting

- Ensure backend is running on port 3000
- Check browser console for connection errors
- Verify CORS settings in `websocket.ts`

---

## License

MIT

---

## Contributors

Built with modern best practices for scalable SaaS applications.
