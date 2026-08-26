import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { StaffDetailPage } from "@/features/staff/components/StaffDetailPage";

export default function StaffDetailRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <StaffDetailPage />
    </RequireRole>
  );
}
