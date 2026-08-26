import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { FeeInvoiceDetailPage } from "@/features/fee/components/FeeInvoiceDetailPage";

export default function FeeInvoiceDetailRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <FeeInvoiceDetailPage />
    </RequireRole>
  );
}
