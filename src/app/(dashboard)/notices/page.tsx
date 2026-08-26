"use client";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminNoticePage } from "@/features/notice/components/AdminNoticePage";
import { StudentNoticePage } from "@/features/notice/components/StudentNoticePage";
import { TeacherNoticePage } from "@/features/notice/components/TeacherNoticePage";

export default function NoticesRoute() {
  const { user } = useAuth();

  if (user?.role === "SUPER_ADMIN" || user?.role === "PRINCIPAL") {
    return <AdminNoticePage />;
  }

  if (user?.role === "TEACHER") {
    return <TeacherNoticePage />;
  }

  // STUDENT (and any other role)
  return <StudentNoticePage />;
}
