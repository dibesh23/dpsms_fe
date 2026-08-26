import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { FeeStructuresPage } from "@/features/fee/components/FeeStructuresPage";

export default function FeeStructuresRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <FeeStructuresPage />
    </RequireRole>
  );
}
