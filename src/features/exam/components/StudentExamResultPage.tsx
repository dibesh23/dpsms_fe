"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge, type StatusVariant } from "@/shared/components/ui/status-badge";
import { DashboardWidget } from "@/shared/components/ui/dashboard-widget";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useTable } from "@/shared/hooks/useTable";
import {
  studentExamApi,
  type StudentExamSummary,
  type ExamResultSummary,
  type ExamSubjectDetail,
} from "../api/studentExamApi";
import {
  BookOpenIcon,
  CheckCircle2Icon,
  FileTextIcon,
  GraduationCapIcon,
  TrendingUpIcon,
} from "@/shared/components/ui/icons";

const RESULT_LABEL: Record<"PASS" | "FAIL", string> = {
  PASS: "Pass",
  FAIL: "Fail",
};

const RESULT_VARIANT: Record<"PASS" | "FAIL", StatusVariant> = {
  PASS: "success",
  FAIL: "danger",
};

const SUBJECT_TYPE_LABEL: Record<string, string> = {
  COMPULSORY: "Compulsory",
  ELECTIVE: "Elective",
};

const EMPTY_SUMMARY: StudentExamSummary = {
  schoolName: "",
  studentName: "",
  admissionNumber: "",
  className: "",
  sectionName: "",
  rollNumber: "",
  academicYearLabel: "",
  results: [],
};

function ViewResultButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white"
          : "rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-bg-muted"
      }
    >
      {active ? "Viewing" : "View"}
    </button>
  );
}

function subjectObtained(subject: ExamSubjectDetail): number {
  return (subject.theoryMarks ?? 0) + (subject.practicalMarks ?? 0);
}

function subjectFullMarks(subject: ExamSubjectDetail): number {
  return subject.fullMarksTheory + subject.fullMarksPractical;
}

function SubjectMarksTable({ subjects }: { subjects: ExamSubjectDetail[] }) {
  if (subjects.length === 0) {
    return (
      <EmptyState
        icon={<BookOpenIcon className="size-5" />}
        title="No subject marks found"
        className="py-8"
      />
    );
  }
  return (
    <div
      className="overflow-x-auto overscroll-x-contain"
      role="region"
      aria-label="Exam results"
      tabIndex={0}
    >
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-100 text-xs font-medium text-neutral-400">
            <th className="py-2 pr-3">Subject</th>
            <th className="py-2 pr-3">Theory</th>
            <th className="py-2 pr-3">Practical</th>
            <th className="py-2 pr-3">Total</th>
            <th className="py-2 pr-3">Pass Marks</th>
            <th className="py-2 text-right">Grade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {subjects.map((subject) => {
            const obtained = subjectObtained(subject);
            const full = subjectFullMarks(subject);
            const passed = obtained >= subject.passMarks;
            return (
              <tr key={subject.subjectId}>
                <td className="py-2.5 pr-3">
                  <p className="font-medium text-neutral-800">{subject.subjectName}</p>
                  <p className="text-xs text-neutral-400">
                    {SUBJECT_TYPE_LABEL[subject.subjectType] ?? subject.subjectType}
                    {subject.isAbsent ? " · Absent" : ""}
                  </p>
                </td>
                <td className="py-2.5 pr-3 text-neutral-600">
                  {subject.theoryMarks ?? "-"}/{subject.fullMarksTheory}
                </td>
                <td className="py-2.5 pr-3 text-neutral-600">
                  {subject.fullMarksPractical > 0
                    ? `${subject.practicalMarks ?? "-"}/${subject.fullMarksPractical}`
                    : "-"}
                </td>
                <td className="py-2.5 pr-3 font-medium text-neutral-900">
                  {obtained}/{full}
                </td>
                <td className="py-2.5 pr-3 text-neutral-600">{subject.passMarks}</td>
                <td className="py-2.5 text-right">
                  <StatusBadge
                    status={subject.grade ?? (passed ? "Pass" : "Fail")}
                    variant={subject.isAbsent ? "danger" : passed ? "success" : "danger"}
                    dot={false}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function StudentExamResultPage() {
  const [summary, setSummary] = useState<StudentExamSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await studentExamApi.getResults();
      setSummary(data);
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const publishedResults = useMemo(
    () => summary.results.filter((exam) => exam.status === "PUBLISHED"),
    [summary.results],
  );

  useEffect(() => {
    if (publishedResults.length === 0) {
      setSelectedExamId(null);
      return;
    }
    if (!publishedResults.some((exam) => exam.examId === selectedExamId)) {
      setSelectedExamId(publishedResults[0].examId);
    }
  }, [publishedResults, selectedExamId]);

  const selectedExam = publishedResults.find((exam) => exam.examId === selectedExamId) ?? null;

  const averagePercent = useMemo(() => {
    if (publishedResults.length === 0) return 0;
    const total = publishedResults.reduce((sum, exam) => sum + exam.percentage, 0);
    return Math.round(total / publishedResults.length);
  }, [publishedResults]);

  const bestPercent = useMemo(
    () => publishedResults.reduce((max, exam) => Math.max(max, exam.percentage), 0),
    [publishedResults],
  );

  const passCount = useMemo(
    () => publishedResults.filter((exam) => exam.result === "PASS").length,
    [publishedResults],
  );

  const COLUMNS: Column<ExamResultSummary>[] = useMemo(
    () => [
      {
        key: "exam",
        header: "Exam",
        sortValue: (exam) => exam.examName,
        render: (exam) => (
          <div>
            <p className="font-medium text-neutral-900">{exam.examName}</p>
            <p className="text-xs text-neutral-400">
              {exam.examTypeName}
              {exam.termName ? ` · ${exam.termName}` : ""}
            </p>
          </div>
        ),
      },
      {
        key: "marks",
        header: "Marks",
        sortValue: (exam) => exam.totalObtained,
        render: (exam) => (
          <span className="text-neutral-700">
            {exam.totalObtained}/{exam.totalFullMarks}
          </span>
        ),
      },
      {
        key: "percentage",
        header: "Percentage",
        sortValue: (exam) => exam.percentage,
        render: (exam) => <span className="font-medium text-neutral-900">{exam.percentage}%</span>,
      },
      {
        key: "gpa",
        header: "GPA",
        sortValue: (exam) => exam.gpaValue ?? -1,
        render: (exam) =>
          exam.gpaValue != null ? (
            <span className="font-medium text-neutral-900">{exam.gpaValue.toFixed(2)}</span>
          ) : (
            <span className="text-neutral-400">-</span>
          ),
      },
      {
        key: "result",
        header: "Result",
        sortValue: (exam) => exam.result,
        render: (exam) => (
          <StatusBadge status={RESULT_LABEL[exam.result]} variant={RESULT_VARIANT[exam.result]} />
        ),
      },
      {
        key: "action",
        header: "",
        align: "right",
        render: (exam) => (
          <ViewResultButton
            active={exam.examId === selectedExamId}
            onClick={() => setSelectedExamId(exam.examId)}
          />
        ),
      },
    ],
    [selectedExamId],
  );

  const table = useTable<ExamResultSummary>({
    data: publishedResults,
    pageSize: 8,
    getSearchText: (exam) => `${exam.examName} ${exam.examTypeName} ${exam.termName ?? ""}`,
    filterMatch: (exam, value) => exam.examTypeName === value,
    sortValue: (exam, key) => {
      if (key === "marks") return exam.totalObtained;
      if (key === "percentage") return exam.percentage;
      if (key === "gpa") return exam.gpaValue ?? -1;
      if (key === "result") return exam.result;
      return exam.examName;
    },
    defaultSortKey: "exam",
  });

  const examTypeFilters = useMemo(() => {
    const names = Array.from(new Set(publishedResults.map((exam) => exam.examTypeName)));
    return names.map((name) => ({
      value: name,
      label: `${name} (${publishedResults.filter((exam) => exam.examTypeName === name).length})`,
    }));
  }, [publishedResults]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exam Results"
        description={
          summary.academicYearLabel ? `Academic Year ${summary.academicYearLabel}` : undefined
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard
          label="Exams Published"
          value={loading ? "-" : String(publishedResults.length)}
          icon={<FileTextIcon className="size-4" />}
        />
        <StatsCard
          label="Average Percentage"
          value={loading ? "-" : `${averagePercent}%`}
          icon={<TrendingUpIcon className="size-4" />}
        />
        <StatsCard
          label="Best Result"
          value={loading ? "-" : `${bestPercent}%`}
          icon={<GraduationCapIcon className="size-4" />}
        />
        <StatsCard
          label="Exams Passed"
          value={loading ? "-" : `${passCount}/${publishedResults.length}`}
          icon={<CheckCircle2Icon className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by exam type"
          options={examTypeFilters}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search exams..." />
      </div>

      <DataTable
        columns={COLUMNS}
        data={table.pageRows}
        keyExtractor={(exam) => exam.examId}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No exam results found",
          description: "Results appear here once an exam is published.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="exams"
          />
        }
      />

      <DashboardWidget
        title={selectedExam ? selectedExam.examName : "Subject-wise Marks"}
        description={
          selectedExam
            ? `${selectedExam.examTypeName}${selectedExam.termName ? ` · ${selectedExam.termName}` : ""}`
            : "Select an exam above to see the subject breakdown"
        }
      >
        {selectedExam ? (
          <SubjectMarksTable subjects={selectedExam.subjects} />
        ) : (
          <EmptyState
            icon={<GraduationCapIcon className="size-5" />}
            title="No exam selected"
            description="Choose an exam from the table above."
            className="py-8"
          />
        )}
      </DashboardWidget>
    </div>
  );
}

export default StudentExamResultPage;
