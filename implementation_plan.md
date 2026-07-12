# AssetFlow — Enterprise Asset & Resource Management System
## Complete Hackathon Execution Plan (6 Hours, 4 Members)

---

## PART 1: ARCHITECTURE

### 1.1 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 18 + Vite + TypeScript | Fast HMR, type safety, component isolation |
| **UI Library** | Ant Design (antd) 5.x | Enterprise-grade components, tables, forms, Kanban, Calendar out-of-box |
| **Charts** | Recharts | Lightweight, React-native charts for analytics/heatmaps |
| **State** | React Context + React Query (TanStack Query) | Server-state caching, no Redux boilerplate |
| **Backend** | Node.js + Express + TypeScript | Fast to scaffold, shared types with frontend |
| **ORM** | Prisma | Auto-generates types, migrations, works with any SQL DB |
| **Database** | PostgreSQL (via Docker) | Relational integrity for asset/booking domains |
| **Auth** | JWT (jsonwebtoken + bcrypt) | Simple, stateless, no 3rd-party dependency |
| **Validation** | Zod | Shared schema validation between frontend & backend |
| **Monorepo** | npm workspaces | Zero-config, native Node.js, no Nx/Turbo overhead |
| **Containerization** | Docker + Docker Compose | One-command full stack startup |

### 1.2 Monorepo Directory Structure

```
assetflow/
├── docker-compose.yml            # Full stack orchestration
├── package.json                  # Workspace root
├── tsconfig.base.json            # Shared TS config
├── .env.example                  # Environment template
├── .gitignore
├── README.md
│
├── packages/
│   └── shared/                   # ← MEMBER 1 creates, ALL reference
│       ├── package.json
│       ├── src/
│       │   ├── types/            # Shared TypeScript interfaces
│       │   │   ├── auth.types.ts
│       │   │   ├── asset.types.ts
│       │   │   ├── booking.types.ts
│       │   │   ├── maintenance.types.ts
│       │   │   └── common.types.ts
│       │   ├── constants/
│       │   │   ├── enums.ts      # ALL enums: AssetStatus, BookingStatus, etc.
│       │   │   └── roles.ts
│       │   └── validators/
│       │       └── schemas.ts    # Zod schemas
│       └── tsconfig.json
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── prisma/
│   │   └── schema.prisma         # ← MEMBER 1 creates FULL schema (Hour 0-1)
│   └── src/
│       ├── index.ts              # ← MEMBER 1 (Express app entry, CORS, middleware)
│       ├── middleware/
│       │   ├── auth.middleware.ts       # ← MEMBER 1
│       │   └── errorHandler.ts         # ← MEMBER 1
│       ├── config/
│       │   └── db.ts                   # ← MEMBER 1 (Prisma client singleton)
│       │
│       ├── modules/
│       │   ├── auth/                   # ← MEMBER 1 ONLY
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.routes.ts
│       │   │   └── auth.validators.ts
│       │   │
│       │   ├── organization/           # ← MEMBER 1 ONLY
│       │   │   ├── org.controller.ts
│       │   │   ├── org.service.ts
│       │   │   ├── org.routes.ts
│       │   │   └── org.validators.ts
│       │   │
│       │   ├── asset/                  # ← MEMBER 2 ONLY
│       │   │   ├── asset.controller.ts
│       │   │   ├── asset.service.ts
│       │   │   ├── asset.routes.ts
│       │   │   └── asset.validators.ts
│       │   │
│       │   ├── booking/               # ← MEMBER 3 ONLY
│       │   │   ├── booking.controller.ts
│       │   │   ├── booking.service.ts
│       │   │   ├── booking.routes.ts
│       │   │   └── booking.validators.ts
│       │   │
│       │   └── maintenance/           # ← MEMBER 4 ONLY
│       │       ├── maintenance.controller.ts
│       │       ├── maintenance.service.ts
│       │       ├── maintenance.routes.ts
│       │       ├── audit.controller.ts
│       │       ├── audit.service.ts
│       │       ├── audit.routes.ts
│       │       ├── dashboard.controller.ts
│       │       ├── dashboard.service.ts
│       │       ├── dashboard.routes.ts
│       │       ├── report.controller.ts
│       │       ├── report.service.ts
│       │       ├── report.routes.ts
│       │       ├── notification.controller.ts
│       │       ├── notification.service.ts
│       │       ├── notification.routes.ts
│       │       └── maintenance.validators.ts
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx              # ← MEMBER 1
│       ├── App.tsx               # ← MEMBER 1 (Router shell only)
│       ├── api/
│       │   └── client.ts         # ← MEMBER 1 (Axios instance with JWT interceptor)
│       ├── context/
│       │   └── AuthContext.tsx    # ← MEMBER 1
│       ├── components/
│       │   └── layout/
│       │       ├── AppLayout.tsx     # ← MEMBER 1 (Sidebar + Header shell)
│       │       ├── Sidebar.tsx       # ← MEMBER 1
│       │       └── ProtectedRoute.tsx # ← MEMBER 1
│       │
│       ├── pages/
│       │   ├── auth/                 # ← MEMBER 1 ONLY
│       │   │   ├── LoginPage.tsx
│       │   │   └── SignupPage.tsx
│       │   │
│       │   ├── organization/         # ← MEMBER 1 ONLY
│       │   │   └── OrganizationSetupPage.tsx
│       │   │
│       │   ├── assets/               # ← MEMBER 2 ONLY
│       │   │   ├── AssetDirectoryPage.tsx
│       │   │   ├── AssetRegistrationForm.tsx
│       │   │   ├── AssetDetailPage.tsx
│       │   │   └── AllocationTransferPage.tsx
│       │   │
│       │   ├── booking/              # ← MEMBER 3 ONLY
│       │   │   ├── ResourceBookingPage.tsx
│       │   │   ├── BookingCalendar.tsx
│       │   │   └── BookingForm.tsx
│       │   │
│       │   └── maintenance/          # ← MEMBER 4 ONLY
│       │       ├── DashboardPage.tsx
│       │       ├── MaintenanceKanbanPage.tsx
│       │       ├── AuditPage.tsx
│       │       ├── ReportsPage.tsx
│       │       └── NotificationsPage.tsx
│       │
│       └── hooks/                    # Each member adds THEIR own hooks
│           ├── useAuth.ts            # ← MEMBER 1
│           ├── useAssets.ts          # ← MEMBER 2
│           ├── useBookings.ts        # ← MEMBER 3
│           └── useMaintenance.ts     # ← MEMBER 4
```

> [!IMPORTANT]
> **Zero-Overlap Guarantee**: Every file belongs to exactly ONE member. The only shared files (`schema.prisma`, `index.ts`, `App.tsx`, `Sidebar.tsx`, `shared/types`) are created by Member 1 in Hour 0-1 **BEFORE** anyone else starts coding. After that, Member 1 never touches those files again, and others only **import from** them, never modify them.

### 1.3 Database Schema (Complete Prisma Schema)

This is the FULL `schema.prisma` that **Member 1** will create. Every other member reads from it but never modifies it.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =================== AUTH & ORG DOMAIN (Member 1) ===================

enum Role {
  ADMIN
  MANAGER
  EMPLOYEE
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  role          Role     @default(EMPLOYEE)
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  allocatedAssets   AssetAllocation[] @relation("AllocatedTo")
  approvedAllocations AssetAllocation[] @relation("ApprovedBy")
  bookings          Booking[]
  maintenanceRequests MaintenanceRequest[] @relation("RequestedBy")
  assignedMaintenance MaintenanceRequest[] @relation("AssignedTo")
  conductedAudits   Audit[]
  notifications     Notification[]
  activityLogs      ActivityLog[]
}

model Department {
  id        String   @id @default(uuid())
  name      String   @unique
  headName  String?
  parentId  String?
  parent    Department? @relation("DeptHierarchy", fields: [parentId], references: [id])
  children  Department[] @relation("DeptHierarchy")
  status    String   @default("Active") // Active, Inactive
  createdAt DateTime @default(now())

  users  User[]
  assets AssetAllocation[]
}

model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())

  assets Asset[]
}

model Facility {
  id        String   @id @default(uuid())
  name      String   @unique
  type      String   // Room, Lab, etc.
  capacity  Int?
  location  String?
  createdAt DateTime @default(now())

  bookings Booking[]
}

// =================== ASSET DOMAIN (Member 2) ===================

enum AssetStatus {
  AVAILABLE
  ALLOCATED
  RESERVED
  UNDER_MAINTENANCE
  RETIRED
}

enum AssetCondition {
  NEW
  GOOD
  FAIR
  NEEDS_REPAIR
  DECOMMISSIONED
}

model Asset {
  id            String        @id @default(uuid())
  tag           String        @unique  // e.g., AF-0016
  name          String
  categoryId    String
  category      Category      @relation(fields: [categoryId], references: [id])
  status        AssetStatus   @default(AVAILABLE)
  condition     AssetCondition @default(NEW)
  location      String?
  purchaseDate  DateTime?
  purchaseCost  Decimal?      @db.Decimal(12,2)
  warrantyExpiry DateTime?
  serialNumber  String?
  qrCode        String?       @unique
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  allocations       AssetAllocation[]
  bookings          Booking[]
  maintenanceRequests MaintenanceRequest[]
  auditItems        AuditItem[]
}

model AssetAllocation {
  id              String   @id @default(uuid())
  assetId         String
  asset           Asset    @relation(fields: [assetId], references: [id])
  allocatedToId   String
  allocatedTo     User     @relation("AllocatedTo", fields: [allocatedToId], references: [id])
  departmentId    String?
  department      Department? @relation(fields: [departmentId], references: [id])
  approvedById    String?
  approvedBy      User?    @relation("ApprovedBy", fields: [approvedById], references: [id])
  allocationType  String   // ALLOCATE, TRANSFER, RETURN
  status          String   @default("PENDING") // PENDING, APPROVED, REJECTED
  reason          String?
  allocatedAt     DateTime @default(now())
  returnedAt      DateTime?
}

// =================== BOOKING DOMAIN (Member 3) ===================

enum BookingStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

model Booking {
  id          String        @id @default(uuid())
  assetId     String?
  asset       Asset?        @relation(fields: [assetId], references: [id])
  facilityId  String?
  facility    Facility?     @relation(fields: [facilityId], references: [id])
  bookedById  String
  bookedBy    User          @relation(fields: [bookedById], references: [id])
  title       String
  purpose     String?
  startTime   DateTime
  endTime     DateTime
  isRecurring Boolean       @default(false)
  recurRule   String?       // iCal RRULE string
  status      BookingStatus @default(UPCOMING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

// =================== MAINTENANCE & AUDIT DOMAIN (Member 4) ===================

enum MaintenanceStatus {
  PENDING
  APPROVED
  TECHNICIAN_ASSIGNED
  IN_PROGRESS
  RESOLVED
}

enum MaintenancePriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum MaintenanceType {
  PREVENTIVE
  CORRECTIVE
  EMERGENCY
}

model MaintenanceRequest {
  id             String              @id @default(uuid())
  assetId        String
  asset          Asset               @relation(fields: [assetId], references: [id])
  requestedById  String
  requestedBy    User                @relation("RequestedBy", fields: [requestedById], references: [id])
  assignedToId   String?
  assignedTo     User?               @relation("AssignedTo", fields: [assignedToId], references: [id])
  type           MaintenanceType     @default(CORRECTIVE)
  priority       MaintenancePriority @default(MEDIUM)
  status         MaintenanceStatus   @default(PENDING)
  description    String
  resolutionNote String?
  cost           Decimal?            @db.Decimal(12,2)
  requestedAt    DateTime            @default(now())
  resolvedAt     DateTime?
}

model Audit {
  id            String     @id @default(uuid())
  title         String     // e.g., "Q3 Audit: Engineering Dept"
  departmentId  String?
  conductedById String
  conductedBy   User       @relation(fields: [conductedById], references: [id])
  scheduledDate DateTime
  completedDate DateTime?
  status        String     @default("SCHEDULED") // SCHEDULED, IN_PROGRESS, COMPLETED
  notes         String?
  createdAt     DateTime   @default(now())

  items AuditItem[]
}

model AuditItem {
  id              String   @id @default(uuid())
  auditId         String
  audit           Audit    @relation(fields: [auditId], references: [id])
  assetId         String
  asset           Asset    @relation(fields: [assetId], references: [id])
  expectedLocation String?
  actualLocation   String?
  expectedCondition String?
  actualCondition   String?
  isVerified      Boolean  @default(false)
  discrepancyNote String?
  checkedAt       DateTime?
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // ALERT, APPROVAL, BOOKING, MAINTENANCE, AUDIT
  title     String
  message   String
  isRead    Boolean  @default(false)
  link      String?  // Deep-link path
  createdAt DateTime @default(now())
}

model ActivityLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // ASSET_REGISTERED, BOOKING_CREATED, etc.
  entityType String   // Asset, Booking, Maintenance, etc.
  entityId   String
  details    String?
  createdAt  DateTime @default(now())
}
```

### 1.4 Shared Enums & Types (packages/shared)

```typescript
// packages/shared/src/constants/enums.ts

export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  ALLOCATED = 'ALLOCATED',
  RESERVED = 'RESERVED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum BookingStatus {
  UPCOMING = 'UPCOMING',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  TECHNICIAN_ASSIGNED = 'TECHNICIAN_ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum AllocationType {
  ALLOCATE = 'ALLOCATE',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
}

export enum AllocationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
```

### 1.5 API Route Map (Complete)

| Domain | Method | Route | Owner |
|---|---|---|---|
| **Auth** | POST | `/api/auth/signup` | M1 |
| | POST | `/api/auth/login` | M1 |
| | GET | `/api/auth/me` | M1 |
| **Organization** | GET/POST | `/api/org/departments` | M1 |
| | PUT/DELETE | `/api/org/departments/:id` | M1 |
| | GET/POST | `/api/org/categories` | M1 |
| | PUT/DELETE | `/api/org/categories/:id` | M1 |
| | GET/POST | `/api/org/facilities` | M1 |
| | PUT/DELETE | `/api/org/facilities/:id` | M1 |
| | GET | `/api/org/users` | M1 |
| | PUT | `/api/org/users/:id/role` | M1 |
| **Assets** | GET | `/api/assets` (filters: tag, name, category, status, location, department) | M2 |
| | POST | `/api/assets` | M2 |
| | GET | `/api/assets/:id` | M2 |
| | PUT | `/api/assets/:id` | M2 |
| | DELETE | `/api/assets/:id` | M2 |
| | POST | `/api/assets/:id/allocate` | M2 |
| | POST | `/api/assets/:id/transfer` | M2 |
| | POST | `/api/assets/:id/return` | M2 |
| | PUT | `/api/assets/allocations/:id/approve` | M2 |
| | GET | `/api/assets/:id/allocation-history` | M2 |
| **Bookings** | GET | `/api/bookings` (filters: date, facilityId, assetId, status) | M3 |
| | POST | `/api/bookings` | M3 |
| | GET | `/api/bookings/:id` | M3 |
| | PUT | `/api/bookings/:id` | M3 |
| | DELETE | `/api/bookings/:id/cancel` | M3 |
| | GET | `/api/bookings/availability` (query: resourceId, date) | M3 |
| | POST | `/api/bookings/check-conflict` | M3 |
| | POST | `/api/bookings/transition-ongoing` (cron/manual trigger) | M3 |
| **Maintenance** | GET | `/api/maintenance` (filters: status, priority, assetId) | M4 |
| | POST | `/api/maintenance` | M4 |
| | PUT | `/api/maintenance/:id` | M4 |
| | PUT | `/api/maintenance/:id/status` (kanban transitions) | M4 |
| | PUT | `/api/maintenance/:id/assign` | M4 |
| **Audits** | GET | `/api/audits` | M4 |
| | POST | `/api/audits` | M4 |
| | GET | `/api/audits/:id` | M4 |
| | PUT | `/api/audits/:id/items/:itemId` | M4 |
| | POST | `/api/audits/:id/generate-report` | M4 |
| **Dashboard** | GET | `/api/dashboard/overview` | M4 |
| | GET | `/api/dashboard/recent-activity` | M4 |
| **Reports** | GET | `/api/reports/utilization-by-department` | M4 |
| | GET | `/api/reports/maintenance-frequency` | M4 |
| | GET | `/api/reports/most-used-assets` | M4 |
| | GET | `/api/reports/idle-assets` | M4 |
| | GET | `/api/reports/assets-due-maintenance` | M4 |
| | GET | `/api/reports/department-allocation-summary` | M4 |
| | GET | `/api/reports/booking-heatmap` | M4 |
| | POST | `/api/reports/export` | M4 |
| **Notifications** | GET | `/api/notifications` (filters: type, isRead) | M4 |
| | PUT | `/api/notifications/:id/read` | M4 |
| | PUT | `/api/notifications/read-all` | M4 |

---

## PART 2: GITHUB BRANCHING & COLLABORATION STRATEGY

### 2.1 Branching Model

```
main                          ← Protected, only merge via PR
  │
  ├── develop                 ← Integration branch (merge PRs here)
  │     │
  │     ├── scaffold/foundation    ← Member 1, Hour 0-1 (merged first)
  │     │
  │     ├── feature/auth-org       ← Member 1, Hour 1-5
  │     ├── feature/asset          ← Member 2, Hour 1-5
  │     ├── feature/booking        ← Member 3, Hour 1-5
  │     └── feature/maintenance    ← Member 4, Hour 1-5
  │
  └── (final PR: develop → main at Hour 5.5)
```

### 2.2 Merge Conflict Prevention Rules

| Rule | Detail |
|---|---|
| **File Ownership** | Each member ONLY creates/edits files in their module directory. NEVER touch another member's folder. |
| **Schema Lock** | `schema.prisma` is written ONCE by Member 1 in Hour 0-1 and merged to `develop`. Nobody else touches it. |
| **Router Registration** | Each member creates their own route file. Member 1 pre-registers ALL route imports in `index.ts` during scaffold phase: `app.use('/api/auth', authRoutes)` etc. Each member's route file is in their own folder — no conflict. |
| **App.tsx Routes** | Member 1 pre-registers all `<Route>` placeholders in `App.tsx` pointing to lazy-loaded pages. Each member's page file is in their own folder — no conflict. |
| **Sidebar Links** | Member 1 defines ALL sidebar navigation links upfront in `Sidebar.tsx`. Members never touch this file. |
| **Hooks Isolation** | Each member creates their OWN hook file (`useAuth.ts`, `useAssets.ts`, etc.). No shared hook file. |
| **Merge Order** | `scaffold/foundation` merges FIRST → then feature branches merge to `develop` in any order (no conflicts since files don't overlap). |

### 2.3 Git Workflow Commands

```bash
# Member 1 (first):
git checkout -b scaffold/foundation
# ... do scaffold work ...
git push origin scaffold/foundation
# Create PR → develop, merge immediately

# Then Member 1:
git checkout develop && git pull
git checkout -b feature/auth-org

# Members 2, 3, 4 (after scaffold merges):
git checkout develop && git pull
git checkout -b feature/asset    # Member 2
git checkout -b feature/booking  # Member 3
git checkout -b feature/maintenance  # Member 4

# Each member pushes & creates PR to develop independently
# Final: develop → main PR at the end
```

### 2.4 Commit Convention

```
feat(auth): add login/signup endpoints       # Member 1
feat(asset): implement asset registration     # Member 2
feat(booking): add conflict detection logic   # Member 3
feat(maintenance): build kanban board UI      # Member 4
```

---

## PART 3: 6-HOUR EXECUTION PLAN

### Phase 0: Pre-Game Setup (15 min before clock starts)
- Create GitHub repo, invite all members
- All members clone the repo
- Assign roles: Member 1 = Scaffold Lead

### Hour 0–1: Foundation & Scaffold (MEMBER 1 SOLO, others wait or study wireframes)

> [!IMPORTANT]
> **This is the most critical hour.** Member 1 builds the entire skeleton. Members 2-4 should review the wireframes, study their prompts, and prepare their local environments (install Node, Docker, Postgres).

**Member 1 delivers:**
- [x] `docker-compose.yml` (Postgres + backend + frontend)
- [x] Root `package.json` with workspaces
- [x] `packages/shared/` with all types, enums, constants
- [x] `backend/` scaffold: Express app, middleware, Prisma schema, DB config
- [x] `backend/src/index.ts` with ALL route imports pre-wired (even if files don't exist yet — they export empty routers)
- [x] `frontend/` scaffold: Vite + React + Ant Design, router, layout shell, sidebar, all route paths, protected route wrapper, Axios client with JWT interceptor, AuthContext
- [x] Run `npx prisma migrate dev` to generate DB
- [x] Push to `scaffold/foundation`, merge to `develop`

**Milestone ✅**: All members can `git pull develop`, run `docker-compose up`, and see a working login shell with sidebar navigation.

### Hour 1–4: Core Feature Development (ALL 4 MEMBERS IN PARALLEL)

Each member works on their feature branch independently:

| Member | Hour 1-2 | Hour 2-3 | Hour 3-4 |
|---|---|---|---|
| **M1** | Auth: signup, login, JWT, password hash, `/me` endpoint, LoginPage, SignupPage | Organization: Departments CRUD + Categories CRUD + Facilities CRUD, OrganizationSetupPage with tabs & tables | User management page, role assignment, polish auth flows |
| **M2** | Asset model service: register, list (with filters), get by ID, update, delete. AssetDirectoryPage with search/filters/table | Asset allocation: allocate, double-allocation block, transfer request with approval flow. AllocationTransferPage | Asset detail page, allocation history, QR code display, "Reserved" state logic, AssetRegistrationForm modal |
| **M3** | Booking service: create, list, get, cancel. Overlap detection with back-to-back allowance (`startTime < existingEnd AND endTime > existingStart` but `=` allowed). ResourceBookingPage | Calendar UI: timeline view per resource, visual slot blocks with color-coded status, conflict warning display. BookingCalendar component | "Ongoing" state transition logic (cron or on-access check: if `now >= startTime && now < endTime` → ONGOING). Recurring booking support. BookingForm |
| **M4** | Maintenance: create request, list, update status. Kanban board page with drag-and-drop (antd compatible). MaintenanceKanbanPage | Audit: create audit, add items, verify checklist, auto-generate discrepancy report. AuditPage | Dashboard (overview stats, recent activity, quick actions), Reports (all 7 reports), Notifications. DashboardPage, ReportsPage, NotificationsPage |

**Milestone ✅ (Hour 4)**: Each member has a functioning feature with backend APIs + frontend pages.

### Hour 4–5: Integration & Cross-Domain Wiring

| Member | Task |
|---|---|
| **M1** | Verify auth works E2E: signup → login → access protected routes. Seed demo data (admin user, departments, categories, facilities). Test role-based access. |
| **M2** | Verify asset allocation sets status to ALLOCATED/RESERVED. Test double-allocation prevention. Ensure asset status changes to UNDER_MAINTENANCE when maintenance is raised (coordinate with M4 via API contract). |
| **M3** | Full E2E booking flow: select resource → see calendar → book slot → see conflict if overlap → allow back-to-back. Verify ONGOING transition. |
| **M4** | Wire dashboard to pull real data from all domains. Wire quick action buttons (Register Asset → M2's page, Book Resource → M3's page, Raise Maintenance → M4's form). Hook up notification creation triggers. Complete all 7 reports with real queries. |

**Milestone ✅ (Hour 5)**: Full E2E app with real data flowing between domains.

### Hour 5–5.5: Polish & Demo Prep

| Task | Owner |
|---|---|
| Seed comprehensive demo data | M1 |
| UI polish: loading states, empty states, error handling, form validations | ALL |
| Final PR: merge all feature branches → develop → main | M1 (coordinator) |
| Test the app end-to-end on a fresh clone | ALL |
| Write/update README with setup instructions, screenshots | M1 |

### Hour 5.5–6: Demo & Submission

- Record a 3-5 minute demo video (if required)
- Write submission notes
- Final commit and tag: `git tag v1.0.0`

---

## PART 4: DETAILED AGENTIC PROMPTS

---

### 🔷 PROMPT FOR MEMBER 1: Auth, Users, Organization & Scaffold

```
You are a senior full-stack engineer building the FOUNDATION and AUTH/ORG domain 
for "AssetFlow" — an Enterprise Asset & Resource Management System.

═══════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════
- Backend: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
- Frontend: React 18 + Vite + TypeScript + Ant Design 5.x
- Auth: JWT (jsonwebtoken) + bcrypt
- Monorepo: npm workspaces
- Validation: Zod

═══════════════════════════════════════════════════════════════
YOUR ROLE & DIRECTORY BOUNDARIES
═══════════════════════════════════════════════════════════════
You own these directories EXCLUSIVELY:
  backend/src/modules/auth/
  backend/src/modules/organization/
  frontend/src/pages/auth/
  frontend/src/pages/organization/
  frontend/src/hooks/useAuth.ts
  frontend/src/components/layout/
  frontend/src/context/AuthContext.tsx
  frontend/src/api/client.ts
  frontend/src/App.tsx
  frontend/src/main.tsx

You ALSO create the ONE-TIME scaffold files (these are created once, then 
NEVER modified by you or anyone else after Hour 1):
  packages/shared/ (entire directory)
  backend/prisma/schema.prisma
  backend/src/index.ts
  backend/src/middleware/
  backend/src/config/
  docker-compose.yml
  Root package.json, tsconfig.base.json, .env.example

⛔ STRICT CONSTRAINT: After the scaffold phase, NEVER modify schema.prisma, 
   index.ts route registrations, App.tsx route definitions, or Sidebar.tsx. 
   These are frozen after initial creation.

═══════════════════════════════════════════════════════════════
PHASE 1: SCAFFOLD (Do this FIRST, ~60 minutes)
═══════════════════════════════════════════════════════════════

1. Create root package.json with npm workspaces:
   {
     "name": "assetflow",
     "private": true,
     "workspaces": ["packages/*", "backend", "frontend"]
   }

2. Create packages/shared/:
   - src/constants/enums.ts — ALL enums:
     AssetStatus (AVAILABLE, ALLOCATED, RESERVED, UNDER_MAINTENANCE, RETIRED)
     BookingStatus (UPCOMING, ONGOING, COMPLETED, CANCELLED)
     MaintenanceStatus (PENDING, APPROVED, TECHNICIAN_ASSIGNED, IN_PROGRESS, RESOLVED)
     MaintenancePriority (LOW, MEDIUM, HIGH, CRITICAL)
     MaintenanceType (PREVENTIVE, CORRECTIVE, EMERGENCY)
     UserRole (ADMIN, MANAGER, EMPLOYEE)
     AllocationType (ALLOCATE, TRANSFER, RETURN)
     AllocationStatus (PENDING, APPROVED, REJECTED)
   
   - src/types/ — TypeScript interfaces for ALL domains:
     auth.types.ts: LoginRequest, SignupRequest, AuthResponse, UserProfile
     asset.types.ts: Asset, AssetAllocation, CreateAssetRequest, AllocateAssetRequest
     booking.types.ts: Booking, CreateBookingRequest, BookingConflictCheck
     maintenance.types.ts: MaintenanceRequest, Audit, AuditItem, Notification, ActivityLog
     common.types.ts: PaginatedResponse, ApiError, DashboardOverview

3. Create backend/:
   - package.json with dependencies: express, @prisma/client, prisma, jsonwebtoken, 
     bcrypt, cors, dotenv, zod, node-cron
     devDependencies: typescript, @types/*, ts-node-dev, nodemon
   - tsconfig.json
   - Dockerfile (Node 20 alpine, copy, install, prisma generate, run)
   - prisma/schema.prisma — THE COMPLETE SCHEMA (copy from architecture doc above, 
     all models: User, Department, Category, Facility, Asset, AssetAllocation, 
     Booking, MaintenanceRequest, Audit, AuditItem, Notification, ActivityLog)
   - src/config/db.ts: Prisma client singleton export
   - src/middleware/auth.middleware.ts: JWT verification middleware, extracts userId 
     and role from token, attaches to req
   - src/middleware/errorHandler.ts: Global error handler middleware
   - src/index.ts: Express app setup with:
     • CORS enabled
     • JSON body parser
     • Route registrations for ALL domains:
       app.use('/api/auth', authRoutes)
       app.use('/api/org', orgRoutes)
       app.use('/api/assets', assetRoutes)
       app.use('/api/bookings', bookingRoutes)
       app.use('/api/maintenance', maintenanceRoutes)
       app.use('/api/audits', auditRoutes)
       app.use('/api/dashboard', dashboardRoutes)
       app.use('/api/reports', reportRoutes)
       app.use('/api/notifications', notificationRoutes)
     • Import from each module's routes file. For modules you don't own 
       (asset, booking, maintenance), create STUB route files that export 
       an empty Router(). Place these stubs IN THE CORRECT MODULE FOLDERS 
       so other members can replace them.

     IMPORTANT: Create these stub files:
       backend/src/modules/asset/asset.routes.ts → export default Router()
       backend/src/modules/booking/booking.routes.ts → export default Router()
       backend/src/modules/maintenance/maintenance.routes.ts → export default Router()
       backend/src/modules/maintenance/audit.routes.ts → export default Router()
       backend/src/modules/maintenance/dashboard.routes.ts → export default Router()
       backend/src/modules/maintenance/report.routes.ts → export default Router()
       backend/src/modules/maintenance/notification.routes.ts → export default Router()

4. Create frontend/:
   - Initialize with: npx create-vite@latest ./ --template react-ts
   - Install: antd, @ant-design/icons, react-router-dom, axios, @tanstack/react-query, 
     recharts, dayjs
   - vite.config.ts: proxy /api to backend (http://localhost:3001)
   - src/api/client.ts: Axios instance with baseURL '/api', interceptor that 
     adds Authorization: Bearer <token> from localStorage
   - src/context/AuthContext.tsx: React context that holds user, token, 
     login/logout/signup functions, isAuthenticated boolean
   - src/hooks/useAuth.ts: Custom hook wrapping AuthContext
   - src/components/layout/AppLayout.tsx: Ant Design Layout with Sider + Content, 
     wraps children
   - src/components/layout/Sidebar.tsx: Ant Design Menu with ALL navigation items:
     • Dashboard (path: /)
     • Organization Setup (path: /organization) [Admin only]
     • Assets (path: /assets)
     • Allocation & Transfer (path: /assets/allocations)
     • Resource Booking (path: /booking)
     • Maintenance (path: /maintenance)
     • Audit (path: /audit)
     • Reports (path: /reports)
     • Notifications (path: /notifications)
   - src/components/layout/ProtectedRoute.tsx: Redirects to /login if not authenticated
   - src/App.tsx: React Router with ALL routes defined:
     /login → LoginPage
     /signup → SignupPage
     / → DashboardPage (lazy)
     /organization → OrganizationSetupPage (lazy)
     /assets → AssetDirectoryPage (lazy)
     /assets/register → AssetRegistrationForm (lazy)
     /assets/:id → AssetDetailPage (lazy)
     /assets/allocations → AllocationTransferPage (lazy)
     /booking → ResourceBookingPage (lazy)
     /maintenance → MaintenanceKanbanPage (lazy)
     /audit → AuditPage (lazy)
     /reports → ReportsPage (lazy)
     /notifications → NotificationsPage (lazy)
     
     For pages you don't own, create STUB page files that render a 
     placeholder <div>Coming Soon</div>. Place them in the correct 
     directories so other members can replace them:
       frontend/src/pages/assets/AssetDirectoryPage.tsx
       frontend/src/pages/assets/AssetRegistrationForm.tsx
       frontend/src/pages/assets/AssetDetailPage.tsx
       frontend/src/pages/assets/AllocationTransferPage.tsx
       frontend/src/pages/booking/ResourceBookingPage.tsx
       frontend/src/pages/booking/BookingCalendar.tsx
       frontend/src/pages/booking/BookingForm.tsx
       frontend/src/pages/maintenance/DashboardPage.tsx
       frontend/src/pages/maintenance/MaintenanceKanbanPage.tsx
       frontend/src/pages/maintenance/AuditPage.tsx
       frontend/src/pages/maintenance/ReportsPage.tsx
       frontend/src/pages/maintenance/NotificationsPage.tsx
   
   - src/main.tsx: Wrap App in QueryClientProvider and AuthProvider

5. Create docker-compose.yml:
   services:
     db:
       image: postgres:16-alpine
       environment: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB
       ports: 5432:5432
       volumes: pgdata:/var/lib/postgresql/data
     backend:
       build: ./backend
       ports: 3001:3001
       depends_on: db
       environment: DATABASE_URL, JWT_SECRET
     frontend:
       build: ./frontend
       ports: 3000:3000
       depends_on: backend

6. Create .env.example:
   DATABASE_URL=postgresql://assetflow:assetflow@localhost:5432/assetflow
   JWT_SECRET=assetflow-hackathon-secret-key-2026
   PORT=3001

7. Run prisma migrate and verify the app starts.

8. Commit to scaffold/foundation branch, push, create PR to develop, merge.

═══════════════════════════════════════════════════════════════
PHASE 2: AUTH & ORGANIZATION FEATURES (After scaffold merge)
═══════════════════════════════════════════════════════════════

Switch to feature/auth-org branch.

### Auth Module (backend/src/modules/auth/)

auth.service.ts:
  - signup(email, password, name): Hash password with bcrypt(10 rounds), 
    create User with role EMPLOYEE, return JWT token
  - login(email, password): Find user by email, compare password, return JWT 
    with payload { userId, role, email }
  - getProfile(userId): Return user with department populated

auth.controller.ts:
  - POST /signup: Validate with Zod, call service, return { token, user }
  - POST /login: Validate, call service, return { token, user }
  - GET /me: Use auth middleware, call getProfile

auth.routes.ts:
  - Wire controllers, apply auth middleware to /me

auth.validators.ts:
  - signupSchema: email (email format), password (min 6), name (min 2)
  - loginSchema: email, password

### Organization Module (backend/src/modules/organization/)

org.service.ts:
  - Departments: list (with parent/children), create, update, delete (soft), 
    toggle active/inactive
  - Categories: list, create, update, delete
  - Facilities: list, create, update, delete
  - Users: list (with department), updateRole

org.controller.ts:
  - All CRUD endpoints for departments, categories, facilities
  - GET /users, PUT /users/:id/role (admin only)

org.routes.ts:
  - All routes with auth middleware
  - Admin-only routes use role check middleware

### Frontend Pages

frontend/src/pages/auth/LoginPage.tsx:
  - Ant Design Card centered on page
  - Form with Email + Password fields
  - "Create Account" link to /signup
  - "Forgot Password" link (non-functional, just UI)
  - On submit: call login API, store token, redirect to /
  - Match wireframe Screen 1 exactly: centered card with "AssetFlow - login" header, 
    AF logo placeholder, form fields

frontend/src/pages/auth/SignupPage.tsx:
  - Form: Name, Email, Password, Confirm Password
  - Info text: "Sign up creates an employee account, admin roles assigned later"
  - On submit: call signup API, redirect to login

frontend/src/pages/organization/OrganizationSetupPage.tsx:
  - Match wireframe Screen 3 exactly
  - Three tabs: "Departments", "Categories", "Facilities"
  - Departments tab:
    • Table with columns: Department, Head, Parent Dept, Status (Active tag)
    • "+ Add" button → modal with form
    • Edit/Delete actions per row
    • Status toggle Active/Inactive
  - Categories tab:
    • Simple table with Name column
    • Add/Edit/Delete
  - Facilities tab:
    • Table: Name, Type, Capacity, Location
    • Add/Edit/Delete
  - Only accessible to ADMIN role

### Seed Data Script

Create backend/src/seed.ts:
  - Create an admin user: admin@assetflow.com / admin123
  - Create 4 departments: Engineering, Marketing, Field Ops, Facilities
  - Create 5 categories: Electronics, Furniture, Projectors, Vehicles, 
    Office Supplies
  - Create 3 facilities: Conference Room B3, Main Auditorium, Lab 101
  - Add to package.json scripts: "seed": "ts-node src/seed.ts"

═══════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════
□ All API responses use consistent format: { success: true, data: ... } 
  or { success: false, error: ... }
□ JWT token expiry set to 24h
□ Password never returned in any API response
□ Role-based middleware: isAdmin, isManagerOrAdmin
□ All forms have validation with user-friendly error messages
□ Loading spinners on all async operations
□ Proper error toasts using Ant Design message component
```

---

### 🟢 PROMPT FOR MEMBER 2: Assets, Registration, Allocation & Transfer

```
You are a senior full-stack engineer building the ASSET LIFECYCLE domain for 
"AssetFlow" — an Enterprise Asset & Resource Management System.

═══════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════
- Backend: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
- Frontend: React 18 + Vite + TypeScript + Ant Design 5.x
- Validation: Zod

═══════════════════════════════════════════════════════════════
YOUR ROLE & DIRECTORY BOUNDARIES
═══════════════════════════════════════════════════════════════
You own these directories EXCLUSIVELY:
  backend/src/modules/asset/
    ├── asset.controller.ts
    ├── asset.service.ts
    ├── asset.routes.ts
    └── asset.validators.ts
  frontend/src/pages/assets/
    ├── AssetDirectoryPage.tsx
    ├── AssetRegistrationForm.tsx
    ├── AssetDetailPage.tsx
    └── AllocationTransferPage.tsx
  frontend/src/hooks/useAssets.ts

⛔ STRICT CONSTRAINT: NEVER modify ANY file outside the directories listed 
   above. Do NOT touch schema.prisma, index.ts, App.tsx, Sidebar.tsx, or 
   any file in auth/, organization/, booking/, maintenance/ directories. 
   Import from packages/shared and backend/src/config/db.ts as needed 
   but NEVER modify them.

═══════════════════════════════════════════════════════════════
PREREQUISITE
═══════════════════════════════════════════════════════════════
Before you start, pull the develop branch. The scaffold (created by Member 1) 
provides:
  - Prisma client at backend/src/config/db.ts (import prisma from '../config/db')
  - Auth middleware at backend/src/middleware/auth.middleware.ts
  - Shared types at packages/shared
  - Stub files exist in your directories — REPLACE them with full implementations
  - Routes already wired in index.ts: app.use('/api/assets', assetRoutes)

═══════════════════════════════════════════════════════════════
DATABASE MODELS (already in schema.prisma — DO NOT MODIFY)
═══════════════════════════════════════════════════════════════

You work with these Prisma models:
  - Asset (id, tag, name, categoryId, status[AVAILABLE|ALLOCATED|RESERVED|
    UNDER_MAINTENANCE|RETIRED], condition, location, purchaseDate, purchaseCost, 
    warrantyExpiry, serialNumber, qrCode)
  - AssetAllocation (id, assetId, allocatedToId, departmentId, approvedById, 
    allocationType[ALLOCATE|TRANSFER|RETURN], status[PENDING|APPROVED|REJECTED], 
    reason, allocatedAt, returnedAt)

═══════════════════════════════════════════════════════════════
BACKEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════

### asset.service.ts

Implement these functions:

1. listAssets(filters): 
   - Accept optional filters: tag, name, categoryId, status, location, departmentId
   - Support search by tag or name (case-insensitive partial match using 
     Prisma `contains` with `mode: 'insensitive'`)
   - Include category relation
   - Return paginated results (page, limit query params)
   - Sort by createdAt desc

2. getAssetById(id):
   - Include category, current allocation (latest where returnedAt is null), 
     allocation history
   - Return 404 if not found

3. createAsset(data):
   - Auto-generate tag: "AF-" + 4-digit padded number (count existing + 1)
   - Auto-generate qrCode: "ASSETFLOW-" + tag
   - Set status = AVAILABLE
   - Validate categoryId exists
   - Return created asset

4. updateAsset(id, data):
   - Allow updating: name, categoryId, condition, location, warrantyExpiry, 
     serialNumber
   - Cannot update status directly (status is managed by allocation/maintenance flows)
   - Return updated asset

5. deleteAsset(id):
   - Soft delete: set status = RETIRED
   - Cannot delete if status is ALLOCATED (must be returned first)

6. allocateAsset(assetId, allocatedToId, departmentId, reason):
   - CRITICAL: Check asset status. If ALLOCATED → reject with error 
     "Asset is already allocated. Transfer must be requested instead."
     This is the DOUBLE-ALLOCATION BLOCK.
   - If AVAILABLE or RESERVED → create allocation record with type ALLOCATE, 
     status PENDING
   - Set asset status = RESERVED immediately (before approval)
   - Return allocation record

7. transferAsset(assetId, newAllocatedToId, reason):
   - Must be currently ALLOCATED
   - Create allocation record with type TRANSFER, status PENDING
   - Keep current status as ALLOCATED until approved

8. returnAsset(assetId, reason):
   - Must be currently ALLOCATED
   - Create allocation record with type RETURN
   - Set returnedAt on current allocation
   - Set asset status = AVAILABLE
   - Return allocation record

9. approveAllocation(allocationId, approvedById):
   - Only ADMIN or MANAGER can approve
   - Set allocation status = APPROVED
   - If type is ALLOCATE: set asset status = ALLOCATED
   - If type is TRANSFER: close old allocation (set returnedAt), 
     set asset status = ALLOCATED with new user
   - If type is RETURN: set asset status = AVAILABLE (already handled)

10. getallocationHistory(assetId):
    - Return all allocations for asset, ordered by allocatedAt desc
    - Include user names and department names

### asset.controller.ts

Map all service functions to Express handlers:
  GET    /              → listAssets (query params for filters)
  POST   /              → createAsset (requires ADMIN or MANAGER role)
  GET    /:id           → getAssetById
  PUT    /:id           → updateAsset (requires ADMIN or MANAGER)
  DELETE /:id           → deleteAsset (requires ADMIN)
  POST   /:id/allocate  → allocateAsset (requires MANAGER or ADMIN)
  POST   /:id/transfer  → transferAsset
  POST   /:id/return    → returnAsset
  PUT    /allocations/:id/approve → approveAllocation (requires ADMIN or MANAGER)
  GET    /:id/allocation-history → getallocationHistory

### asset.routes.ts

Wire all routes with auth middleware. Apply role checks where noted.
Export default router.

### asset.validators.ts

Zod schemas:
  - createAssetSchema: name(required), categoryId(uuid), location(optional), 
    purchaseDate(optional date), purchaseCost(optional number >= 0), 
    warrantyExpiry(optional date), serialNumber(optional)
  - updateAssetSchema: partial of createAssetSchema
  - allocateAssetSchema: allocatedToId(uuid required), departmentId(uuid optional), 
    reason(optional string)

═══════════════════════════════════════════════════════════════
FRONTEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════

### frontend/src/hooks/useAssets.ts

Use TanStack React Query hooks:
  - useAssets(filters): GET /api/assets with query params
  - useAsset(id): GET /api/assets/:id
  - useCreateAsset(): POST mutation
  - useAllocateAsset(): POST mutation
  - useTransferAsset(): POST mutation  
  - useReturnAsset(): POST mutation
  - useApproveAllocation(): PUT mutation

### AssetDirectoryPage.tsx (Screen 4 from wireframes)

Layout:
  - Page title "Assets" with "+ Register Asset" button (top right, green)
  - Search bar: "Search by tag, serial, or QR code..."
  - Filter row: Category dropdown, Status dropdown, Department dropdown
  - Table (Ant Design Table) with columns:
    • Tag (e.g., AF-0016) — clickable, links to detail page
    • Name (e.g., Dell Laptop)
    • Category (e.g., Electronics)
    • Status — colored Ant Design Tag:
      AVAILABLE = green
      ALLOCATED = blue
      RESERVED = orange
      UNDER_MAINTENANCE = red
      RETIRED = gray
    • Location (e.g., 1st Floor 2)
  - Pagination at bottom

  Register Asset button opens AssetRegistrationForm as a modal/drawer.

### AssetRegistrationForm.tsx

Ant Design Drawer or Modal:
  - Form fields: Name, Category (Select), Location, Purchase Date (DatePicker), 
    Purchase Cost (InputNumber), Warranty Expiry (DatePicker), Serial Number
  - Tag is auto-generated (show info text: "Tag will be auto-assigned")
  - Submit button → calls createAsset API
  - On success: close modal, refresh asset list, show success toast

### AssetDetailPage.tsx

Route: /assets/:id
Layout:
  - Asset header: Tag + Name, Status tag (colored), Category badge
  - Descriptions section (Ant Design Descriptions):
    Location, Serial Number, QR Code, Purchase Date, Cost, Warranty Expiry, 
    Condition
  - Action buttons (based on status):
    • AVAILABLE → "Allocate" button
    • ALLOCATED → "Transfer" button, "Return" button
    • RESERVED → "Pending Approval" disabled badge
  - "Allocation History" section:
    Timeline (Ant Design Timeline) showing all past allocations:
    "Apr 12 — Allocated to Priya Shah — Engineering"
    "Jan 04 — Returned by Arya Rai — condition: good"

### AllocationTransferPage.tsx (Screen 5 from wireframes)

Layout:
  - Asset selector (Select with search, loads from /api/assets)
  - On select, show:
    • Asset name & tag
    • Current status with colored indicator
    • If ALLOCATED: show current allocation with red warning:
      "Already allocated to [User] ([Department]). 
       This asset is blocked — submit a transfer request below."
    • Transfer Request section:
      - From: [current holder] (auto-filled)
      - To: Employee selector (Select with search)
      - Reason: TextArea
      - "Submit Request" button
  - If AVAILABLE:
    • Allocate section:
      - To: Employee selector
      - Department selector
      - Reason
      - "Allocate" button
  - Bottom: Allocation History table for selected asset

═══════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════
□ Double-allocation block is BULLETPROOF — no edge cases
□ Asset status transitions are atomic (use Prisma transactions)
□ All tables have loading skeletons
□ Empty states show "No assets found" with illustration
□ Form validations show inline errors
□ Success/error toasts on all actions
□ Responsive tables (scroll on mobile)
□ Tag auto-generation is collision-free
```

---

### 🟡 PROMPT FOR MEMBER 3: Resource Booking & Calendar UI

```
You are a senior full-stack engineer building the RESOURCE BOOKING domain for 
"AssetFlow" — an Enterprise Asset & Resource Management System.

═══════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════
- Backend: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
- Frontend: React 18 + Vite + TypeScript + Ant Design 5.x + dayjs
- Validation: Zod

═══════════════════════════════════════════════════════════════
YOUR ROLE & DIRECTORY BOUNDARIES
═══════════════════════════════════════════════════════════════
You own these directories EXCLUSIVELY:
  backend/src/modules/booking/
    ├── booking.controller.ts
    ├── booking.service.ts
    ├── booking.routes.ts
    └── booking.validators.ts
  frontend/src/pages/booking/
    ├── ResourceBookingPage.tsx
    ├── BookingCalendar.tsx
    └── BookingForm.tsx
  frontend/src/hooks/useBookings.ts

⛔ STRICT CONSTRAINT: NEVER modify ANY file outside the directories listed 
   above. Do NOT touch schema.prisma, index.ts, App.tsx, Sidebar.tsx, or 
   any file belonging to other members. Import from packages/shared and 
   backend/src/config/db.ts as needed but NEVER modify them.

═══════════════════════════════════════════════════════════════
PREREQUISITE
═══════════════════════════════════════════════════════════════
Before you start, pull the develop branch. Stub files exist in your directories.
Replace them with full implementations.
Routes already wired: app.use('/api/bookings', bookingRoutes)

═══════════════════════════════════════════════════════════════
DATABASE MODEL (already in schema.prisma — DO NOT MODIFY)
═══════════════════════════════════════════════════════════════

Booking:
  id, assetId?, facilityId?, bookedById, title, purpose, startTime, endTime, 
  isRecurring, recurRule, status(UPCOMING|ONGOING|COMPLETED|CANCELLED), 
  createdAt, updatedAt

═══════════════════════════════════════════════════════════════
BACKEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════

### booking.service.ts

1. listBookings(filters):
   - Filter by: date (specific day), facilityId, assetId, bookedById, status
   - Include facility, asset, bookedBy (user name)
   - Sort by startTime asc
   - Support pagination

2. getBookingById(id):
   - Include all relations
   - 404 if not found

3. createBooking(data):
   CRITICAL OVERLAP LOGIC:
   - Before creating, check for conflicts using this exact query:
     
     WHERE (facilityId = :facilityId OR assetId = :assetId)
       AND status NOT IN ('CANCELLED', 'COMPLETED')
       AND startTime < :requestedEndTime
       AND endTime > :requestedStartTime
     
   - This logic EXPLICITLY ALLOWS back-to-back bookings:
     e.g., Booking A (9:00-10:00) and Booking B (10:00-11:00) do NOT conflict
     because: A.endTime (10:00) is NOT > B.startTime (10:00) — the condition 
     uses strict inequality (>), not (>=).
   
   - If conflict found: return error with details of conflicting booking(s)
     Response: { 
       success: false, 
       error: "Booking conflict", 
       conflicts: [{ id, title, startTime, endTime, bookedBy }]
     }
   
   - If recurring (isRecurring=true), expand recurRule into individual 
     bookings for the next 4 weeks and check conflicts for each.
     If any occurrence conflicts, reject the entire series.
   
   - On success: create booking with status UPCOMING
   - If booking a resource (facility/asset), optionally set asset 
     status to RESERVED if it's an asset booking

4. updateBooking(id, data):
   - Can only update UPCOMING bookings
   - If time changes, re-run conflict check
   - Cannot update ONGOING, COMPLETED, or CANCELLED bookings

5. cancelBooking(id):
   - Set status = CANCELLED
   - Can cancel UPCOMING or ONGOING bookings

6. checkAvailability(resourceId, resourceType, date):
   - Return all bookings for that resource on that date
   - Return available time slots (8:00-18:00 work hours, subtract booked slots)

7. checkConflict(facilityId/assetId, startTime, endTime):
   - Standalone conflict check endpoint (for frontend real-time validation)
   - Return: { hasConflict: boolean, conflicts: Booking[] }

8. transitionToOngoing():
   *** THIS IS A CRITICAL REQUIREMENT ***
   - Find all bookings where:
     status = UPCOMING AND startTime <= NOW AND endTime > NOW
   - Update their status to ONGOING
   - This should be callable:
     a) Via a POST /api/bookings/transition-ongoing endpoint (for manual trigger)
     b) Automatically via a cron job or on-access pattern:
        In the listBookings and getBookingById functions, BEFORE returning 
        results, run the transition check. This ensures data is always fresh.
   
   Also transition ONGOING → COMPLETED:
   - Find all bookings where: status = ONGOING AND endTime <= NOW
   - Update to COMPLETED

### booking.controller.ts

  GET    /                    → listBookings
  POST   /                    → createBooking
  GET    /:id                 → getBookingById
  PUT    /:id                 → updateBooking
  DELETE /:id/cancel          → cancelBooking
  GET    /availability        → checkAvailability (query: resourceId, resourceType, date)
  POST   /check-conflict      → checkConflict
  POST   /transition-ongoing  → transitionToOngoing

### booking.routes.ts
Wire all routes with auth middleware. Export default router.

### booking.validators.ts

Zod schemas:
  - createBookingSchema:
    • assetId (optional uuid)
    • facilityId (optional uuid)  
    • At least one of assetId or facilityId must be provided (custom refine)
    • title (required string, min 2)
    • purpose (optional string)
    • startTime (required ISO datetime)
    • endTime (required ISO datetime)
    • endTime must be after startTime (custom refine)
    • isRecurring (optional boolean, default false)
    • recurRule (required if isRecurring is true)
  - updateBookingSchema: partial

═══════════════════════════════════════════════════════════════
FRONTEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════

### frontend/src/hooks/useBookings.ts

TanStack React Query hooks:
  - useBookings(filters): GET /api/bookings
  - useBooking(id): GET /api/bookings/:id
  - useCreateBooking(): POST mutation
  - useCancelBooking(): DELETE mutation
  - useCheckConflict(): POST mutation
  - useAvailability(resourceId, resourceType, date): GET

### ResourceBookingPage.tsx (Screen 6 from wireframes)

Layout — MATCH WIREFRAME EXACTLY:
  - Page title: "Resource Booking"
  - Resource selector at top:
    • Select dropdown to choose a facility or asset
    • Format: "Conference Room B3 — Thu, 7 Jul" 
    • Date picker next to it
  
  - Below: BookingCalendar component (main view)
  - Below calendar: "Book a slot" button (green, prominent)

### BookingCalendar.tsx

CRITICAL COMPONENT — This is the centerpiece visual:

  - Timeline/Schedule view (NOT a full calendar grid):
    • Y-axis: Time slots from 8:00 to 18:00 (hourly rows)
    • X-axis: just one day (selected date)
    • Each booked slot is a colored horizontal block spanning its time range:
      - UPCOMING: blue block
      - ONGOING: green block with pulse animation
      - COMPLETED: gray block
      - CANCELLED: striped/faded block
    
  - Block content: "Booked — [Permanent/Time] — [start] to [end]"
  - Conflict visualization:
    • If user selects a time range that overlaps, show a RED overlay:
      "Rejected 4:00 to 10:30 — conflict — slot 5 onwards"
    • Show back-to-back bookings as ADJACENT blocks with a thin 
      green line between them (allowed!)

  Implementation approach:
    - Use a custom div-based timeline (or Ant Design Calendar in custom render mode)
    - Each hour row is 60px tall
    - Booked blocks are absolutely positioned based on start/end times
    - Color-code by status

  Alternative simpler implementation:
    - Use Ant Design's Table component with time column and visual bars rendered 
      as custom cells using percentage-based widths

### BookingForm.tsx

Ant Design Modal/Drawer:
  - Resource: pre-filled from selected resource (read-only display)
  - Title: Input
  - Purpose: TextArea (optional)
  - Date: DatePicker (pre-filled from calendar)
  - Start Time: TimePicker (hour granularity, 8:00-17:00)
  - End Time: TimePicker (9:00-18:00, must be > start)
  - Recurring toggle: Switch
    • If on: show recurrence options (Weekly/Biweekly, for how many weeks)
  
  Real-time conflict check:
    - When user selects start/end time, call /check-conflict
    - If conflict: show red Alert with conflicting booking details
    - If OK: show green Checkmark "Slot available!"
  
  - Submit button → calls createBooking
  - On success: close form, refresh calendar, show success toast

═══════════════════════════════════════════════════════════════
EDGE CASES TO HANDLE
═══════════════════════════════════════════════════════════════
□ Back-to-back bookings (9:00-10:00 then 10:00-11:00) MUST be allowed
□ Exact overlaps (9:00-10:00 and 9:30-10:30) MUST be rejected
□ Contained bookings (9:00-11:00 and 9:30-10:00) MUST be rejected
□ Booking a resource that's UNDER_MAINTENANCE → reject with message
□ Past-date bookings → reject
□ Same-day concurrent bookings on DIFFERENT resources → allow
□ ONGOING status auto-transitions without manual intervention

═══════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════
□ Conflict detection is 100% correct with test cases
□ Calendar renders smoothly with 20+ bookings
□ Loading states on calendar
□ Empty state: "No bookings for this date"
□ Mobile responsive (stack timeline vertically)
□ Time displayed in user-friendly format (2:00 PM, not 14:00)
□ Error toasts for all failure cases
```

---

### 🔴 PROMPT FOR MEMBER 4: Maintenance, Audits, Dashboard, Reports & Notifications

```
You are a senior full-stack engineer building the MAINTENANCE, AUDIT, 
DASHBOARD, REPORTS & NOTIFICATIONS domain for "AssetFlow" — an Enterprise 
Asset & Resource Management System.

═══════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════
- Backend: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
- Frontend: React 18 + Vite + TypeScript + Ant Design 5.x + Recharts
- Validation: Zod

═══════════════════════════════════════════════════════════════
YOUR ROLE & DIRECTORY BOUNDARIES
═══════════════════════════════════════════════════════════════
You own these directories EXCLUSIVELY:
  backend/src/modules/maintenance/
    ├── maintenance.controller.ts
    ├── maintenance.service.ts
    ├── maintenance.routes.ts
    ├── audit.controller.ts
    ├── audit.service.ts
    ├── audit.routes.ts
    ├── dashboard.controller.ts
    ├── dashboard.service.ts
    ├── dashboard.routes.ts
    ├── report.controller.ts
    ├── report.service.ts
    ├── report.routes.ts
    ├── notification.controller.ts
    ├── notification.service.ts
    ├── notification.routes.ts
    └── maintenance.validators.ts
  frontend/src/pages/maintenance/
    ├── DashboardPage.tsx
    ├── MaintenanceKanbanPage.tsx
    ├── AuditPage.tsx
    ├── ReportsPage.tsx
    └── NotificationsPage.tsx
  frontend/src/hooks/useMaintenance.ts

⛔ STRICT CONSTRAINT: NEVER modify ANY file outside the directories listed 
   above. Do NOT touch schema.prisma, index.ts, App.tsx, Sidebar.tsx, or 
   any file belonging to other members.

═══════════════════════════════════════════════════════════════
PREREQUISITE
═══════════════════════════════════════════════════════════════
Pull develop branch first. Stub files exist. Replace with full implementations.
Routes already wired in index.ts:
  app.use('/api/maintenance', maintenanceRoutes)
  app.use('/api/audits', auditRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/reports', reportRoutes)
  app.use('/api/notifications', notificationRoutes)

═══════════════════════════════════════════════════════════════
DATABASE MODELS (DO NOT MODIFY schema.prisma)
═══════════════════════════════════════════════════════════════

MaintenanceRequest:
  id, assetId, requestedById, assignedToId, type(PREVENTIVE|CORRECTIVE|EMERGENCY),
  priority(LOW|MEDIUM|HIGH|CRITICAL), status(PENDING|APPROVED|TECHNICIAN_ASSIGNED|
  IN_PROGRESS|RESOLVED), description, resolutionNote, cost, requestedAt, resolvedAt

Audit:
  id, title, departmentId, conductedById, scheduledDate, completedDate, 
  status(SCHEDULED|IN_PROGRESS|COMPLETED), notes, items[]

AuditItem:
  id, auditId, assetId, expectedLocation, actualLocation, expectedCondition,
  actualCondition, isVerified, discrepancyNote, checkedAt

Notification:
  id, userId, type(ALERT|APPROVAL|BOOKING|MAINTENANCE|AUDIT), title, message, 
  isRead, link, createdAt

ActivityLog:
  id, userId, action, entityType, entityId, details, createdAt

═══════════════════════════════════════════════════════════════
BACKEND: MAINTENANCE MODULE
═══════════════════════════════════════════════════════════════

### maintenance.service.ts

1. listMaintenanceRequests(filters):
   - Filter by: status, priority, assetId, assignedToId, type
   - Include asset (with tag & name), requestedBy (name), assignedTo (name)
   - Sort by: priority desc, requestedAt desc

2. createMaintenanceRequest(data):
   - Validate assetId exists
   - Create with status PENDING
   - Set the asset status to UNDER_MAINTENANCE via Prisma transaction
   - Create a Notification for all ADMIN/MANAGER users:
     type: 'MAINTENANCE', title: 'New Maintenance Request',
     message: 'Maintenance requested for [asset.tag]: [description]'
   - Create ActivityLog entry

3. updateMaintenanceRequest(id, data):
   - Allow updating: priority, type, description, assignedToId, cost

4. updateStatus(id, newStatus):
   *** KANBAN TRANSITION LOGIC ***
   Valid transitions (enforce strictly):
     PENDING → APPROVED
     APPROVED → TECHNICIAN_ASSIGNED (must provide assignedToId)
     TECHNICIAN_ASSIGNED → IN_PROGRESS
     IN_PROGRESS → RESOLVED (must provide resolutionNote, set resolvedAt=now())
   
   Invalid transitions → return 400 error
   
   When status becomes RESOLVED:
     - Set asset status back to AVAILABLE (or previous status)
     - Create notification for the original requester
     - Create ActivityLog entry

5. assignTechnician(id, assignedToId):
   - Must be in APPROVED status
   - Set assignedToId, transition to TECHNICIAN_ASSIGNED
   - Create notification for the assigned technician

═══════════════════════════════════════════════════════════════
BACKEND: AUDIT MODULE
═══════════════════════════════════════════════════════════════

### audit.service.ts

1. listAudits():
   - Include item count, department name, conductedBy name
   - Sort by scheduledDate desc

2. createAudit(data):
   - Fields: title, departmentId (optional), scheduledDate
   - Auto-populate audit items:
     If departmentId provided: find all assets allocated to that department
     If not provided: include all assets
     For each asset, create an AuditItem with:
       expectedLocation = asset.location
       expectedCondition = asset.condition
       isVerified = false
   - Set audit status = SCHEDULED

3. getAuditById(id):
   - Include ALL items with asset details
   - Calculate summary: total items, verified count, discrepancy count

4. updateAuditItem(auditId, itemId, data):
   - Update: actualLocation, actualCondition, isVerified, discrepancyNote
   - Set checkedAt = now()
   - Auto-detect discrepancy:
     If actualLocation != expectedLocation OR actualCondition != expectedCondition:
       Set discrepancyNote auto-text if not provided:
       "Location mismatch: expected [X], found [Y]" or
       "Condition mismatch: expected [X], found [Y]"

5. generateReport(auditId):
   - Calculate:
     • Total assets audited
     • Verified count & percentage
     • Discrepancy count
     • List of discrepant assets with details
   - Update audit status to COMPLETED, set completedDate
   - Return structured report object
   - Create notification: "Audit [title] completed — [X] discrepancies found"

═══════════════════════════════════════════════════════════════
BACKEND: DASHBOARD MODULE
═══════════════════════════════════════════════════════════════

### dashboard.service.ts

1. getOverview():
   Return object:
   {
     totalAssets: count of non-RETIRED assets,
     assetsAvailable: count where status = AVAILABLE,
     assetsAllocated: count where status = ALLOCATED,
     assetsReserved: count where status = RESERVED,
     activeBookings: count where status IN (UPCOMING, ONGOING),
     pendingReturns: count of allocations where type=RETURN and status=PENDING,
     upcomingReturns: count of assets with warranty expiring in 30 days,
     assetsOverdueForReturn: count, // assets overdue for scheduled return
     pendingMaintenance: count where status = PENDING,
     activeMaintenance: count where status IN (APPROVED, TECHNICIAN_ASSIGNED, IN_PROGRESS)
   }

2. getRecentActivity(limit=10):
   - Query ActivityLog, order by createdAt desc, limit
   - Include user name
   - Format for display:
     "Laptop AF-0016 — allocated to Priya Shah — IT Dept"
     "Room B3 — booking confirmed — 2:00 to 5:00 PM"
     "Projector AF-0045 — maintenance resolved"

═══════════════════════════════════════════════════════════════
BACKEND: REPORTS MODULE
═══════════════════════════════════════════════════════════════

### report.service.ts

*** ALL THESE REPORTS ARE MANDATORY ***

1. utilizationByDepartment():
   - For each department: count of allocated assets, percentage of total
   - Return: [{ department, allocatedCount, percentage }]

2. maintenanceFrequency():
   - Group maintenance requests by asset (or by category)
   - Return: [{ assetTag, assetName, category, requestCount, lastRequestDate }]
   - Sort by requestCount desc

3. mostUsedAssets():
   - Assets with most bookings in last 30 days
   - Return: [{ assetTag, assetName, bookingCount, totalHours }]

4. idleAssets():
   - Assets with status AVAILABLE and no bookings/allocations in last 60 days
   - Return: [{ assetTag, assetName, category, idleDays }]

5. assetsDueForMaintenance():
   - Assets with condition NEEDS_REPAIR or FAIR
   - Assets nearing warranty expiry (within 30 days)
   - Assets approaching retirement age
   - Return: [{ assetTag, assetName, reason, dueDate }]

6. departmentAllocationSummary():
   - For each department: asset count by category
   - Return: [{ department, categories: [{ name, count }], totalAssets }]

7. bookingHeatmap():
   - Aggregate booking counts by day-of-week and hour
   - Return 7×12 matrix (Mon-Sun × 8AM-8PM):
     [{ dayOfWeek: 0-6, hour: 8-19, count: number }]

8. exportReport(reportType, format):
   - Generate CSV or JSON export of any report
   - Return downloadable content

═══════════════════════════════════════════════════════════════
BACKEND: NOTIFICATION MODULE
═══════════════════════════════════════════════════════════════

### notification.service.ts

1. listNotifications(userId, filters):
   - Filter by: type (ALL|ALERT|APPROVAL|BOOKING|MAINTENANCE|AUDIT), isRead
   - Sort by createdAt desc
   - Return with unread count

2. markAsRead(id):
   - Set isRead = true

3. markAllAsRead(userId):
   - Bulk update all unread for user

4. createNotification(userId, type, title, message, link):
   - Utility function called by other services
   - Export this so other modules CAN import it if needed 
     (but they won't need to since you handle all notification creation)

═══════════════════════════════════════════════════════════════
FRONTEND IMPLEMENTATION
═══════════════════════════════════════════════════════════════

### frontend/src/hooks/useMaintenance.ts

TanStack React Query hooks:
  - useDashboardOverview(): GET /api/dashboard/overview
  - useRecentActivity(): GET /api/dashboard/recent-activity
  - useMaintenanceRequests(filters): GET /api/maintenance
  - useCreateMaintenance(): POST mutation
  - useUpdateMaintenanceStatus(): PUT mutation
  - useAudits(): GET /api/audits
  - useAudit(id): GET /api/audits/:id
  - useCreateAudit(): POST mutation
  - useReportData(reportType): GET /api/reports/[reportType]
  - useNotifications(filters): GET /api/notifications
  - useMarkAsRead(): PUT mutation

### DashboardPage.tsx (Screen 2 from wireframes)

*** MATCH WIREFRAME EXACTLY ***

Layout:
  - Page title: "Dashboard" with "Today's Overview" subtitle
  
  - Stats Cards Row (Ant Design Statistic cards, 4 cards in a Row/Col grid):
    • "Available" — number — green accent
    • "Allocated" — number — blue accent
    • "Active Bookings" — number — with sub-value for count
    • "Pending Returns" — number — orange accent
  
  - Warning Alert Row:
    • If there are overdue assets:
      Ant Design Alert (warning type):
      "3 assets overdue for return — flagged for following"
  
  - Quick Action Buttons Row (THIS IS A MANDATORY REQUIREMENT):
    Three prominent Ant Design Buttons with icons:
    • "+ Register Asset" (green) — links to /assets/register
    • "Book Resource" (blue) — links to /booking
    • "Raise Maintenance" (orange) — opens maintenance request modal/links to /maintenance
  
  - Recent Activity section:
    • List/Timeline of latest 10 activities:
      "Laptop AF-0016 — allocated to Priya Shah — IT Dept"
      "Room B3 — booking confirmed — 2:00 to 5:00 PM"
      "Projector AF-0045 — maintenance resolved"
    • Each item has timestamp on the right
  
  - Resource Booking Heatmap (MANDATORY REQUIREMENT):
    • Recharts-based heatmap grid showing booking density
    • X-axis: Hours (8AM–6PM), Y-axis: Days (Mon–Sun)
    • Color intensity = booking count
    • Use a custom rendered ScatterChart or a grid of colored cells

### MaintenanceKanbanPage.tsx (Screen 7 from wireframes)

*** THIS IS THE MOST VISUALLY IMPRESSIVE PAGE ***

Layout — Kanban Board:
  - 5 columns matching MaintenanceStatus flow:
    PENDING → APPROVED → TECHNICIAN_ASSIGNED → IN_PROGRESS → RESOLVED
  
  - Each column header shows count: "Pending (3)"
  
  - Each card shows:
    • Asset tag (e.g., AF-0062)
    • Brief description (e.g., "not turning on")
    • Priority badge (color coded: CRITICAL=red, HIGH=orange, MEDIUM=yellow, LOW=green)
    • Requester name
    • Timestamp
  
  - Drag-and-drop between columns:
    • Use a simple implementation with Ant Design Card components
    • On drop to next column: call updateStatus API
    • When moving to TECHNICIAN_ASSIGNED: prompt for assignee selection
    • When moving to RESOLVED: prompt for resolution note
  
  - If drag-and-drop is complex, ALTERNATIVE:
    • Each card has a "Move to next stage →" button
    • Clicking it transitions the status

  - Match wireframe: cards show asset tag, and bottom note:
    "Approving a card moves the asset to under maintenance, 
     resolving it returns it to available"

### AuditPage.tsx (Screen 8 from wireframes)

Layout:
  - Header: "Asset Audit" with "+ New Audit" button
  
  - Audit List view (default):
    Table: Title, Department, Scheduled Date, Status, Item Count
    Click row → Detail view
  
  - Audit Detail view:
    • Header: "Q3 Audit: Engineering Dept — 18 Jul"
    • Summary: "Assets: 4, Floor 1, Dept 1"
    
    • Checklist Table:
      Columns: Asset (tag + name), Expected Location, Actual Location (editable),
      Expected Condition, Actual Condition (editable select), Verified (checkbox), 
      Status indicator
      
      Status indicators per row:
        ✅ Verified (green checkmark)
        ⚠️ Missing (orange warning) — when actual doesn't match expected
        ❌ Damaged (red X) — when condition is worse than expected
    
    • Bottom alert (when discrepancies exist):
      Red Alert: "3 assets flagged — discrepancy report generated automatically"
    
    • "Show Audit Cycle" button → shows audit cycle info
    • "Generate Report" button → calls generateReport API, shows result

### ReportsPage.tsx (Screen 9 from wireframes)

Layout — Tab-based or Card-based report sections:

  - "Utilization by Department" — Bar chart (Recharts BarChart)
    X-axis: Departments, Y-axis: Asset count, colored bars

  - "Maintenance Frequency" — Bar chart
    X-axis: Assets/Categories, Y-axis: Request count

  - "Most Used Assets" section:
    Table or list: "Room B3: 34 bookings this month"
    "Projector AF-0035: 19 uses"

  - "Idle Assets" section:
    Table: Asset tag, name, idle duration
    "Cursor AF-0091 — unused 67+ days"

  - "Assets Due for Maintenance / Nearing Retirement":
    List: "Forklift AF-0088 — service due in 5 days"
    "Laptop AF-0052 — 5 years old, nearing retirement"

  - "Department-wise Allocation Summary":
    Grouped table showing assets per department per category

  - "Booking Heatmap":
    Same heatmap component as dashboard (reuse)

  - "Export Report" button at bottom → download CSV/JSON

### NotificationsPage.tsx (Screen 10 from wireframes)

Layout:
  - Tab filter bar: "All", "Alerts", "Approvals", "Bookings"
    (map to notification type filter)
  
  - Notification list (Ant Design List with avatar/icon):
    Each item:
    • Icon/avatar based on type (color-coded)
    • Title + message
    • Timestamp (relative: "2m ago", "1h ago", "3d ago")
    • Unread indicator (blue dot or bold text)
    
    Example items from wireframe:
    "🔵 Laptop AF-0016 assigned to Priya Shah — 2m ago"
    "🟢 Maintenance request AF-0055 approved — 1h ago"
    "🟡 Booking confirmed — Room B3 — 2:00 to 5:00 PM — 1h ago"
    "🔴 Transfer approved — AF-0038 to Facilities dept. — 3d ago"
    "🟠 Overdue return — AF-0091 was due 3 days ago — 5d ago"
    "⚫ Audit discrepancy flagged — AF-0096 damaged — 24d ago"
  
  - "Mark all as read" button at top right
  - Click notification → navigate to link (deep link)

═══════════════════════════════════════════════════════════════
QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════
□ Kanban drag-and-drop (or button flow) works smoothly
□ Status transitions enforce valid sequences
□ Dashboard loads fast with aggregated queries (not N+1)
□ All 7 reports return real data (not hardcoded)
□ Heatmap renders visually with color gradient
□ Audit auto-populates items from assets
□ Discrepancy detection is automatic
□ Notifications are created by maintenance/audit actions
□ Charts are responsive and legible
□ Empty states for all sections
□ Loading skeletons on dashboard cards
□ Export functionality works (CSV at minimum)
```

---

## PART 5: INTEGRATION CONTRACTS

To ensure modules work together without conflicts, these are the API contracts each member must follow:

### How Member 4 reads data from other domains

Member 4's dashboard and reports query the database DIRECTLY using Prisma (not via HTTP calls to other members' APIs). This is fine because:
- All members share the SAME Prisma client and schema
- Member 4 only READS from Asset, Booking tables — never WRITES
- The database is the integration point, not APIs

```typescript
// Example: Member 4's dashboard.service.ts can do:
import prisma from '../../config/db';

const totalAssets = await prisma.asset.count({ 
  where: { status: { not: 'RETIRED' } } 
});
const activeBookings = await prisma.booking.count({ 
  where: { status: { in: ['UPCOMING', 'ONGOING'] } } 
});
```

### How Member 2 handles maintenance-triggered status changes

When Member 4 creates a maintenance request, the maintenance service DIRECTLY updates the asset status:

```typescript
// maintenance.service.ts (Member 4):
await prisma.$transaction([
  prisma.maintenanceRequest.create({ data: { ... } }),
  prisma.asset.update({
    where: { id: assetId },
    data: { status: 'UNDER_MAINTENANCE' }
  })
]);
```

This is safe because Member 2's asset service also uses Prisma transactions, and Postgres handles concurrent updates correctly.

---

## APPENDIX: Quick Reference Card

| Item | Detail |
|---|---|
| **Repo structure** | npm workspaces monorepo |
| **Backend port** | 3001 |
| **Frontend port** | 3000 (proxies /api to 3001) |
| **DB port** | 5432 |
| **DB name** | assetflow |
| **JWT secret** | Set in .env |
| **Admin seed credentials** | admin@assetflow.com / admin123 |
| **Asset tag format** | AF-XXXX (4-digit padded) |
| **Working hours** | 8:00 AM – 6:00 PM |
| **Booking granularity** | 1 hour |
| **Overlap check** | `start < existingEnd AND end > existingStart` (strict `>`, allows back-to-back) |

---

## APPENDIX: Docker Compose

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: assetflow
      POSTGRES_PASSWORD: assetflow
      POSTGRES_DB: assetflow
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U assetflow"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://assetflow:assetflow@db:5432/assetflow
      JWT_SECRET: assetflow-hackathon-secret-2026
      PORT: 3001

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
```

---

> [!IMPORTANT]
> **Critical Success Factors:**
> 1. Member 1's scaffold MUST be perfect and merged before others start (Hour 0-1)
> 2. Zero file overlap between members guarantees zero merge conflicts
> 3. Database is the integration point — all members read/write via Prisma
> 4. Each prompt is self-contained — members don't need to coordinate during Hours 1-4
> 5. Hour 4-5 integration is about wiring dashboard data and testing E2E flows
