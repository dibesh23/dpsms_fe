import type { RoleName } from "@/features/auth/types";
import {
  BellIcon,
  BookOpenIcon,
  BookUserIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  FileTextIcon,
  GraduationCapIcon,
  GroupIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

export interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboardIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Single source of truth for sidebar navigation, keyed by role.
 * The Sidebar component stays role-agnostic — it just renders
 * whatever section list this map resolves to.
 *
 * Items marked "// TODO route" point at pages that don't exist
 * yet; add the corresponding app/(dashboard)/<path>/page.tsx
 * before shipping that item.
 */
export const NAV_CONFIG: Record<RoleName, NavSection[]> = {
  SUPER_ADMIN: [
    {
      label: "Management",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon }],
    },
    {
      label: "People",
      items: [
        { label: "Students", href: "/students", icon: UsersIcon },
        { label: "Teachers", href: "/teachers", icon: GraduationCapIcon },
        { label: "Parents", href: "/parents", icon: HeartHandshakeIcon },
        { label: "Staff", href: "/staff", icon: BriefcaseIcon },
      ],
    },
    {
      label: "Academic",
      items: [
        { label: "Classes", href: "/classes", icon: LayoutGridIcon },
        { label: "Departments", href: "/departments", icon: Building2Icon },
        { label: "Subjects", href: "/subjects", icon: BookOpenIcon },
        { label: "Academic Sessions", href: "/academic-sessions", icon: CalendarDaysIcon },
      ],
    },
  ],

  PRINCIPAL: [
    {
      label: "Management",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon }],
    },
    {
      label: "People",
      items: [
        { label: "Students", href: "/students", icon: UsersIcon },
        { label: "Teachers", href: "/teachers", icon: GraduationCapIcon },
        { label: "Parents", href: "/parents", icon: HeartHandshakeIcon },
        { label: "Staff", href: "/staff", icon: BriefcaseIcon },
      ],
    },
    {
      label: "Academic",
      items: [
        { label: "Classes", href: "/classes", icon: LayoutGridIcon },
        { label: "Departments", href: "/departments", icon: Building2Icon },
        { label: "Subjects", href: "/subjects", icon: BookOpenIcon },
        { label: "Academic Sessions", href: "/academic-sessions", icon: CalendarDaysIcon },
      ],
    },
  ],

  TEACHER: [
    {
      label: "Management",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon }],
    },
    {
      label: "Teaching",
      items: [
        { label: "My Classes", href: "/classes", icon: LayoutGridIcon },
        { label: "My Students", href: "/students", icon: UsersIcon },
        { label: "Subjects", href: "/subjects", icon: BookOpenIcon },
        { label: "Attendance", href: "/attendance", icon: BookUserIcon }, // TODO route
        { label: "Class Tests", href: "/class-tests", icon: FileTextIcon }, // TODO route
      ],
    },
    {
      label: "Communication",
      items: [
        { label: "Parents", href: "/parents", icon: HeartHandshakeIcon },
        { label: "Messaging", href: "/messages", icon: BellIcon }, // TODO route
      ],
    },
  ],

  STUDENT: [
    {
      label: "Management",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon }],
    },
    {
      label: "Academics",
      items: [
        { label: "Attendance History", href: "/attendance-history", icon: CheckCircle2Icon },
        { label: "My Timetable", href: "/timetable", icon: CalendarDaysIcon }, // TODO route
        { label: "My Report Card", href: "/report-card", icon: FileTextIcon }, // TODO route
        { label: "Test Results", href: "/test-results", icon: BookOpenIcon }, // TODO route
        { label: "Exam Result", href: "/exam-results", icon: GraduationCapIcon }, // TODO route
        { label: "Home Assignments", href: "/assignments", icon: BookUserIcon }, // TODO route
      ],
    },
    {
      label: "Finance",
      items: [
        { label: "Fees & Payments", href: "/fees", icon: CreditCardIcon },
        { label: "Admission Letter", href: "/admission-letter", icon: FileTextIcon }, // TODO route
      ],
    },
    {
      label: "Other",
      items: [
        { label: "Messaging", href: "/messages", icon: BellIcon }, // TODO route
        { label: "Live Class", href: "/live-class", icon: GroupIcon }, // TODO route
      ],
    },
  ],
};

const FALLBACK_SECTIONS: NavSection[] = NAV_CONFIG.PRINCIPAL;

export function getNavSections(role?: RoleName): NavSection[] {
  if (!role) return FALLBACK_SECTIONS;
  return NAV_CONFIG[role] ?? FALLBACK_SECTIONS;
}