import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { FeeTypesPage } from "@/features/fee/components/FeeTypesPage";

export default function FeeTypesRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <FeeTypesPage />
    </RequireRole>
  );
}
