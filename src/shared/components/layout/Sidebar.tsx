"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { Wordmark } from "../ui/wordmark";
import { Avatar } from "../ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS, ROLE_LABELS } from "@/shared/permissions";
import {
  BellIcon,
  BookOpenIcon,
  BookUserIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LogOutIcon,
  MenuIcon,
  ShieldIcon,
  UsersIcon,
  XIcon,
} from "../ui/icons";

const NAV_SECTIONS: Array<{
  label: string;
  roles?: readonly string[];
  items: Array<{
    label: string;
    href: string;
    icon: typeof LayoutDashboardIcon;
    permission?: string;
  }>;
}> = [
  {
    label: "Management",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon,
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
    ],
  },
  {
    label: "People",
    roles: ["SUPER_ADMIN", "PRINCIPAL"],
    items: [
      {
        label: "Students",
        href: "/students",
        icon: UsersIcon,
        permission: PERMISSIONS.STUDENT_LIST,
      },
      {
        label: "Teachers",
        href: "/teachers",
        icon: GraduationCapIcon,
        permission: PERMISSIONS.TEACHER_LIST,
      },
      {
        label: "Parents",
        href: "/parents",
        icon: HeartHandshakeIcon,
        permission: PERMISSIONS.PARENT_LIST,
      },
      { label: "Staff", href: "/staff", icon: BriefcaseIcon, permission: PERMISSIONS.STAFF_LIST },
    ],
  },
  {
    label: "Attendance",
    roles: ["SUPER_ADMIN", "PRINCIPAL"],
    items: [
      {
        label: "Class Attendance",
        href: "/attendance/students",
        icon: ClipboardCheckIcon,
        permission: PERMISSIONS.ATTENDANCE_STUDENT_LIST,
      },
      {
        label: "Staff Attendance",
        href: "/attendance/staff",
        icon: ClipboardCheckIcon,
        permission: PERMISSIONS.ATTENDANCE_STAFF_LIST,
      },
    ],
  },
  {
    label: "Academic",
    roles: ["SUPER_ADMIN", "PRINCIPAL"],
    items: [
      {
        label: "Classes",
        href: "/classes",
        icon: LayoutGridIcon,
        permission: PERMISSIONS.ACADEMIC_CLASS_LIST,
      },
      {
        label: "Teacher Assignments",
        href: "/teacher-assignments",
        icon: BookUserIcon,
        permission: PERMISSIONS.TEACHER_ASSIGNMENT_MANAGE,
      },
      {
        label: "Departments",
        href: "/departments",
        icon: Building2Icon,
        permission: PERMISSIONS.ACADEMIC_DEPARTMENT_LIST,
      },
      {
        label: "Subjects",
        href: "/subjects",
        icon: BookOpenIcon,
        permission: PERMISSIONS.ACADEMIC_SUBJECT_LIST,
      },
      {
        label: "Academic Sessions",
        href: "/academic-sessions",
        icon: CalendarDaysIcon,
        permission: PERMISSIONS.ACADEMIC_SESSION_LIST,
      },
      {
        label: "Timetables",
        href: "/timetable",
        icon: ClockIcon,
        permission: PERMISSIONS.TIMETABLE_VIEW,
      },
    ],
  },
  {
    label: "Finance",
    roles: ["SUPER_ADMIN", "PRINCIPAL"],
    items: [
      {
        label: "Fee Types",
        href: "/fees/types",
        icon: CreditCardIcon,
        permission: PERMISSIONS.FEE_TYPE_MANAGE,
      },
      {
        label: "Fee Structures",
        href: "/fees/structures",
        icon: LayoutGridIcon,
        permission: PERMISSIONS.FEE_STRUCTURE_MANAGE,
      },
      {
        label: "Invoices",
        href: "/fees/invoices",
        icon: FileTextIcon,
        permission: PERMISSIONS.FEE_INVOICE_LIST,
      },
    ],
  },
  {
    label: "Examinations",
    roles: ["SUPER_ADMIN", "PRINCIPAL"],
    items: [
      {
        label: "Exams",
        href: "/exams",
        icon: FileTextIcon,
        permission: PERMISSIONS.EXAM_LIST,
      },
      {
        label: "Exam Types",
        href: "/exam-types",
        icon: ClipboardCheckIcon,
        permission: PERMISSIONS.EXAM_CREATE,
      },
    ],
  },
  {
    label: "Promotion",
    roles: ["SUPER_ADMIN", "PRINCIPAL"],
    items: [
      {
        label: "Batch Promotion",
        href: "/promotion/batch",
        icon: GraduationCapIcon,
        permission: PERMISSIONS.PROMOTION_BATCH_RUN,
      },
      {
        label: "Review Failed",
        href: "/promotion/review",
        icon: ClipboardCheckIcon,
        permission: PERMISSIONS.PROMOTION_REVIEW,
      },
      {
        label: "Promotion History",
        href: "/promotion/history",
        icon: FileTextIcon,
        permission: PERMISSIONS.PROMOTION_VIEW,
      },
    ],
  },
  {
    label: "Communication",
    roles: ["SUPER_ADMIN", "PRINCIPAL"],
    items: [
      {
        label: "Notices",
        href: "/notices",
        icon: BellIcon,
        permission: PERMISSIONS.NOTICE_LIST,
      },
    ],
  },
  {
    label: "Administration",
    roles: ["SUPER_ADMIN", "PRINCIPAL"],
    items: [
      {
        label: "Audit Logs",
        href: "/audit-logs",
        icon: ShieldIcon,
        permission: PERMISSIONS.AUDIT_LOG_READ,
      },
    ],
  },
  {
    label: "Teaching",
    roles: ["TEACHER"],
    items: [
      {
        label: "My Classes",
        href: "/my-classes",
        icon: LayoutGridIcon,
        permission: PERMISSIONS.TEACHER_OWN_CLASSES_VIEW,
      },
      {
        label: "My Timetable",
        href: "/my-timetable",
        icon: ClockIcon,
        permission: PERMISSIONS.TIMETABLE_VIEW,
      },
      {
        label: "My Students",
        href: "/my-students",
        icon: UsersIcon,
        permission: PERMISSIONS.TEACHER_OWN_CLASSES_VIEW,
      },
      {
        label: "Attendance",
        href: "/attendance/students",
        icon: CheckCircle2Icon,
        permission: PERMISSIONS.ATTENDANCE_STUDENT_MARK,
      },
      {
        label: "Assignments",
        href: "/manage-assignments",
        icon: BookUserIcon,
        permission: PERMISSIONS.ASSIGNMENT_MANAGE,
      },
      {
        label: "Exams",
        href: "/exams",
        icon: ClipboardCheckIcon,
        permission: PERMISSIONS.EXAM_LIST,
      },
      {
        label: "Notices",
        href: "/notices",
        icon: BellIcon,
        permission: PERMISSIONS.NOTICE_OWN_VIEW,
      },
    ],
  },
  {
    label: "Academics",
    roles: ["STUDENT"],
    items: [
      {
        label: "Attendance History",
        href: "/attendance-history",
        icon: CheckCircle2Icon,
        permission: PERMISSIONS.ATTENDANCE_OWN_VIEW,
      },
      {
        label: "My Report Card",
        href: "/report-card",
        icon: FileTextIcon,
        permission: PERMISSIONS.EXAM_OWN_VIEW,
      },
      {
        label: "Exam Result",
        href: "/exam-results",
        icon: GraduationCapIcon,
        permission: PERMISSIONS.EXAM_OWN_VIEW,
      },
      {
        label: "Home Assignments",
        href: "/assignments",
        icon: BookUserIcon,
        permission: PERMISSIONS.ASSIGNMENT_OWN_VIEW,
      },
      {
        label: "My Timetable",
        href: "/my-timetable",
        icon: ClockIcon,
        permission: PERMISSIONS.TIMETABLE_VIEW,
      },
    ],
  },
  {
    label: "Finance",
    roles: ["STUDENT"],
    items: [
      {
        label: "Fees & Payments",
        href: "/fees",
        icon: CreditCardIcon,
        permission: PERMISSIONS.FEE_OWN_VIEW,
      },
      {
        label: "Admission Letter",
        href: "/admission-letter",
        icon: FileTextIcon,
        permission: PERMISSIONS.ADMISSION_LETTER_VIEW,
      },
    ],
  },
  {
    label: "Other",
    roles: ["STUDENT"],
    items: [
      {
        label: "Notices",
        href: "/notices",
        icon: BellIcon,
        permission: PERMISSIONS.NOTICE_OWN_VIEW,
      },
    ],
  },
];

function roleLabel(role?: string): string {
  return (role && ROLE_LABELS[role]) ?? "Staff";
}

function NavList({ onNavigate, expanded = true }: { onNavigate?: () => void; expanded?: boolean }) {
  const pathname = usePathname();
  const { user, can } = useAuth();
  return (
    <nav className="sidebar-scrollbar flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4">
      {NAV_SECTIONS.map((section) => {
        const roleMatch = !section.roles || (user?.role && section.roles.includes(user.role));
        if (!roleMatch) return null;
        const visibleItems = section.items.filter((item) => can(item.permission));
        if (visibleItems.length === 0) return null;
        return (
          <div key={section.label}>
            <p className="h-9 overflow-hidden px-3 pb-2 pt-5 text-xs font-medium tracking-wider whitespace-nowrap text-[#52705b] uppercase">
              <span className={cn(!expanded && "invisible group-hover/sidebar:visible")}>
                {section.label}
              </span>
            </p>
            <ul className="space-y-0.5">
              {visibleItems.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        active
                          ? "bg-[#125d31] font-medium text-white shadow-sm"
                          : "font-medium text-[#294d35] hover:bg-white/55 hover:text-[#0d3320]",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 flex-none",
                          active ? "text-[#bbf7d0]" : "text-[#52705b]",
                        )}
                      />
                      <span
                        className={cn(
                          "whitespace-nowrap",
                          !expanded && "invisible group-hover/sidebar:visible",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  onNavigate,
  expanded = true,
  onToggle,
}: {
  onNavigate?: () => void;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex h-16 flex-none items-center border-b border-[#b8d4c0] px-5">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Digital Pathshala dashboard">
          <Wordmark textClassName={cn(!expanded && "invisible group-hover/sidebar:visible")} />
        </Link>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="absolute right-0 flex h-8 w-8 translate-x-1/2 items-center justify-center rounded-full border border-emerald-800 bg-white text-[#125d31] shadow-sm transition hover:bg-emerald-50"
          >
            <MenuIcon className="size-4" />
          </button>
        )}
      </div>

      <NavList onNavigate={onNavigate} expanded={expanded} />

      <div className="flex-none border-t border-[#b8d4c0] p-3">
        <div className="flex items-center gap-3 overflow-hidden rounded-lg px-2 py-2">
          <Link
            href="/profile"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-white/55"
            aria-label="Open profile"
          >
            <Avatar name={user?.fullName ?? "User"} size="sm" />
            <div
              className={cn("min-w-0 flex-1", !expanded && "invisible group-hover/sidebar:visible")}
            >
              <p className="truncate text-sm font-medium text-[#173d24]">{user?.fullName}</p>
              <p className="truncate text-xs text-[#52705b]">{roleLabel(user?.role)}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Log out"
            className={cn(
              "flex h-8 w-8 flex-none items-center justify-center rounded-md text-[#52705b] transition-colors hover:bg-white/55 hover:text-[#0d3320]",
              !expanded && "invisible group-hover/sidebar:visible",
            )}
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  onDesktopExpandedChange,
}: {
  onDesktopExpandedChange?: (expanded: boolean) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const desktopExpanded = expanded || hovered;

  const setDesktopHover = (value: boolean) => {
    setHovered(value);
    onDesktopExpandedChange?.(expanded || value);
  };

  const toggleDesktopSidebar = () => {
    const nextExpanded = !expanded;
    setExpanded(nextExpanded);
    onDesktopExpandedChange?.(nextExpanded || hovered);
  };

  return (
    <>
      <aside
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-30 hidden bg-[#cfe4d6] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
          desktopExpanded ? "w-60" : "w-20",
        )}
        onMouseEnter={() => setDesktopHover(true)}
        onMouseLeave={() => setDesktopHover(false)}
      >
        <SidebarContent expanded={desktopExpanded} onToggle={toggleDesktopSidebar} />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#b8d4c0] bg-[#cfe4d6]/95 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="Digital Pathshala dashboard">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#a8cab2] text-[#173d24] transition-colors hover:bg-white/55"
        >
          <MenuIcon className="size-4" />
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-neutral-900/40 animate-overlay-in"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#cfe4d6] shadow-xl animate-drawer-in">
            <div className="flex h-14 flex-none items-center justify-end border-b border-[#b8d4c0] pr-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#52705b] transition-colors hover:bg-white/55 hover:text-[#0d3320]"
              >
                <XIcon className="size-4" />
              </button>
            </div>
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
