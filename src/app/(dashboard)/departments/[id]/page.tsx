import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { DepartmentDetailPage } from "@/features/academic/components/DepartmentDetailPage";

export default function DepartmentDetailRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <DepartmentDetailPage />
    </RequireRole>
  );
}
