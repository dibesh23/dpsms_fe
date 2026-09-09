import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { FinanceOverviewPage } from "@/features/fee/components/FinanceOverviewPage";

export default function FinanceRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <FinanceOverviewPage />
    </RequireRole>
  );
}