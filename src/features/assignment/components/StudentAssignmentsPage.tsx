"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { RowActions } from "@/shared/components/ui/row-actions";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { useTable } from "@/shared/hooks/useTable";
import { studentAssignmentApi, type StudentAssignmentListItem } from "../api/studentAssignmentApi";
import {
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_VARIANT,
  SUBMISSION_STATUS_LABEL,
  SUBMISSION_STATUS_VARIANT,
} from "./labels";
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  ClockIcon,
  FileTextIcon,
} from "@/shared/components/ui/icons";

type SubmissionFilter = "PENDING" | StudentAssignmentListItem["submissionStatus"] | "";

function isSubmissionFilter(value: string | null): value is SubmissionFilter {
  return (
    value === null ||
    value === "" ||
    value === "PENDING" ||
    value === "NOT_STARTED" ||
    value === "SUBMITTED" ||
    value === "GRADED"
  );
}

export function StudentAssignmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<StudentAssignmentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await studentAssignmentApi.list({ pageSize: 500 });
      setItems(result.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const table = useTable<StudentAssignmentListItem>({
    data: items,
    pageSize: 8,
    getSearchText: (a) => `${a.title} ${a.subjectName ?? ""} ${a.className} ${a.sectionName}`,
    filterMatch: (a, value) => {
      if (value === null || value === "") return true;
      if (!isSubmissionFilter(value)) return true;
      if (value === "PENDING") {
        return a.submissionStatus === "NOT_STARTED";
      }
      return a.submissionStatus === value;
    },
    sortValue: (a, key) => String(a[key as keyof StudentAssignmentListItem] ?? ""),
    defaultSortKey: "dueDate",
  });

  if (loading) return <LoadingState label="Loading assignments…" />;

  const pending = items.filter((a) => a.submissionStatus === "NOT_STARTED").length;
  const submitted = items.filter((a) => a.submissionStatus === "SUBMITTED").length;
  const graded = items.filter((a) => a.submissionStatus === "GRADED").length;

  const columns: Column<StudentAssignmentListItem>[] = [
    {
      key: "title",
      header: "Assignment",
      sortValue: (a) => a.title,
      render: (a) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
            <FileTextIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-neutral-900">{a.title}</p>
            <p className="text-xs text-neutral-400">{a.subjectName ?? "General"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "section",
      header: "Section",
      sortValue: (a) => a.sectionName,
      render: (a) => (
        <span className="text-neutral-600">
          {a.className} · {a.sectionName}
        </span>
      ),
    },
    {
      key: "dueDate",
      header: "Due date",
      sortValue: (a) => a.dueDate,
      render: (a) => (
        <span
          className={
            a.isLate && a.submissionStatus !== "GRADED"
              ? "font-medium text-amber-600"
              : "text-neutral-600"
          }
        >
          {a.dueDate}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (a) => a.status,
      render: (a) => (
        <StatusBadge
          status={ASSIGNMENT_STATUS_LABEL[a.status]}
          variant={ASSIGNMENT_STATUS_VARIANT[a.status]}
        />
      ),
    },
    {
      key: "submissionStatus",
      header: "Submission",
      sortValue: (a) => a.submissionStatus,
      render: (a) => (
        <StatusBadge
          status={
            a.submissionStatus === "NOT_STARTED"
              ? a.status === "PUBLISHED"
                ? "Pending"
                : SUBMISSION_STATUS_LABEL[a.submissionStatus]
              : SUBMISSION_STATUS_LABEL[a.submissionStatus]
          }
          variant={
            a.submissionStatus === "NOT_STARTED" && a.status === "PUBLISHED"
              ? "warning"
              : SUBMISSION_STATUS_VARIANT[a.submissionStatus]
          }
        />
      ),
    },
    {
      key: "marks",
      header: "Marks",
      align: "right",
      sortValue: (a) => a.marks ?? -1,
      render: (a) =>
        a.marks !== null ? (
          <span className="font-medium text-neutral-700">{a.marks}</span>
        ) : (
          <span className="text-neutral-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <RowActions
          actions={[
            {
              label: "View details",
              icon: <ArrowUpRightIcon className="size-3.5" />,
              onClick: () => router.push(`/assignments/${a.id}`),
            },
          ]}
        />
      ),
    },
  ];

  const filterOptions = [
    { value: "PENDING", label: "Pending" },
    { value: "SUBMITTED", label: "Submitted" },
    { value: "GRADED", label: "Graded" },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Home Assignments"
        description="Assignment and submission status for your current section"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Pending"
          value={String(pending)}
          icon={<ClockIcon className="size-4" />}
        />
        <StatsCard
          label="Submitted"
          value={String(submitted)}
          icon={<ClipboardCheckIcon className="size-4" />}
        />
        <StatsCard
          label="Graded"
          value={String(graded)}
          icon={<CheckCircle2Icon className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by submission"
          options={filterOptions}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Search assignments…"
        />
      </div>

      <DataTable
        columns={columns}
        data={table.pageRows}
        keyExtractor={(a) => a.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No assignments found",
          description: "New assignments will appear here once your teacher publishes them.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="assignments"
          />
        }
      />
    </div>
  );
}

export default StudentAssignmentsPage;
