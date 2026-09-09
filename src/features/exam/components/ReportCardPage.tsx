"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import {
  PrintIcon,
  GraduationCapIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from "@/shared/components/ui/icons";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { reportCardApi } from "../api/reportCardApi";
import type { ReportCardData, ExamResultSummary, ExamSubjectDetail } from "../api/studentExamApi";

const RESULT_LABEL: Record<"PASS" | "FAIL", string> = {
  PASS: "Pass",
  FAIL: "Fail",
};

function subjectObtained(subject: ExamSubjectDetail): number {
  return (subject.theoryMarks ?? 0) + (subject.practicalMarks ?? 0);
}

function subjectFullMarks(subject: ExamSubjectDetail): number {
  return subject.fullMarksTheory + subject.fullMarksPractical;
}

const SUBJECT_TYPE_LABEL: Record<string, string> = {
  COMPULSORY: "Compulsory",
  ELECTIVE: "Elective",
};

export function ReportCardPage({ studentId }: { studentId?: string }) {
  const [data, setData] = useState<ReportCardData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = studentId
        ? await reportCardApi.getForStudent(studentId)
        : await reportCardApi.getOwn();
      setData(result);
    } catch {
      setLoadError(
        studentId
          ? "We couldn't load this student's report card."
          : "No report card available yet.",
      );
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasResults = useMemo(() => (data?.results.length ?? 0) > 0, [data]);

  const selectedExam = useMemo(
    () => (data?.results ?? []).find((exam) => exam.examId === selectedExamId) ?? null,
    [data, selectedExamId],
  );

  // Build the PDF from the raw data (no DOM/CSS parsing), so the generated
  // output avoids the modern color functions used by the Tailwind v4 theme.
  const handleDownload = (exam: ExamResultSummary) => {
    if (!data) return;
    setPrinting(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;

      const center = (text: string, y: number, opts?: { size?: number; style?: string }) =>
        doc.text(text, pageWidth / 2, y, { align: "center", ...opts });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(13, 51, 32);
      center(data.schoolName || "Digital Pathshala", 22);

      doc.setFontSize(12);
      doc.setTextColor(23, 23, 23);
      center("Report Card", 29);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(90);
      center(`Academic Year ${data.academicYearLabel || "—"}`, 35);
      doc.setTextColor(0);

      doc.setDrawColor(40);
      doc.setLineWidth(0.7);
      doc.line(margin, 40, pageWidth - margin, 40);

      let y = 52;
      const infoRows: Array<[string, string]> = [
        ["Student", data.studentName],
        ["Admission No.", data.admissionNumber],
        ["Class", data.className || "—"],
        ["Section", data.sectionName || "—"],
        ["Roll No.", data.rollNumber || "—"],
      ];
      const colWidth = contentWidth / 2;
      for (let i = 0; i < infoRows.length; i += 2) {
        const leftCell = infoRows[i];
        const rightCell = infoRows[i + 1];
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(leftCell[0], margin, y);
        if (rightCell) {
          doc.text(rightCell[0], margin + colWidth, y);
        }
        doc.setFont("helvetica", "normal");
        doc.text(leftCell[1], margin + 30, y);
        if (rightCell) {
          doc.text(rightCell[1], margin + colWidth + 30, y);
        }
        y += 8;
      }

      const examLabel = `${exam.examName}  ·  ${exam.examTypeName}${
        exam.termName ? `  ·  ${exam.termName}` : ""
      }`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(examLabel, margin, y + 6);

      autoTable(doc, {
        startY: y + 12,
        margin: { left: margin, right: margin },
        head: [["Subject", "Theory", "Practical", "Total", "Grade", "GPA"]],
        body: exam.subjects.map((subject) => {
          const obtained = subjectObtained(subject);
          const full = subjectFullMarks(subject);
          const name = `${subject.subjectName}${subject.isAbsent ? " (Absent)" : ""}`;
          return [
            name,
            `${subject.theoryMarks ?? "-"}/${subject.fullMarksTheory}`,
            subject.fullMarksPractical > 0
              ? `${subject.practicalMarks ?? "-"}/${subject.fullMarksPractical}`
              : "-",
            `${obtained}/${full}`,
            subject.grade ?? (subject.isAbsent ? "NG" : "-"),
            subject.gpaValue != null ? subject.gpaValue.toFixed(2) : "-",
          ];
        }),
        styles: { font: "helvetica", fontSize: 10, textColor: [64, 64, 64], cellPadding: 2.5 },
        headStyles: { fillColor: [23, 23, 23], textColor: [255, 255, 255], fontSize: 9 },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 22 },
          2: { cellWidth: 22 },
          3: { cellWidth: 20 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
        },
      });

      const afterY =
        (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y + 12;
      const gpa = exam.gpaValue != null ? exam.gpaValue.toFixed(2) : "-";
      const summary = `Overall GPA: ${gpa}     Percentage: ${
        exam.percentage
      }%     Result: ${RESULT_LABEL[exam.result]}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(summary, margin, (afterY ?? y) + 12);

      const fileName = `${data.studentName.replace(/\s+/g, "_")}_${exam.examName.replace(
        /\s+/g,
        "_",
      )}_report_card.pdf`;
      doc.save(fileName);
    } finally {
      setPrinting(false);
    }
  };

  if (!selectedExam && !studentId && (loadError || !data)) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Report Card" description="Your official report card" />
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          {loadError ? (
            <EmptyState
              icon={<GraduationCapIcon className="size-5" />}
              title="No report card yet"
              description="Your report card appears here once the school publishes your exam results."
            />
          ) : (
            <LoadingState label="Loading report card…" />
          )}
        </div>
      </div>
    );
  }

if (!data) {
  if (loadError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Report Card" description="Your official report card" />
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            icon={<GraduationCapIcon className="size-5" />}
            title="Report card unavailable"
            description={loadError}
          />
        </div>
      </div>
    );
  }
  return <LoadingState label="Loading report card…" />;
}

  // Individual exam detail view (a single printable marksheet).
  if (selectedExam) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedExamId(null)}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to all results
        </button>
        <PageHeader
          title={selectedExam.examName}
          description={`${selectedExam.examTypeName}${
            selectedExam.termName ? ` · ${selectedExam.termName}` : ""
          }${data.academicYearLabel ? ` · Academic Year ${data.academicYearLabel}` : ""}`}
          actions={
            <Button
              text={printing ? "Preparing PDF…" : "Download PDF"}
              icon={<PrintIcon className="size-4" />}
              loading={printing}
              disabled={printing}
              className="w-auto"
              onClick={() => handleDownload(selectedExam)}
            />
          }
        />

        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="p-6 sm:p-10">
            <div className="text-center">
              <p className="type-display text-content-brand">
                {data.schoolName || "Digital Pathshala"}
              </p>
              <p className="type-card-title mt-1 text-neutral-700">Report Card</p>
              <p className="type-caption type-numeric mt-1">
                Academic Year {data.academicYearLabel || "—"} · Roll No. {data.rollNumber || "—"}
              </p>
            </div>

            <div className="type-numeric mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-neutral-200 py-4 text-sm">
              <div>
                <span className="text-neutral-500">Student</span>
                <p className="font-semibold text-neutral-900">{data.studentName}</p>
              </div>
              <div>
                <span className="text-neutral-500">Admission No.</span>
                <p className="font-semibold text-neutral-900">{data.admissionNumber}</p>
              </div>
              <div>
                <span className="text-neutral-500">Class</span>
                <p className="font-semibold text-neutral-900">{data.className || "—"}</p>
              </div>
              <div>
                <span className="text-neutral-500">Section</span>
                <p className="font-semibold text-neutral-900">{data.sectionName || "—"}</p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="type-table-header mb-2 uppercase">
                {selectedExam.examName}
                <span className="ml-2 font-normal normal-case text-neutral-500">
                  {selectedExam.examTypeName}
                  {selectedExam.termName ? ` · ${selectedExam.termName}` : ""}
                </span>
              </h2>
              <table className="type-table-cell type-numeric w-full border-collapse">
                <thead>
                  <tr className="type-table-header border-y border-neutral-300 bg-neutral-50 uppercase">
                    <th className="py-2 pl-3 text-left">Subject</th>
                    <th className="py-2 text-left">Theory</th>
                    <th className="py-2 text-left">Practical</th>
                    <th className="py-2 text-left">Total</th>
                    <th className="py-2 text-left">Grade</th>
                    <th className="py-2 text-left">GPA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {selectedExam.subjects.map((subject) => {
                    const obtained = subjectObtained(subject);
                    const full = subjectFullMarks(subject);
                    return (
                      <tr key={subject.subjectId}>
                        <td className="py-2 pl-3 pr-2">
                          <span className="font-medium text-neutral-800">
                            {subject.subjectName}
                          </span>
                          <span className="ml-2 text-xs text-neutral-400">
                            {SUBJECT_TYPE_LABEL[subject.subjectType] ?? subject.subjectType}
                            {subject.isAbsent ? " · Absent" : ""}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-neutral-700">
                          {subject.theoryMarks ?? "-"}/{subject.fullMarksTheory}
                        </td>
                        <td className="py-2 pr-2 text-neutral-700">
                          {subject.fullMarksPractical > 0
                            ? `${subject.practicalMarks ?? "-"}/${subject.fullMarksPractical}`
                            : "-"}
                        </td>
                        <td className="py-2 pr-2 font-medium text-neutral-900">
                          {obtained}/{full}
                        </td>
                        <td className="py-2 pr-2 text-neutral-800">
                          {subject.grade ?? (subject.isAbsent ? "NG" : "-")}
                        </td>
                        <td className="py-2 pr-3 text-neutral-800">
                          {subject.gpaValue != null ? subject.gpaValue.toFixed(2) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="type-numeric mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-3 text-sm">
                <div>
                  <span className="font-medium text-neutral-500">Overall GPA: </span>
                  <span className="font-semibold text-neutral-900">
                    {selectedExam.gpaValue != null ? selectedExam.gpaValue.toFixed(2) : "-"}
                  </span>
                  <span className="ml-4 font-medium text-neutral-500">Percentage: </span>
                  <span className="font-semibold text-neutral-900">{selectedExam.percentage}%</span>
                </div>
                <div>
                  <span className="font-medium text-neutral-500">Result: </span>
                  <span className="font-semibold text-neutral-900">
                    {RESULT_LABEL[selectedExam.result]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result list view.
  return (
    <div className="space-y-4">
      <PageHeader
        title={studentId ? "Report Card" : "My Report Card"}
        description={data.academicYearLabel ? `Academic Year ${data.academicYearLabel}` : undefined}
        actions={
          hasResults ? (
            <span className="text-sm text-neutral-500">
              {data.results.length} result{data.results.length === 1 ? "" : "s"}
            </span>
          ) : undefined
        }
      />

      <div className="rounded-lg border border-neutral-200 bg-bg-default">
        {hasResults ? (
          <ul className="divide-y divide-neutral-100">
            {data.results.map((exam, index) => (
              <li key={exam.examId}>
                <button
                  type="button"
                  onClick={() => setSelectedExamId(exam.examId)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-bg-subtle"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-bg-subtle text-neutral-600">
                      <GraduationCapIcon className="size-5" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">{exam.examName}</p>
                      <p className="text-xs text-neutral-500">
                        {exam.examTypeName}
                        {exam.termName ? ` · ${exam.termName}` : ""} · {index + 1} of{" "}
                        {data.results.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="type-numeric text-sm font-semibold text-neutral-900">
                        {exam.percentage}%
                      </p>
                      <p className="type-caption type-numeric">
                        {RESULT_LABEL[exam.result]} · GPA{" "}
                        {exam.gpaValue != null ? exam.gpaValue.toFixed(2) : "-"}
                      </p>
                    </div>
                    <ChevronRightIcon className="size-4 text-neutral-400" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<GraduationCapIcon className="size-5" />}
            title="No published results yet"
            description="Results will appear here once exams are published."
          />
        )}
      </div>
    </div>
  );
}

export default ReportCardPage;
