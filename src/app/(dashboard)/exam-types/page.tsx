import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { ExamTypesPage } from "@/features/exam/components/ExamTypesPage";

export default function ExamTypesRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <ExamTypesPage />
    </RequireRole>
  );
}
