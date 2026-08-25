"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { RowActions } from "@/shared/components/ui/row-actions";
import {
  ClipboardCheckIcon,
  GraduationCapIcon,
  LayoutGridIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";
import { useTable, type FilterOption } from "@/shared/hooks/useTable";
import { studentApi, type MyStudentItem } from "../api/studentApi";
import { teacherApi, type MyClassItem } from "@/features/teacher/api/teacherApi";

const GUARDIAN_RELATION_LABEL: Record<string, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
};

export function MyStudentsPage() {
  const [students, setStudents] = useState<MyStudentItem[]>([]);
  const [classes, setClasses] = useState<MyClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [myStudents, myClasses] = await Promise.all([
        studentApi.myStudents(),
        teacherApi.myClasses(),
      ]);
      setStudents(myStudents);
      setClasses(myClasses);
    } catch {
      setError("Unable to load your students. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const table = useTable<MyStudentItem>({
    data: students,
    pageSize: 10,
    getSearchText: (student) =>
      `${student.fullName} ${student.admissionNumber} ${student.rollNumber} ${student.guardianName ?? ""}`,
    filterMatch: (student, value) => student.sectionId === value,
    sortValue: (student, key) => String(student[key as keyof MyStudentItem] ?? ""),
    defaultSortKey: "name",
  });

  const filters = useMemo<FilterOption[]>(
    () =>
      classes.map((item) => ({
        value: item.sectionId,
        label: `${item.className} – ${item.sectionName}`,
      })),
    [classes],
  );

  const columns = useMemo<Column<MyStudentItem>[]>(
    () => [
      {
        key: "fullName",
        header: "Student",
        sortValue: (student) => student.fullName,
        render: (student) => (
          <div className="flex items-center gap-3">
            <Avatar name={student.fullName} size="sm" />
            <div className="min-w-0">
              <Link
                href={`/students/${student.studentId}`}
                className="truncate font-medium text-neutral-900 transition-colors hover:underline"
              >
                {student.fullName}
              </Link>
              <p className="text-xs text-neutral-400">Adm. {student.admissionNumber}</p>
            </div>
          </div>
        ),
      },
      {
        key: "rollNumber",
        header: "Roll No.",
        sortValue: (student) => student.rollNumber,
        render: (student) => (
          <span className="font-medium text-neutral-700">{student.rollNumber}</span>
        ),
      },
      {
        key: "className",
        header: "Class",
        sortValue: (student) => `${student.className} ${student.sectionName}`,
        render: (student) => (
          <span className="text-neutral-500">
            {student.className} – {student.sectionName}
          </span>
        ),
      },
      {
        key: "guardianName",
        header: "Guardian",
        sortValue: (student) => student.guardianName ?? "",
        render: (student) =>
          student.guardianName ? (
            <div className="min-w-0">
              <p className="truncate text-neutral-700">{student.guardianName}</p>
              <p className="text-xs text-neutral-400">
                {GUARDIAN_RELATION_LABEL[student.guardianRelation ?? ""] ?? "Guardian"}
              </p>
            </div>
          ) : (
            <span className="text-neutral-400">—</span>
          ),
      },
      {
        key: "guardianPhone",
        header: "Contact",
        render: (student) =>
          student.guardianPhone ? (
            <a
              href={`tel:${student.guardianPhone}`}
              className="text-blue-600 transition-colors hover:text-blue-800 hover:underline"
            >
              {student.guardianPhone}
            </a>
          ) : (
            <span className="text-neutral-400">—</span>
          ),
      },
      {
        key: "actions",
        header: "",
        align: "right",
        render: () => (
          <RowActions
            actions={[
              {
                label: "Mark attendance",
                icon: <ClipboardCheckIcon className="size-4" />,
                href: "/attendance/students",
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <>
        <PageHeader
          title="My Students"
          description="Students enrolled in your assigned sections."
        />
        <LoadingState label="Loading your students…" />
      </>
    );
  }

  const classTeacherSections = classes.filter((item) => item.isClassTeacher).length;

  return (
    <>
      <PageHeader
        title="My Students"
        description={`${students.length} records · Enrolled in your assigned sections`}
      />

      {error ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Something went wrong" description={error} />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              label="Total Students"
              value={students.length.toLocaleString("en-US")}
              icon={<UsersIcon className="size-4" />}
            />
            <StatsCard
              label="My Sections"
              value={String(classes.length)}
              icon={<LayoutGridIcon className="size-4" />}
            />
            <StatsCard
              label="As Class Teacher"
              value={String(classTeacherSections)}
              icon={<GraduationCapIcon className="size-4" />}
            />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterDropdown
              label="Filter by section"
              options={filters}
              value={table.filter}
              onChange={table.setFilter}
            />
            <SearchBar
              value={table.query}
              onChange={table.setQuery}
              placeholder="Search students…"
            />
          </div>

          <DataTable
            columns={columns}
            data={table.pageRows}
            keyExtractor={(student) => student.studentId}
            sortKey={table.sortKey}
            sortDir={table.sortDir}
            onSort={table.handleSort}
            empty={{
              title: students.length === 0 ? "No students assigned" : "No students found",
              description:
                students.length === 0
                  ? "None of your assigned sections have enrolled students yet."
                  : "Try adjusting your search or filters.",
            }}
            footer={
              <Pagination
                page={table.page}
                pageSize={table.pageSize}
                total={table.total}
                onPageChange={table.setPage}
                label="students"
              />
            }
          />
        </>
      )}
    </>
  );
}

export default MyStudentsPage;
