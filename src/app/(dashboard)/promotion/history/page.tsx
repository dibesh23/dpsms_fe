import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { PromotionHistoryPage } from "@/features/promotion/components/PromotionHistoryPage";

export default function PromotionHistoryRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <PromotionHistoryPage />
    </RequireRole>
  );
}
