# DP-SMS Frontend

Web app for **Digital Pathshala School Management System (DP-SMS)** — a multi-tenant school management platform for Nepali schools.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4 (semantic design tokens in `globals.css` @theme)
- TypeScript, axios (`apiClient` with automatic token refresh on 401)
- pnpm

## Getting started

```bash
pnpm install
cp .env.example .env.local  # set NEXT_PUBLIC_API_URL (default http://localhost:4000/api)
pnpm dev
```

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Node test runner |

## Conventions

- Feature folders under `src/features/<domain>/`: `types.ts`, `api/`, `components/`.
- Shared UI primitives in `src/shared/components/ui/` (Button, Avatar, SearchBar, Dropdown, StatsCard, DashboardWidget, EmptyState, StatusBadge, toast, charts).
- Role-aware rendering branches on `useAuth()` (`user.role`, `can(permission)`); the API remains the real enforcement boundary.
- Status colors: emerald = present/success, red = absent/error, amber = late/warning, blue = excused/info.

---

## Changelog

### 2026-08-24 — Teacher Dashboard & Route Guards

- **New `TeacherDashboardPage`** — teachers land on their own dashboard at `/dashboard`: stat cards for assigned sections/students/present-today, today's attendance breakdown bars, and a "My Sections" widget with quick register links. All data comes from the scoped `GET /dashboard/teacher-summary`.
- **`RequireRole` guard** (`src/shared/components/require-role.tsx`) — client-side convenience guard showing a "no access" state instead of pages that would 403. Applied to admin-only routes: teachers, staff, departments, academic-sessions (+ detail pages), teacher-assignments, attendance/staff. Real authorization stays server-side.
- `/dashboard` now branches three ways: STUDENT → student dashboard, TEACHER → teacher dashboard, otherwise school dashboard.

### 2026-08-24 — Student Dashboard Attendance Report Rebuild

- Today hero banner with contextual status/risk signal (thresholds: <75% risk band).
- Attendance gauge with dashed no-data state + accessible labels.
- **30-day strip**: last 30 marked days as color cells (weekends dimmed client-side).
- Marked-day totals tiles; empty state when no records; link to `/attendance-history`.

### 2026-08-24 — Attendance Register

- **New `AttendanceRegister` component** — props-driven daily register:
  - Segmented Present / Absent / Late toggle per student (pastel triads per status)
  - Excused hidden behind a per-row overflow menu
  - Search filter by name/roll number, live counts over the full roster
  - Mark-all-present shortcut, single bulk save via `POST /attendance/student/bulk-mark`
  - Save disabled until changes exist; inline error banner + toast feedback
- `StudentAttendancePage` refactored as the data-owning parent (role-aware section loading: teachers use *my sections*); silent refetch after save.
- `StaffAttendancePage` upgraded with search + segmented Present/Absent/On Leave control (unmarked defaults to present).
