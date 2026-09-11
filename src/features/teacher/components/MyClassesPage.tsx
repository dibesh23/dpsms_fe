"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { RowActions } from "@/shared/components/ui/row-actions";
import { useTable } from "@/shared/hooks/useTable";
import { teacherApi, type MyClassItem } from "../api/teacherApi";
import {
  BookOpenIcon,
  ClipboardCheckIcon,
  LayoutGridIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

const sortValueOf = <T extends object>(row: T, key: string): string | number => {
  const value = row[key as keyof T];
  return typeof value === "number" ? value : String(value ?? "");
};

export function MyClassesPage() {
  const [classes, setClasses] = useState<MyClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClasses(await teacherApi.myClasses());
    } catch {
      setError("Unable to load your classes. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const table = useTable<MyClassItem>({
    data: classes,
    pageSize: 10,
    getSearchText: (item) =>
      `${item.className} ${item.sectionName} ${item.subjects.map((s) => s.name).join(" ")} ${item.academicYearLabel}`,
    sortValue: sortValueOf,
    defaultSortKey: "className",
  });

  const totalStudents = classes.reduce((sum, item) => sum + item.totalStudents, 0);
  const subjectCount = new Set(classes.flatMap((item) => item.subjects.map((s) => s.id))).size;

  const columns: Column<MyClassItem>[] = [
    {
      key: "className",
      header: "Section",
      sortValue: (row) => `${row.className} ${row.sectionName}`,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">
            {row.className} – {row.sectionName}
          </p>
          {row.isClassTeacher && (
            <span className="mt-0.5 inline-block">
              <StatusBadge status="Class Teacher" variant="info" dot={false} />
            </span>
          )}
        </div>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      sortValue: (row) => row.subjects.map((s) => s.name).join(", "),
      render: (row) =>
        row.subjects.length === 0 ? (
          <span className="text-xs text-neutral-400">No subjects assigned</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {row.subjects.map((subject) => (
              <span
                key={subject.id}
                className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
              >
                {subject.name}
              </span>
            ))}
          </span>
        ),
    },
    {
      key: "totalStudents",
      header: "Students",
      align: "right",
      sortValue: (row) => row.totalStudents,
      render: (row) => <span className="font-medium text-neutral-700">{row.totalStudents}</span>,
    },
    {
      key: "academicYearLabel",
      header: "Year",
      sortValue: (row) => row.academicYearLabel,
      render: (row) => <span className="text-neutral-500">{row.academicYearLabel}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (row) => (
        <RowActions
          actions={[
            { label: "View details", href: `/my-classes/${row.sectionId}` },
            { label: "View students", href: "/students" },
            {
              label: "Mark attendance",
              icon: <ClipboardCheckIcon className="size-4" />,
              href: "/attendance/students",
            },
          ]}
        />
      ),
    },
  ];

  if (loading) {
    return (
      <>
        <PageHeader
          title="My Classes"
          description="Sections assigned to you for the active academic year."
        />
        <LoadingState label="Loading your classes…" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="My Classes"
        description="Sections assigned to you for the active academic year."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="My Sections"
          value={String(classes.length)}
          icon={<LayoutGridIcon className="size-4" />}
        />
        <StatsCard
          label="Total Students"
          value={totalStudents.toLocaleString("en-US")}
          icon={<UsersIcon className="size-4" />}
        />
        <StatsCard
          label="Subjects Taught"
          value={String(subjectCount)}
          icon={<BookOpenIcon className="size-4" />}
        />
      </section>

      <div className="flex items-center justify-end">
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search classes…" />
      </div>

      {error ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-8 text-center">
          <p className="text-sm text-neutral-600">{error}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={table.pageRows}
          keyExtractor={(row) => row.sectionId}
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.handleSort}
          empty={{
            title: "No classes assigned",
            description:
              "You have not been assigned to any sections yet. Contact your administrator.",
          }}
          footer={
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
              label="classes"
            />
          }
        />
      )}
    </>
  );
}

export default MyClassesPage;
