"use client";

import { useRef } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { pushNotification } from "@/shared/components/ui/NotificationPopup";
import { useExamPolling } from "../hooks/useExamPolling";
import { usePublishedExamsPolling } from "../hooks/usePublishedExamsPolling";

export function ExamResultNotifier() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";
  const isTeacher = user?.role === "TEACHER";

  const studentSeeded = useRef(false);
  const { seed: seedStudent } = useExamPolling({
    enabled: isStudent,
    onNewResults: (results) => {
      for (const r of results) {
        const label = r.termName ? `${r.examName} (${r.termName})` : r.examName;
        pushNotification(
          "exam-result",
          "Exam Result Published",
          `${label} — ${r.percentage.toFixed(1)}% · ${r.result}`,
        );
      }
    },
    onRefresh: (published) => {
      if (!studentSeeded.current) {
        studentSeeded.current = true;
        seedStudent(published.map((r) => r.examId));
      }
    },
  });

  const teacherSeeded = useRef(false);
  const { seed: seedTeacher } = usePublishedExamsPolling({
    enabled: isTeacher,
    onNewExams: (exams) => {
      for (const e of exams) {
        pushNotification(
          "exam-result",
          "Exam Result Published",
          `${e.name} — results published for Class ${e.className}`,
        );
      }
    },
    onRefresh: (published) => {
      if (!teacherSeeded.current) {
        teacherSeeded.current = true;
        seedTeacher(published.map((e) => e.id));
      }
    },
  });

  return null;
}
