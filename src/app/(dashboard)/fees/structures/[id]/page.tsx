import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { FeeStructureDetailPage } from "@/features/fee/components/FeeStructureDetailPage";

export default function FeeStructureDetailRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <FeeStructureDetailPage />
    </RequireRole>
  );
}
