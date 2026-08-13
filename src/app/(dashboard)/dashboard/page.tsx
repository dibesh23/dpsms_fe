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

  
    return <StudentDashboardPage />;
  


}