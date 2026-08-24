import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { AcademicSessionsPage } from "@/features/academic/components/AcademicSessionsPage";

export default function AcademicSessionsRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <AcademicSessionsPage />
    </RequireRole>
  );
}
