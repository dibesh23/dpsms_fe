import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { ReviewFailedPage } from "@/features/promotion/components/ReviewFailedPage";

export default function ReviewFailedRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <ReviewFailedPage />
    </RequireRole>
  );
}
