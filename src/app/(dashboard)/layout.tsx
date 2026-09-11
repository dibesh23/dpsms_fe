"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { Sidebar } from "../../shared/components/layout/Sidebar";
import { LoadingState } from "@/shared/components/ui/loading-state";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-bg-default">
        <LoadingState label="Loading your dashboard…" />
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-stone-200 text-content-default">
      <Sidebar onDesktopExpandedChange={setSidebarExpanded} />
      <div
        className={`transition-[padding-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:py-3 lg:pr-3 ${
          sidebarExpanded ? "lg:pl-[268px]" : "lg:pl-[92px]"
        }`}
      >
        <main className="dashboard-main mx-auto min-h-[calc(100dvh-1.5rem)] min-w-0 w-full max-w-8xl overflow-x-clip border-neutral-200 bg-[#fbfaf7] px-3 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)] sm:px-6 sm:py-6 lg:rounded-[24px] lg:border lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
