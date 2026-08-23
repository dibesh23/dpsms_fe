import { Suspense } from "react";
import { StudentsPage } from "@/features/student/components/StudentsPage";

export default function StudentsRoute() {
  return (
    <Suspense>
      <StudentsPage />
    </Suspense>
  );
}
