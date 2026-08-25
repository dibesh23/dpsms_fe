import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { TeacherDetailPage } from "@/features/teacher/components/TeacherDetailPage";

export default function TeacherDetailRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <TeacherDetailPage />
    </RequireRole>
  );
}
