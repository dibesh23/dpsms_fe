"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminNoticePage } from "@/features/notice/components/AdminNoticePage";
import { StudentNoticePage } from "@/features/notice/components/StudentNoticePage";

export default function NoticesRoute() {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN" || user?.role === "PRINCIPAL") {
    return <AdminNoticePage />;
  }

  return <StudentNoticePage />;
}
