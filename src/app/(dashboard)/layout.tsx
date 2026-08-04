"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../features/auth/hooks/useAuth";

function LoadingSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading…">
      <span>Loading…</span>
    </div>
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

  return <>{children}</>;
}
