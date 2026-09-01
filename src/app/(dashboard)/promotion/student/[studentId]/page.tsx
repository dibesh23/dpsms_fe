import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { StudentPromotionHistoryPage } from "@/features/promotion/components/StudentPromotionHistoryPage";

export default function StudentPromotionHistoryRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <StudentPromotionHistoryPage />
    </RequireRole>
  );
}
