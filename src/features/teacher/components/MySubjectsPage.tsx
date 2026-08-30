"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { RowActions } from "@/shared/components/ui/row-actions";
import { cn } from "@/shared/lib/cn";
import {
  BookOpenIcon,
  ClipboardCheckIcon,
  LayoutGridIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";
import { teacherAssignmentApi, type SubjectAssignmentRecord } from "../api/teacherAssignmentApi";
import { teacherApi, type MyClassItem } from "../api/teacherApi";

type ViewMode = "section" | "subject";

interface SubjectRow extends SubjectAssignmentRecord {
  students: number;
}

function groupRows(
  rows: SubjectRow[],
  key: (row: SubjectRow) => string,
): Map<string, SubjectRow[]> {
  const map = new Map<string, SubjectRow[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k) ?? [];
    list.push(row);
    map.set(k, list);
  }
  return map;
}

function subjectRowActions(row: SubjectRow): Array<{
  label: string;
  icon: ReactNode;
  href: string;
}> {
  return [
    {
      label: "View class",
      icon: <LayoutGridIcon className="size-4" />,
      href: `/my-classes/${row.sectionId}`,
    },
    {
      label: "View students",
      icon: <UsersIcon className="size-4" />,
      href: "/students",
    },
    {
      label: "Mark attendance",
      icon: <ClipboardCheckIcon className="size-4" />,
      href: "/attendance/students",
    },
  ];
}

export default function MySubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectAssignmentRecord[]>([]);
  const [classes, setClasses] = useState<MyClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("section");

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const [subjectAssignments, myClasses] = await Promise.all([
        teacherAssignmentApi.listMySubjects(),
        teacherApi.myClasses(),
      ]);
      setSubjects(subjectAssignments);
      setClasses(myClasses);
    } catch {
      setLoadError("We couldn't load your subjects. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const studentsBySection = useMemo(
    () => new Map(classes.map((c) => [c.sectionId, c.totalStudents])),
    [classes],
  );

  const rows = useMemo<SubjectRow[]>(
    () =>
      subjects.map((s) => ({
        ...s,
        students: studentsBySection.get(s.sectionId) ?? 0,
      })),
    [subjects, studentsBySection],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (s) =>
        s.subjectName.toLowerCase().includes(q) ||
        s.subjectCode?.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.sectionName.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const sectionGroups = useMemo(
    () => groupRows(filteredRows, (r) => `${r.className} – ${r.sectionName}`),
    [filteredRows],
  );
  const subjectGroups = useMemo(
    () => groupRows(filteredRows, (r) => r.subjectName),
    [filteredRows],
  );

  const totalSubjects = useMemo(() => new Set(subjects.map((s) => s.subjectId)).size, [subjects]);
  const totalSections = useMemo(() => new Set(subjects.map((s) => s.sectionId)).size, [subjects]);
  const totalStudents = useMemo(
    () =>
      [
        ...new Map(
          subjects.map((s) => [s.sectionId, studentsBySection.get(s.sectionId) ?? 0]),
        ).values(),
      ].reduce((sum, n) => sum + n, 0),
    [subjects, studentsBySection],
  );

  const activeGroups = view === "section" ? sectionGroups : subjectGroups;
  const sortedKeys = useMemo(
    () => [...activeGroups.keys()].sort((a, b) => a.localeCompare(b)),
    [activeGroups],
  );

  if (loading) return <LoadingState label="Loading your subjects…" />;

  if (loadError) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Subjects" description="Subjects you are assigned to teach" />
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="text-sm font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="My Subjects" description="Subjects you are assigned to teach" />

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon className="size-5" />}
          title="No subjects assigned"
          description="You don't have any subject assignments yet. Ask your admin to assign subjects to you."
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatsCard
              label="Subjects"
              value={String(totalSubjects)}
              delta="Unique subjects you teach"
              deltaDirection="neutral"
              icon={<BookOpenIcon className="size-4" />}
            />
            <StatsCard
              label="Sections"
              value={String(totalSections)}
              delta="Class sections assigned"
              deltaDirection="neutral"
              icon={<LayoutGridIcon className="size-4" />}
            />
            <StatsCard
              label="Students"
              value={totalStudents.toLocaleString("en-US")}
              delta="Across assigned sections"
              deltaDirection="neutral"
              icon={<UsersIcon className="size-4" />}
            />
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-bg-subtle p-0.5">
              <button
                type="button"
                onClick={() => setView("section")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "section"
                    ? "bg-bg-default text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                <LayoutGridIcon className="size-4" />
                By Section
              </button>
              <button
                type="button"
                onClick={() => setView("subject")}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  view === "subject"
                    ? "bg-bg-default text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800",
                )}
              >
                <BookOpenIcon className="size-4" />
                By Subject
              </button>
            </div>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search subjects, classes or sections…"
            />
          </div>

          {filteredRows.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-bg-default">
              <EmptyState title="No subjects found" description="Try adjusting your search." />
            </div>
          ) : view === "section" ? (
            <div className="space-y-4">
              {sortedKeys.map((section) => {
                const items = sectionGroups.get(section) ?? [];
                return (
                  <div key={section} className="rounded-xl border border-neutral-200 bg-bg-default">
                    <div className="flex items-center gap-3 rounded-t-xl border-b border-neutral-100 bg-bg-subtle px-4 py-3">
                      <span className="flex size-9 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-default text-neutral-500">
                        <LayoutGridIcon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-900">{section}</p>
                        <p className="text-xs text-neutral-500">
                          {items.length} subject{items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="flex-none text-xs text-neutral-500">
                        {items.reduce((sum, i) => sum + i.students, 0)} students
                      </span>
                    </div>
                    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-bg-default p-4"
                        >
                          <span className="flex size-9 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-500">
                            <BookOpenIcon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-neutral-900">
                                  {subject.subjectName}
                                </p>
                                <p className="text-xs text-neutral-400">
                                  {subject.subjectCode || "No code"}
                                </p>
                              </div>
                              <RowActions actions={subjectRowActions(subject)} />
                            </div>
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
                              <UsersIcon className="size-3.5 text-neutral-400" />
                              {subject.students} student{subject.students === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedKeys.map((subjectName) => {
                const items = subjectGroups.get(subjectName) ?? [];
                return (
                  <div
                    key={subjectName}
                    className="rounded-xl border border-neutral-200 bg-bg-default"
                  >
                    <div className="flex items-center gap-3 rounded-t-xl border-b border-neutral-100 bg-bg-subtle px-4 py-3">
                      <span className="flex size-9 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-default text-neutral-500">
                        <BookOpenIcon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {subjectName}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {items[0]?.subjectCode || "No code"} · {items.length} section
                          {items.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="flex-none text-xs text-neutral-500">
                        {items.reduce((sum, i) => sum + i.students, 0)} students
                      </span>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                          <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
                            <LayoutGridIcon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-800">
                              {item.className} – {item.sectionName}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {item.students} student{item.students === 1 ? "" : "s"}
                            </p>
                          </div>
                          <RowActions actions={subjectRowActions(item)} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
