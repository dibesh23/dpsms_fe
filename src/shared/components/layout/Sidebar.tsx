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
  CreditCardIcon,
  FileTextIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  GroupIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LogOutIcon,
  MenuIcon,
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
        label: "My Students",
        href: "/my-students",
        icon: UsersIcon,
        permission: PERMISSIONS.TEACHER_OWN_CLASSES_VIEW,
      },
      {
        label: "My Subjects",
        href: "/my-subjects",
        icon: BookOpenIcon,
        permission: PERMISSIONS.ACADEMIC_SUBJECT_LIST,
      },
      {
        label: "Attendance",
        href: "/attendance/students",
        icon: CheckCircle2Icon,
        permission: PERMISSIONS.ATTENDANCE_STUDENT_MARK,
      },
      {
        label: "Class Tests",
        href: "/class-tests",
        icon: FileTextIcon,
        permission: PERMISSIONS.EXAM_OWN_VIEW,
      },
      {
        label: "Messaging",
        href: "/messaging",
        icon: BellIcon,
        permission: PERMISSIONS.MESSAGING_OWN_VIEW,
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
        label: "My Timetable",
        href: "/timetable",
        icon: CalendarDaysIcon,
        permission: PERMISSIONS.TIMETABLE_OWN_VIEW,
      },
      {
        label: "My Report Card",
        href: "/report-card",
        icon: FileTextIcon,
        permission: PERMISSIONS.EXAM_OWN_VIEW,
      },
      {
        label: "Test Results",
        href: "/test-results",
        icon: BookOpenIcon,
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
      {
        label: "Live Class",
        href: "/live-class",
        icon: GroupIcon,
        permission: PERMISSIONS.LIVE_CLASS_OWN_VIEW,
      },
    ],
  },
];

function roleLabel(role?: string): string {
  return (role && ROLE_LABELS[role]) ?? "Staff";
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, can } = useAuth();
  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4">
      {NAV_SECTIONS.map((section) => {
        const roleMatch = !section.roles || (user?.role && section.roles.includes(user.role));
        if (!roleMatch) return null;
        const visibleItems = section.items.filter((item) => can(item.permission));
        if (visibleItems.length === 0) return null;
        return (
          <div key={section.label}>
            <p className="px-3 pb-2 pt-5 text-xs font-medium tracking-wider text-neutral-400 uppercase">
              {section.label}
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
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-bg-subtle font-medium text-neutral-900"
                          : "text-neutral-500 hover:bg-bg-subtle/70 hover:text-neutral-900",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 flex-none",
                          active ? "text-neutral-900" : "text-neutral-400",
                        )}
                      />
                      {item.label}
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

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 flex-none items-center border-b border-neutral-100 px-5">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Digital Pathshala dashboard">
          <Wordmark className="h-6" />
        </Link>
      </div>

      <NavList onNavigate={onNavigate} />

      <div className="flex-none border-t border-neutral-100 p-3">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-bg-subtle/70"
          aria-label="Open profile"
        >
          <Avatar name={user?.fullName ?? "User"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900">{user?.fullName}</p>
            <p className="truncate text-xs text-neutral-500">{roleLabel(user?.role)}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Log out"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-bg-subtle hover:text-neutral-700"
          >
            <LogOutIcon className="size-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-neutral-100 bg-bg-default lg:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-neutral-100 bg-bg-default/80 px-4 backdrop-blur lg:hidden">
        <Link href="/dashboard" aria-label="Digital Pathshala dashboard">
          <Wordmark className="h-6" />
        </Link>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition-colors hover:bg-bg-muted"
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
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-bg-default shadow-xl animate-drawer-in">
            <div className="flex h-14 flex-none items-center justify-end border-b border-neutral-100 pr-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-bg-subtle hover:text-neutral-800"
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
