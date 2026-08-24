import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { SessionDetailPage } from "@/features/academic/components/SessionDetailPage";

export default function SessionDetailRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <SessionDetailPage />
    </RequireRole>
  );
}
