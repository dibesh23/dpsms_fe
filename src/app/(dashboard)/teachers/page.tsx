import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { TeachersPage } from "@/features/teacher/components/TeachersPage";

export default function TeachersRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <TeachersPage />
    </RequireRole>
  );
}
