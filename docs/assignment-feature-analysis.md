# DP-SMS Frontend — Assignment Feature: Pattern Analysis (T0)

This document catalogs the established frontend patterns discovered before building the
assignment UI. Every T1–T5 implementation step reuses these patterns and shared components —
**no new libraries, no new component patterns.**

App: Next.js 16 (App Router) + React 19 + TypeScript 6 + Tailwind 4.
Dependencies: `react-hook-form`, `@hookform/resolvers`, `zod`, `axios`.

---

## 1. Form Handling & Validation

- **Library:** `react-hook-form` + `zodResolver` from `@hookform/resolvers/zod`.
- **Validation:** Zod schema in the component file (`const XSchema = z.object({...})`),
  resolved by `zodResolver`. Client-side only; server errors surfaced separately.
- **Wiring:** `useForm<T>({ resolver })`, `register`, `handleSubmit`, `formState.errors`.
- **Layout primitives (shared):**
  - `Field` / `Select` — `@/shared/components/ui/form-field` (`Field` wraps a label + error + hint).
  - `Input` — `@/shared/components/ui/input` (accepts `error?: string`, renders inline red message).
  - `Button` — `@/shared/components/ui/button` (`variant`, `loading`, `text`, `icon`).
- **Field errors:** inline via `<Field error={errors.x?.message}>`.
- **Server/API errors:** a local `apiError` state rendered as a red banner
  (`role="alert"` div) above the submit row; the submit handler returns `string | null`
  instead of throwing.
- **Submit flow:** forms receive an `onAdd`/`onSave` callback from the parent page that
  does the API call, toasts on success, closes the dialog, and returns an error string on
  failure. The page owns the API call; the form owns the field layout.
- **Multi-field example:** `features/exam/components/AddExamForm.tsx` (name + two selects +
  dynamic subject rows). Dynamic rows use local `rows` state + `updateRow`/`removeRow`.

### File input inside forms
Handled **outside** react-hook-form (see §2). Files live in a separate `newFiles: File[]`
state using a `useRef<HTMLInputElement>` and are uploaded on submit.

---

## 2. File Upload UI

- **Component:** native `<input type="file">` + a dashed "Add file" button that triggers
  `fileInputRef.current?.click()`. **No drag-and-drop, no upload-on-select** — files are held
  locally and uploaded on form submit.
- **Canonical example:** `features/notice/components/AdminNoticePage.tsx`:
  - `ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png,.webp"` (matches backend ALLOWED_TYPES).
  - `newFiles: File[]` state; each chip shows name + `formatBytes(size)` + remove button.
  - Upload on submit via `noticeApi.uploadAttachment(id, file)` (multipart `FormData`).
  - Per-file failures toast (`error(\`Failed to upload ${file.name}\`)`); non-fatal.
- **Size limits:** enforced client-side only implicitly (backend enforces 5MB); no
  explicit frontend size check in the notice flow.
- **Progress:** no progress bar — the submit `Button` shows `loading` spinner state.
- **File IDs passed to API:** The notice flow uploads **immediately to the parent record's
  endpoint** (the notice already exists) and the server links it. For assignments with a
  *join-table* attachment model, the backend upload endpoint is per-assignment
  (`POST /assignments/:id/attachments`) and per-submission
  (`POST /assignments/:id/submissions/:submissionId/attachments`), so the pattern becomes:
  **create the assignment/submission first, then upload its files**, collecting returned
  attachment objects for display. The student submit endpoint additionally accepts an
  `attachmentIds: string[]` payload (`StudentSubmissionSchema`), so the student flow
  uploads files to an existing submission then optionally submits with their ids.

### Download / open
- `noticeApi.openAttachment(id, attachmentId, label)` fetches a **blob** via the authed
  `apiClient`, builds an object URL, and opens it in a new tab (never uses the raw URL so
  auth headers are present). Reuse this exact helper pattern for assignment/submission
  attachment downloads (assignment host endpoint differs).

---

## 3. List / Pagination UI

- **Pattern:** single shared table stack. **Client-side** search/filter/sort/paginate via
  `useTable`, then render with `DataTable` + `Pagination`.
- **Components (all shared):**
  - `useTable` — `@/shared/hooks/useTable` (query, filter, sort, page, pageRows, total).
  - `DataTable` / `Column` — `@/shared/components/ui/data-table`.
  - `Pagination` — `@/shared/components/ui/pagination`.
  - `FilterDropdown` — `@/shared/components/ui/filter-dropdown`.
  - `SearchBar` — `@/shared/components/ui/search-bar`.
  - `RowActions` — `@/shared/components/ui/row-actions` (kebab menu; supports `href`, `onClick`, `danger`).
  - `StatusBadge` / `statusVariant` — `@/shared/components/ui/status-badge`.
  - `EmptyState` — `@/shared/components/ui/empty-state`.
- **Example:** `features/exam/components/ExamsPage.tsx`, `features/student/components/StudentsPage.tsx`.
- **Query params to API:** the backend list endpoints are paginated
  (`{items,total,page,pageSize}`), but the existing pages **fetch the full list**
  (or a large pageSize) and let `useTable` do all client-side filtering/pagination with
  `page: table.page`, `onPageChange: table.setPage`, `total: table.total`.
- **Layout:** `PageHeader (title/description/actions)` → filter+search row → `DataTable`
  (with `empty` + `footer=<Pagination/>`) → create/edit/delete `Dialog`s.

---

## 4. Permission Checking (Frontend)

- **Source:** `useAuth()` from `@/features/auth/hooks/useAuth` (re-exports
  `shared/providers/AuthProvider`). Provides `can(permission): boolean` and
  `hasRole(role): boolean`.
- **Keys:** `PERMISSIONS` object + `PermissionKey` type in `@/shared/permissions`.
- **Logic (`AuthProvider.tsx`):** `can(permission)` returns true if
  `user.permissions` (from server login response) includes it, **or** if the user's role has
  it in `ROLE_FALLBACK_PERMISSIONS` (client fallback map keyed by role).
- **Usage:** `const canCreate = can(PERMISSIONS.X);` then conditionally render buttons,
  `RowActions`, and `Dialog`s. `RequireRole roles={ADMIN_ROLES}` wraps route pages for
  admin-only screens.
- **Role fallback maps to update (T1):** `ROLE_FALLBACK_PERMISSIONS["TEACHER"]` and
  `["STUDENT"]` in `AuthProvider.tsx` must include the new assignment keys.
- **Permission keys to ADD (T1)** to `@/shared/permissions` — matching the backend keys
  (`src/shared/permissions/permissionKeys.ts`):
  - `ASSIGNMENT_CREATE: "assignments:create"`
  - `ASSIGNMENT_MANAGE: "assignments:manage"`
  - `ASSIGNMENT_GRADE: "assignments:grade"`
  - `ASSIGNMENT_OWN_SUBMIT: "assignments:own:submit"`
  - (existing) `ASSIGNMENT_OWN_VIEW: "assignments:own:view"`

---

## 5. Modal / Dialog Patterns

- **Library:** custom `Dialog` (`@/shared/components/ui/dialog`). No Radix/shadcn.
- **Props:** `open`, `onClose`, `title`, `description?`, `maxWidth?`, `children`.
  Closes on Escape / overlay click.
- **Wiring:** parent-page state. Two variants:
  - Boolean: `const [createOpen, setCreateOpen] = useState(false)`.
  - Object-target: `const [deleteTarget, setDeleteTarget] = useState<T | null>(null)` and
    `open={deleteTarget !== null}`.
- **Data passing:** via props to the inner form component (e.g. `initial`, `onAdd`, `onClose`).
- **Example:** `ExamsPage.tsx` (create dialog + delete-confirm dialog), `StudentsPage.tsx`
  (also a `CredentialsRevealDialog`). Confirm pattern: explanation text + Cancel / danger button.

---

## 6. Component Folder Structure

- **`src/app/(dashboard)/<route>/page.tsx`** — **thin** page files only; wrap the feature
  component (optionally in `RequireRole`) and import from `@/features/...`. No logic/API in pages.
- **`src/features/<feature>/`** — mirrors backend feature folders:
  - `api/<feature>Api.ts` (and a separate `student<Feature>Api.ts` for student-scoped calls)
  - `components/*.tsx`
  - `hooks/*.ts` (feature-specific)
- **`src/shared/`** — cross-feature: `components/ui/*` (primitives), `components/layout/*`
  (Sidebar), `hooks/useTable.ts`, `lib/*` (apiClient, cn, format), `providers/*`, `permissions.ts`.
- **Naming:** PascalCase feature components (`AddExamForm`, `ExamsPage`, `StudentNoticePage`);
  lowercase shared primitives (`button`, `dialog`, `status-badge`).
- **Assignment plan (T1–T4):** new `src/features/assignment/{api,components}` mirroring
  `features/exam`. Pages: reuse `app/(dashboard)/assignments/page.tsx` (student; currently a
  `ComingSoon` stub) and add a teacher route. The existing `teacher-assignments` page is a
  **different feature** (teacher→section assignment) and must be left alone.

---

## 7. API Call Patterns

- **Client:** axios `apiClient` from `@/shared/lib/apiClient` (baseURL `/api`, Bearer token,
  401 refresh retry).
- **Shape:** a feature-level service object `export const xxxApi = { async method(): Promise<T> {...} }`.
  Methods unwrap `data.data` from `{ data: ... }`.
- **Types:** interfaces declared at top of the `api` file mirroring backend DTOs.
- **List helper:** `getItems<T>(path)` in `academicApi` unwraps `{data:{items}}`.
- **Error handling:** callers use try/catch. A local `getApiErrorMessage(err, fallback)`
  reads `err.response.data.error.message` (duplicated in several pages). Toast on failure,
  or return the message string up to the form banner.
- **Example:** `features/exam/api/examApi.ts`, `features/notice/api/noticeApi.ts`.

---

## 8. Error Handling & User Feedback

- **Toast:** custom `useToast()` from `@/shared/components/ui/toast` (`success`, `error`,
  `info`). Wired globally via `ToastProvider`.
- **Form server errors:** inline red `apiError` banner + `<Field error>`.
- **List action errors:** `toast.error(getApiErrorMessage(...))`.
- **Pattern:** page-level `can` guards prevent rendering unsupported actions; API otherwise.

---

## 9. Loading States

- `LoadingState` (`label="Loading…"`) — centered spinner block; returned when `loading` is true.
- `Button loading` — inline spinner, disables + shows `<text>…` label while pending.
- State tracked with a plain `loading`/`isSubmitting`/`saving` boolean (`useState`).
- No React Query / SWR anywhere.

---

## 10. Dashboard Card / Widget Patterns

- `DashboardWidget` (`@/shared/components/ui/dashboard-widget`) — titled card with
  optional `description`, `action`, `children`; used for lists/metrics sections.
- `StatsCard` (`@/shared/components/ui/stats-card`) — metric tile (`label`, `value`, `delta`,
  `href`, `icon`).
- **Example:** `features/dashboard/components/TeacherDashboardPage.tsx` composes
  `DashboardWidget`s (sections, attendance, events, notices) and `StatsCard`s in a grid.
  `DashboardNoticesWidget` (`role={...}` `limit={...}`) shows the reusable per-role
  data-widget pattern.
- Student dashboard: `features/dashboard/components/StudentDashboardPage.tsx`.

---

## 11. Teacher / Student-Specific UI

- **Teacher dashboard** (`TeacherDashboardPage.tsx`): header + stats grid + profile panel +
  `DashboardWidget` reports. Role-specific dashboards exist per role in `features/dashboard/`.
- **Teacher pages** (`features/teacher/`, routes `/my-classes`, `/my-subjects`, `/my-students`).
  Teacher's own sections resolved via `academicApi.getMyAssignedClasses()` (grouped by class).
- **Student pages** (`features/student/`, routes `/assignments`, `/fees`, `/notices`, `/exam-results`).
  `StudentNoticePage` shows the canonical student list + detail-dialog pattern.
- **Sidebar** (`shared/components/layout/Sidebar.tsx`) groups nav by role (`roles:`),
  filters items by `can(permission)`. Student already has "Home Assignments"
  (`/assignments`, `ASSIGNMENT_OWN_VIEW`). T5 adds a teacher "Assignments" item to the
  `Teaching` section guarded by the new manage/create permission.

---

## 12. Date/Time Picker Components

- **No date-picker library.** Uses native `<Input type="date">` (or `type="datetime-local"`).
- **Formatting to API:** notice uses
  `new Date(values.scheduledAt).toISOString()` for datetime; edit forms use
  `new Date(x).toISOString().slice(0,16)` for `datetime-local` prefill.
- **Backend assignment contract:** `dueDate` is a **plain date string `YYYY-MM-DD`**
  (`z.string()` DTO → `DateTime @db.Date`). Frontend will use `<Input type="date">` and send
  the raw `value` string (matches `StudentTransferForm.effectiveDate`/student dateOfBirth pattern).
- Display via shared `formatDate` (`@/shared/lib/format`).

---

## 13. File / Attachment Display

- **Pattern:** `AttachmentChip` — icon + label button (opens via blob), size via
  `formatBytes`, optional delete `TrashIcon`. See `AdminNoticePage.tsx` and
  `StudentNoticePage.tsx` (local `formatBytes` helpers).
- No image/PDF inline preview; opens in a new tab via `openAttachment`.
- Reuse this chip for assignment reference materials and submission attachments.

---

## Dependencies available (package.json)

`react-hook-form`, `@hookform/resolvers`, `zod`, `axios`, `next`, `react`, `tailwindcss`.
Shared UI primitives in `shared/components/ui/*` provide everything else. **No new deps needed.**

## Confirmed decisions (user-approved)

- **Teacher routing:** new `/manage-assignments` route. `/assignments` stays student-facing;
  `/teacher-assignments` is the unrelated teacher→section feature and is untouched.
- **Student routing:** dedicated `/assignments/[id]` detail pages (like `/exams/[id]`), with
  a back link and full layout. The list page `/assignments` links into them.

## Improvisations / gaps (must be noted during implementation)

1. **Permissions keys** (`assignments:create/manage/grade/own:submit`) are absent from the
   frontend `permissions.ts` and `ROLE_FALLBACK_PERMISSIONS` — added in T1 (backend already has them).
2. **Attachment hold-until-create:** banked per-entity attachment upload (join tables) means
   files upload *after* the assignment/submission is created, then `attachmentIds` sent on submit.
3. **Teacher route/naming:** `/assignments` is the student route. Teacher gets a separate
   route (e.g. `/manage-assignments`) OR teacher section in the same feature file split by
   `useAuth().hasRole`. The existing `/teacher-assignments` (teacher→section) is unrelated.
4. **Student submission attachments:** backend has no "create submission then upload" bulk
   step exposed in the spec outside the per-submission upload endpoint; the student flow will
   upload to an existing submission and/or pass `attachmentIds` on submit.
5. **No frontend test/DTO fixtures for assignments** — consistent with exam/notice (no UI tests).
