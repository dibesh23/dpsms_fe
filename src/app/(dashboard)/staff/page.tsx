import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { StaffPage } from "@/features/staff/components/StaffPage";

export default function StaffRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <StaffPage />
    </RequireRole>
  );
}
