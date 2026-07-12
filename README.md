# AssetFlow — Enterprise Asset & Resource Management System

> A full-stack enterprise platform for managing assets, facilities, bookings, maintenance workflows, and organizational resources — built with a modern monorepo architecture.

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs)
![Prisma](https://img.shields.io/badge/Prisma-6.9-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)

---

## Architecture

```
odoo-hackathon-2026/
├── packages/shared/          # Shared types, enums, barrel exports
├── backend/                  # Express + Prisma API
│   ├── prisma/schema.prisma  # 14-model source-of-truth schema
│   └── src/
│       ├── modules/
│       │   ├── auth/         # Auth & user management
│       │   ├── organization/ # Departments, categories, facilities
│       │   ├── asset/        # Asset CRUD & lifecycle
│       │   ├── booking/      # Resource & facility bookings
│       │   └── maintenance/  # Maintenance, audits, dashboard, reports
│       ├── middleware/       # Auth JWT + error handler
│       ├── config/           # Prisma singleton
│       └── seed.ts           # Demo data
├── frontend/                 # React + Vite + Ant Design
│   └── src/
│       ├── pages/            # All UI pages
│       ├── layouts/          # App shell
│       ├── context/          # Auth context
│       └── api/              # Axios client
├── docker-compose.yml        # PostgreSQL + Backend + Frontend
└── .env.example              # Environment variables
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Ant Design 5, Recharts, React Query |
| Backend | Express.js, TypeScript, Zod validation |
| Database | PostgreSQL 16 via Prisma ORM |
| Auth | JWT + bcrypt |
| Orchestration | Docker Compose |
| Monorepo | npm workspaces |

## Quick Start

### 1. Clone & Install
```bash
git clone <repo-url>
cd odoo-hackathon-2026
npm install
```

### 2. Start Database
```bash
docker-compose up -d postgres
```

### 3. Setup Backend
```bash
cp .env.example .env
cd backend
npx prisma migrate dev --name init
npx prisma generate
npm run db:seed
npm run dev
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Open
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health check: http://localhost:3001/api/health

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@assetflow.com | admin123 |
| Manager | manager@assetflow.com | manager123 |
| Employee | arya@assetflow.com | password123 |

## API Endpoints

### Auth (`/api/auth`)
- `POST /signup` — Register new user
- `POST /login` — Authenticate
- `GET /me` — Get profile (protected)
- `GET /users` — List all users (protected)
- `PUT /users/:id/role` — Update role (admin only)
- `PUT /users/:id/department` — Assign department (admin only)

### Organization (`/api/org`)
- `GET|POST /departments` — List/Create departments
- `GET|PUT|DELETE /departments/:id` — Get/Update/Delete
- `GET|POST /categories` — List/Create asset categories
- `PUT|DELETE /categories/:id` — Update/Delete
- `GET|POST /facilities` — List/Create facilities
- `PUT|DELETE /facilities/:id` — Update/Delete

### Assets (`/api/assets`) — *Member 2*
### Bookings (`/api/bookings`) — *Member 3*
### Maintenance (`/api/maintenance`) — *Member 3*
### Dashboard (`/api/dashboard`) — *Member 4*
### Reports (`/api/reports`) — *Member 4*
### Notifications (`/api/notifications`) — *Member 4*

## Team

| Member | Domain | Branch |
|--------|--------|--------|
| Member 1 | Auth, Organization, Scaffold | `feature/auth-org-scaffold` |
| Member 2 | Asset Management | `feature/asset-management` |
| Member 3 | Bookings & Maintenance | `feature/booking-maintenance` |
| Member 4 | Dashboard, Reports, Audit | `feature/dashboard-reports` |

## Git Workflow

1. Member 1 merges `feature/auth-org-scaffold` → `main` first (foundation)
2. Members 2, 3, 4 pull `main`, then create their branches
3. Each member works on their own files (zero merge conflicts by design)
4. Members merge in any order after Member 1

## License

MIT