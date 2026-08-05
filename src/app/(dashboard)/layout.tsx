"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { TopBar } from "../../shared/components/TopBar";
import { LoadingSpinner } from "@/shared/components/ui/icons";

function LoadingSkeleton() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-bg-default">
      <LoadingSpinner className="h-5 w-5 text-neutral-400" />
    </main>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (isLoading) return <LoadingSkeleton />;

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(pathname);
    router.replace(`/login?redirect=${redirect}`);
    return <LoadingSkeleton />;
  }

  if (user?.onboardingRequired) {
    router.replace("/onboarding");
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-[100dvh] bg-bg-default text-content-default">
      <TopBar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}