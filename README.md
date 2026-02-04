# Task & Project Management Tool - Backend API

A NestJS-based RESTful API for task and project management with real-time chat functionality.

## Features

- 🔐 JWT Authentication with refresh tokens
- 👥 User management
- 📁 Project & workspace management
- ✅ Task CRUD with assignments, labels, and priorities
- 💬 Real-time project chat (WebSocket)
- 📎 File upload/download
- ⏱️ Time logging
- 📊 Activity logs & reporting
- 🔒 Role-based access control

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Real-time**: Socket.io
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd task-manager-api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=task_manager

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760
```

## Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE task_manager;"

# Run migrations (auto-sync in development)
npm run start:dev
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## API Documentation

Once the application is running, access Swagger documentation at:
```
http://localhost:3000/docs
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/refresh` | Refresh tokens |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/change-password` | Change password |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/me` | Get current user profile |
| PUT | `/api/v1/users/me` | Update profile |
| GET | `/api/v1/users/search` | Search users |
| GET | `/api/v1/users/:id` | Get user by ID |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects` | List user projects |
| GET | `/api/v1/projects/:id` | Get project details |
| PUT | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |
| GET | `/api/v1/projects/:id/members` | Get project members |
| POST | `/api/v1/projects/:id/members` | Add member |
| PUT | `/api/v1/projects/:id/members/:memberId` | Update member role |
| DELETE | `/api/v1/projects/:id/members/:memberId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/:projectId/tasks` | Create task |
| GET | `/api/v1/projects/:projectId/tasks` | List tasks |
| GET | `/api/v1/projects/:projectId/tasks/calendar` | Calendar view |
| GET | `/api/v1/projects/:projectId/tasks/stats` | Task statistics |
| GET | `/api/v1/projects/:projectId/tasks/:id` | Get task details |
| PUT | `/api/v1/projects/:projectId/tasks/:id` | Update task |
| DELETE | `/api/v1/projects/:projectId/tasks/:id` | Delete task |
| POST | `/api/v1/projects/:projectId/tasks/:id/assign` | Assign task |

### Labels
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/:projectId/labels` | Create label |
| GET | `/api/v1/projects/:projectId/labels` | List labels |
| PUT | `/api/v1/projects/:projectId/labels/:id` | Update label |
| DELETE | `/api/v1/projects/:projectId/labels/:id` | Delete label |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks/:taskId/comments` | Add comment |
| GET | `/api/v1/tasks/:taskId/comments` | List comments |
| PUT | `/api/v1/comments/:id` | Update comment |
| DELETE | `/api/v1/comments/:id` | Delete comment |

### Time Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks/:taskId/time-logs` | Log time |
| GET | `/api/v1/tasks/:taskId/time-logs` | Task time logs |
| GET | `/api/v1/projects/:projectId/time-logs` | Project time logs |
| GET | `/api/v1/projects/:projectId/time-logs/report` | Time report |
| PUT | `/api/v1/time-logs/:id` | Update time log |
| DELETE | `/api/v1/time-logs/:id` | Delete time log |

### Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/:projectId/files` | Upload file |
| GET | `/api/v1/projects/:projectId/files` | List files |
| GET | `/api/v1/projects/:projectId/files/:id` | Get file info |
| GET | `/api/v1/projects/:projectId/files/:id/download` | Download file |
| DELETE | `/api/v1/projects/:projectId/files/:id` | Delete file |

### Messages (Chat)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/:projectId/messages` | Send message |
| GET | `/api/v1/projects/:projectId/messages` | List messages |
| GET | `/api/v1/projects/:projectId/messages/recent` | Recent messages |

### Activity Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects/:projectId/activity` | Project activity |
| GET | `/api/v1/projects/:projectId/activity/recent` | Recent activity |
| GET | `/api/v1/users/me/activity` | User activity |

### Roles
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/roles` | Create role |
| GET | `/api/v1/roles` | List roles |
| GET | `/api/v1/roles/:id` | Get role |
| PUT | `/api/v1/roles/:id` | Update role |
| DELETE | `/api/v1/roles/:id` | Delete role |

## WebSocket Events (Chat)

Connect to: `ws://localhost:3000/chat`

### Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `joinProject` | Client → Server | Join project chat room |
| `leaveProject` | Client → Server | Leave project chat room |
| `sendMessage` | Client → Server | Send a message |
| `newMessage` | Server → Client | New message broadcast |

## Project Structure

```
src/
├── common/
│   ├── constants/          # Enums and constants
│   ├── decorators/         # Custom decorators
│   ├── dto/                # Shared DTOs
│   ├── entities/           # Base entities
│   ├── filters/            # Exception filters
│   └── interceptors/       # Response interceptors
├── config/                 # Configuration
├── modules/
│   ├── auth/               # Authentication
│   ├── users/              # User management
│   ├── projects/           # Project management
│   ├── tasks/              # Task management
│   ├── comments/           # Task comments
│   ├── time-logs/          # Time tracking
│   ├── files/              # File management
│   ├── messages/           # Chat messages
│   ├── activity-logs/      # Activity audit
│   └── roles/              # Role management
├── app.module.ts
└── main.ts
```

## Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## License

MIT
