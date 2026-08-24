"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { Sidebar } from "../../shared/components/layout/Sidebar";
import { LoadingState } from "@/shared/components/ui/loading-state";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-bg-default">
        <LoadingState label="Loading your dashboard…" />
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg-muted text-content-default">
      <Sidebar onDesktopExpandedChange={setSidebarExpanded} />
      <div
        className={`transition-[padding-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          sidebarExpanded ? "lg:pl-60" : "lg:pl-20"
        }`}
      >
        <main className="mx-auto w-full max-w-8xl px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
