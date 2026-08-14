import type { RoleName } from "@/features/auth/types";
import {
  BookOpenIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  GraduationCapIcon,
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
 * The Sidebar component is role-agnostic — it just renders whatever
 * section list this map resolves to for the current user.
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

  // Placeholder — expand this array once the teacher dashboard and
  // its supporting pages (attendance marking, class tests, etc.) ship.
  TEACHER: [
    {
      label: "Management",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon }],
    },
  ],

  STUDENT: [
    {
      label: "Management",
      items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon }],
    },
  ],
};

const FALLBACK_SECTIONS: NavSection[] = NAV_CONFIG.PRINCIPAL;

export function getNavSections(role?: RoleName): NavSection[] {
  if (!role) return FALLBACK_SECTIONS;
  return NAV_CONFIG[role] ?? FALLBACK_SECTIONS;
}