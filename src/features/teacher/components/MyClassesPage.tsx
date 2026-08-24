"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { RowActions } from "@/shared/components/ui/row-actions";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { teacherApi, type MyClassItem } from "../api/teacherApi";
import {
  BookOpenIcon,
  ClipboardCheckIcon,
  LayoutGridIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

function SubjectChips({ subjects }: { subjects: MyClassItem["subjects"] }) {
  if (subjects.length === 0) {
    return <span className="text-xs text-neutral-400">No subjects assigned</span>;
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {subjects.map((subject) => (
        <span
          key={subject.id}
          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
        >
          {subject.name}
        </span>
      ))}
    </span>
  );
}

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

  const totalStudents = classes.reduce((sum, item) => sum + item.totalStudents, 0);
  const subjectCount = new Set(classes.flatMap((item) => item.subjects.map((s) => s.id))).size;

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

      {error ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Something went wrong" description={error} />
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            title="No classes assigned"
            description="You have not been assigned to any sections yet. Contact your administrator."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((item) => (
            <div
              key={item.sectionId}
              className="flex flex-col rounded-lg border border-neutral-200 bg-bg-default p-5 transition-colors hover:border-neutral-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">
                    {item.className} – {item.sectionName}
                  </p>
                  <p className="text-xs text-neutral-500">{item.academicYearLabel}</p>
                </div>
                {item.isClassTeacher ? (
                  <StatusBadge status="Class Teacher" variant="info" dot={false} />
                ) : null}
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-start gap-2 text-neutral-500">
                  <span className="mt-0.5 w-4 flex-none text-neutral-400">
                    <BookOpenIcon className="size-4" />
                  </span>
                  <SubjectChips subjects={item.subjects} />
                </p>
                <p className="flex items-center gap-2 text-neutral-500">
                  <span className="w-4 flex-none text-neutral-400">
                    <UsersIcon className="size-4" />
                  </span>
                  {item.totalStudents} student{item.totalStudents === 1 ? "" : "s"}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-end border-t border-neutral-100 pt-4">
                <RowActions
                  actions={[
                    { label: "View students", href: "/students" },
                    {
                      label: "Mark attendance",
                      icon: <ClipboardCheckIcon className="size-4" />,
                      href: "/attendance/students",
                    },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default MyClassesPage;
