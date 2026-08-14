"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { Wordmark } from "../ui/wordmark";
import { Avatar } from "../ui/avatar";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getNavSections, type NavSection } from "./navConfig";
import { LogOutIcon, MenuIcon, XIcon } from "../ui/icons";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Administrator",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

function roleLabel(role?: string): string {
  return (role && ROLE_LABELS[role]) ?? "Staff";
}

function NavList({
  sections,
  onNavigate,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="px-3 pb-2 pt-5 text-xs font-medium tracking-wider text-neutral-400 uppercase">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
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
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const sections = getNavSections(user?.role);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 flex-none items-center border-b border-neutral-100 px-5">
        <Link href="/dashboard" onClick={onNavigate} aria-label="Digital Pathshala dashboard">
          <Wordmark className="h-6" />
        </Link>
      </div>

      <NavList sections={sections} onNavigate={onNavigate} />

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