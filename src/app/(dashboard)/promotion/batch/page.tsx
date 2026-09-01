import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { BatchPromotionPage } from "@/features/promotion/components/BatchPromotionPage";

export default function BatchPromotionRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <BatchPromotionPage />
    </RequireRole>
  );
}
