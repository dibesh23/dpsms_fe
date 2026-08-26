import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { TeacherAssignmentsPage } from "@/features/teacher/components/TeacherAssignmentsPage";

export default function TeacherAssignmentsRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <TeacherAssignmentsPage />
    </RequireRole>
  );
}
