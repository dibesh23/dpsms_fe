# DP-SMS Frontend — Folder Guide

Simple reference for what each folder is used for.

---

## Root Level

| Folder / File  | Purpose                                    |
| -------------- | ------------------------------------------ |
| `src/`         | All application source code                |
| `public/`      | Static assets — images, icons, favicon     |
| `docs/`        | Project documentation                      |
| `.env.local`   | Local environment variables (never commit) |
| `package.json` | Dependencies and scripts                   |

---

## `src/app/`

Next.js App Router — **route pages only.** Keep pages thin; put logic in `features/`.

| Folder                    | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `(marketing)/`            | Public landing page and school onboarding        |
| `(auth)/login/`           | Login page                                       |
| `(auth)/register/`        | Registration / signup page                       |
| `(auth)/forgot-password/` | Password reset page                              |
| `(dashboard)/`            | Authenticated app shell (sidebar + main content) |
| `(dashboard)/academic/`   | Academic setup page                              |
| `(dashboard)/students/`   | Student management page                          |
| `(dashboard)/teachers/`   | Teacher management page                          |
| `(dashboard)/attendance/` | Attendance page                                  |
| `(dashboard)/fees/`       | Fees management page                             |
| `(dashboard)/exams/`      | Exams and results page                           |
| `(dashboard)/notices/`    | Notices page                                     |
| `(dashboard)/settings/`   | School / account settings page                   |

**Rule:** Pages compose components from `features/` — do not put business logic or API calls directly in page files.

---

## `src/features/`

Business modules. **Mirrors the backend feature folders.** Each module owns its UI, API calls, hooks, and types.

Each feature folder contains:

| Subfolder     | Purpose                                               |
| ------------- | ----------------------------------------------------- |
| `api/`        | Typed API client — all backend calls for this feature |
| `components/` | Feature-specific UI components                        |
| `hooks/`      | Feature-specific React hooks                          |
| `types/`      | TypeScript types matching backend DTOs                |
| `index.ts`    | Public exports only                                   |

### Feature folders

| Folder        | What it handles                             |
| ------------- | ------------------------------------------- |
| `auth/`       | Login form, session, logout UI              |
| `tenant/`     | School onboarding flow                      |
| `academic/`   | Class, section, subject setup UI            |
| `student/`    | Student list, profile, guardians, documents |
| `teacher/`    | Teacher list, profile, assignments          |
| `attendance/` | Mark and view attendance                    |
| `fees/`       | Fee collection, installments, receipts      |
| `exam/`       | Exam setup, marks entry, results            |
| `notice/`     | Create and view notices                     |
| `dashboard/`  | Dashboard widgets and overview stats        |

**Rule:** Do not import another feature's internal files. Import only from that feature's `index.ts`.

**Rule:** Call the backend API only — never use Supabase client directly.

---

## `src/shared/`

Reusable code used across multiple features and pages.

### `shared/components/`

| Folder      | Purpose                                                   |
| ----------- | --------------------------------------------------------- |
| `ui/`       | shadcn/ui primitives — Button, Input, Dialog, Table, etc. |
| `layout/`   | Sidebar, header, page shell, navigation                   |
| `feedback/` | Loading spinner, toast notifications (bottom, 5s timeout) |

### Other shared folders

| Folder       | Purpose                                            |
| ------------ | -------------------------------------------------- |
| `hooks/`     | Reusable hooks — `usePermission`, `useToast`, etc. |
| `lib/`       | API base client, `cn()` helper, formatters         |
| `providers/` | Context providers — theme (light/dark), auth state |
| `types/`     | Shared TypeScript types used by multiple features  |
| `constants/` | Shared colors, roles, route paths                  |
| `utils/`     | Pure helper functions                              |

**Rule:** If a component or hook is used in more than one feature, move it to `shared/`.

---

## `public/`

Static files served as-is — logo, favicon, placeholder images.

---

## Quick Decision Guide

```
Is it a route / page URL?
  → src/app/(group)/<route>/page.tsx

Is it UI or logic for ONE module (students, fees, etc.)?
  → src/features/<name>/

Is it reused across multiple features (button, spinner, sidebar)?
  → src/shared/

Is it a static image or icon?
  → public/
```

---

## Page → Feature Mapping

| Route         | Feature folder         |
| ------------- | ---------------------- |
| `/`           | `features/tenant/`     |
| `/login`      | `features/auth/`       |
| `/students`   | `features/student/`    |
| `/teachers`   | `features/teacher/`    |
| `/academic`   | `features/academic/`   |
| `/attendance` | `features/attendance/` |
| `/fees`       | `features/fees/`       |
| `/exams`      | `features/exam/`       |
| `/notices`    | `features/notice/`     |

---

## Data Flow

```
Page (app/)
  → Feature Component (features/<name>/components/)
  → Feature Hook (features/<name>/hooks/)
  → Feature API (features/<name>/api/)
  → Shared API Client (shared/lib/api-client.ts)
  → Backend Express API
```
