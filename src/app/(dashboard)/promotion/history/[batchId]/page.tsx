import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { BatchDetailPage } from "@/features/promotion/components/BatchDetailPage";

export default function BatchDetailRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <BatchDetailPage />
    </RequireRole>
  );
}
