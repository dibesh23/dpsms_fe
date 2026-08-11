# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

All roles are first-class audiences with dedicated interfaces: school administrators (SUPER_ADMIN), principals, teachers, students, and guardians (contact records). Each role has its own job and view; no single role dominates the product's design.

## Product Purpose

DP-SMS (Digital Pathshala School Management System) is a multi-tenant school management platform that runs the operations of Nepali schools — student and teacher records, enrollment and promotion, attendance, exams and grades, fees and receipts, transport, and notices — from a single web application.

## Positioning

Multi-tenant SaaS simplicity. One instance serves many schools cheaply, and the standout is per-school onboarding and setup: a school provisions a tenant, configures its name, timezone, and academic structure, and is running without bespoke deployment. Modern web tooling and a clean interface distinguish it from the legacy software Nepali schools commonly use.

## Operating Context

- Built for Nepali schools; default timezone is Asia/Kathmandu.
- Roles: SUPER_ADMIN, PRINCIPAL, TEACHER, STUDENT (permissions model, onboarding, and per-role flows).
- Onboarding steps: complete profile, set up school details, invite staff.
- Auth: local email/password and Google OAuth, refresh-token sessions, password reset, email verification.
- Fee management covers types, structures, installments, invoices, discounts, scholarships, payments, and receipts; payments are recorded by staff (cash, bank, cheque, other).

## Capabilities and Constraints

Confirmed in the data model (schema.prisma v2.0):

- Multi-tenancy: single database, shared schema, tenantId discriminator per school; schools have a subdomain and optional custom domain.
- Domains: identity & access (users, roles, permissions, refresh/password-reset/email-verification tokens, onboarding records), academic structure (academic years, classes, shifts, houses, sections, subjects), student domain (students, enrollments, guardians, documents, section history), teacher domain (teachers, school memberships, class and subject assignments), attendance (student and staff), fees, transport assignments, examinations (types, grade scales, exams, results with approval flow), academic-year promotion (batches, records, revert), notices (recipient scopes, attachments), cross-cutting (attachments, audit log, email job queue).
- Auth: local and Google OAuth; user statuses ACTIVE/INVITED/DISABLED; school statuses ACTIVE/SUSPENDED/TRIAL.
- Reserved/future modules (defined in schema but not yet live): parent–student links, terms/semesters, transport routes/stops, hostel, library, online payment transactions/refunds, notification log, biometric attendance.
- Technical: PostgreSQL via Supabase, Prisma, Redis (rate limiting, queues), Express 5, Next.js 16, React 19, Tailwind CSS v4, TypeScript.

## Brand Commitments

- Product name: DP-SMS, full name "Digital Pathshala School Management System."
- "Digital Pathshala" is a real brand with existing logo and visual identity that must be preserved, not reinvented.
- Public-facing copy refers to "built for Nepali schools" and credits "Digital Pathshala Nepal."

## Evidence on Hand

- Backend schema: `../DP-SMS-BACKEND/schema.prisma` (consolidated production schema v2.0).
- The schema's header references a companion spec, `DPSMS_Merged_Schema_SRS.md`; that file is not present in the repo — future work must not fabricate requirements attributed to it.
- No real customer data, testimonials, case studies, or pricing exist in the repo; these must not be invented.

## Product Principles

- Every role gets a real interface; students, teachers, and guardians are not afterthoughts to admin screens.
- Setup is the differentiator: onboarding a school should feel fast and guided, never like a deployment.
- Data integrity is non-negotiable: enrollments, attendance, payments, and audit logs are immutable or strictly audited.
- Modern industry-standard accessibility and interaction quality (see below), not legacy-school-software patterns.

## Accessibility & Inclusion

No product-specific requirement beyond matching modern industry standards (current WCAG guidance and accessible interaction defaults) — no higher or lower bar has been set.
