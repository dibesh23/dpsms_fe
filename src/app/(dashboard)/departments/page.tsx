import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { DepartmentsPage } from "@/features/academic/components/DepartmentsPage";

export default function DepartmentsRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <DepartmentsPage />
    </RequireRole>
  );
}
