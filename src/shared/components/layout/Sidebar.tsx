"use client";

import { useEffect, useState } from "react";
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
  href?: string;
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
    href: "/finance",
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
    label: "Reports",
    items: [
      {
        label: "Report Generator",
        href: "/reports",
        icon: FileTextIcon,
        permission: PERMISSIONS.REPORT_OWN_REQUEST,
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

function sidebarContentMotion(expanded: boolean): string {
  return cn(
    "transform-gpu will-change-[opacity,transform,filter] transition-[opacity,transform,filter] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-x-0 motion-reduce:blur-none motion-reduce:transition-none",
    expanded
      ? "translate-x-0 blur-none opacity-100 delay-100 duration-500"
      : "pointer-events-none -translate-x-3 blur-[2px] opacity-0 delay-0 duration-200",
  );
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
        const sectionLabel = section.href ? (
          <Link
            href={section.href}
            onClick={onNavigate}
            aria-label={`${section.label} overview`}
            className={cn(
              "flex h-9 items-center overflow-hidden px-3 pb-2 pt-5 text-xs font-medium tracking-wider whitespace-nowrap uppercase transition-colors",
              pathname === section.href ? "text-[#0d3320]" : "text-[#52705b] hover:text-[#0d3320]",
            )}
          >
            <span className={sidebarContentMotion(expanded)}>{section.label}</span>
          </Link>
        ) : (
          <p className="h-9 overflow-hidden px-3 pb-2 pt-5 text-xs font-medium tracking-wider whitespace-nowrap text-[#52705b] uppercase">
            <span className={sidebarContentMotion(expanded)}>{section.label}</span>
          </p>
        );
        return (
          <div key={section.label}>
            {sectionLabel}
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
                        "type-sidebar-navigation flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                        active
                          ? "bg-[#064E3B] font-medium text-white shadow-sm"
                          : "text-[#064E3B] hover:bg-stone-100",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 flex-none",
                          active ? "text-emerald-100" : "text-[#064E3B]",
                        )}
                      />
                      <span className={cn("whitespace-nowrap", sidebarContentMotion(expanded))}>
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
}: {
  onNavigate?: () => void;
  expanded?: boolean;
}) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex h-16 flex-none items-center border-b border-stone-200 px-5">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Digital Pathshala dashboard">
          <Wordmark textClassName={sidebarContentMotion(expanded)} />
        </Link>
      </div>

      <NavList onNavigate={onNavigate} expanded={expanded} />

      <div className="flex-none border-t border-stone-200 p-3">
        <div className="flex items-center gap-3 overflow-hidden rounded-lg px-2 py-2">
          <Link
            href="/profile"
            onClick={onNavigate}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-stone-100"
            aria-label="Open profile"
          >
            <Avatar name={user?.fullName ?? "User"} size="sm" />
            <div className={cn("min-w-0 flex-1", sidebarContentMotion(expanded))}>
              <p className="type-navigation truncate font-normal text-[#064E3B]">
                {user?.fullName}
              </p>
              <p className="type-caption truncate text-[#064E3B]">{roleLabel(user?.role)}</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Log out"
            className={cn(
              "flex h-8 w-8 flex-none items-center justify-center rounded-md text-[#064E3B] hover:bg-stone-100",
              sidebarContentMotion(expanded),
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
  const [hovered, setHovered] = useState(false);
  const desktopExpanded = hovered;

  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [drawerOpen]);

  const setDesktopHover = (value: boolean) => {
    setHovered(value);
    onDesktopExpandedChange?.(value);
  };

  return (
    <>
      <aside
        className={cn(
          "group/sidebar fixed inset-y-0 left-0 z-30 hidden bg-[#FBFAF7] transition-[width,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width] lg:block",
          desktopExpanded ? "w-64" : "w-20",
          desktopExpanded && "shadow-[12px_0_32px_rgba(6,78,59,0.06)]",
        )}
        onMouseEnter={() => setDesktopHover(true)}
        onMouseLeave={() => setDesktopHover(false)}
      >
        <SidebarContent expanded={desktopExpanded} />
      </aside>

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-stone-200 bg-[#FBFAF7]/95 px-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="Digital Pathshala dashboard">
          <Wordmark />
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#064E3B] text-[#064E3B] transition-colors hover:bg-stone-100"
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
          <div
            className="absolute inset-y-0 left-0 flex w-[min(20rem,90vw)] flex-col bg-[#FBFAF7] shadow-xl animate-drawer-in"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex min-h-16 flex-none items-center justify-end border-b border-stone-200 px-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-11 w-11 items-center justify-center rounded-xl text-[#064E3B] transition-colors hover:bg-stone-100"
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
