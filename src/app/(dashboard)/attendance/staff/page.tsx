import { RequireRole, ADMIN_ROLES } from "@/shared/components/require-role";
import { StaffAttendancePage } from "@/features/attendance/components/StaffAttendancePage";

export default function StaffAttendanceRoute() {
  return (
    <RequireRole roles={ADMIN_ROLES}>
      <StaffAttendancePage />
    </RequireRole>
  );
}
