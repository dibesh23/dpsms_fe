import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { FeeInvoicesPage } from "@/features/fee/components/FeeInvoicesPage";

export default function FeeInvoicesRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <FeeInvoicesPage />
    </RequireRole>
  );
}
