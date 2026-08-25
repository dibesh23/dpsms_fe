"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoadingState } from "@/shared/components/ui/loading-state";
import DashboardPage from "@/features/dashboard/components/DashboardPage";
import StudentDashboardPage from "@/features/dashboard/components/StudentDashboardPage";

export default function DashboardRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState label="Loading your dashboard…" />;
  }

  // STUDENT gets their own detailed academic dashboard
  if (user?.role === "STUDENT") {
    return <StudentDashboardPage />;
  }

  // TEACHER, PRINCIPAL, SUPER_ADMIN all get the admin dashboard
  // (DashboardPage already has DashboardNoticesWidget which respects role)
  return <DashboardPage />;
}