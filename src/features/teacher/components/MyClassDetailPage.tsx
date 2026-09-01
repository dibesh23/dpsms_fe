"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { Avatar } from "@/shared/components/ui/avatar";
import { RowActions } from "@/shared/components/ui/row-actions";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  ClipboardCheckIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";
import { teacherApi, type MyClassItem } from "../api/teacherApi";
import { studentApi, type MyStudentItem } from "@/features/student/api/studentApi";
import { attendanceApi } from "@/features/attendance/api/attendanceApi";

const GUARDIAN_RELATION_LABEL: Record<string, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
};

export function MyClassDetailPage() {
  const params = useParams<{ sectionId: string }>();
  const sectionId = params?.sectionId;

  const [classItem, setClassItem] = useState<MyClassItem | null>(null);
  const [students, setStudents] = useState<MyStudentItem[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    setError(null);
    try {
      const [classes, myStudents, stats] = await Promise.all([
        teacherApi.myClasses(),
        studentApi.myStudents(sectionId),
        attendanceApi
          .getStudentStats(
            (() => {
              const from = new Date();
              from.setDate(from.getDate() - 30);
              return from;
            })(),
            new Date(),
            sectionId,
          )
          .catch(() => null),
      ]);
      const match = classes.find((item) => item.sectionId === sectionId) ?? null;
      setClassItem(match);
      setStudents(myStudents);
      setAttendanceRate(
        stats?.sections.find((s) => s.sectionId === sectionId)?.attendanceRate ?? null,
      );
    } catch {
      setError("Unable to load this class. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <>
        <PageHeader title="Class Details" description="Loading…" />
        <LoadingState label="Loading class details…" />
      </>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/my-classes"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to my classes
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Something went wrong" description={error} />
        </div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="space-y-4">
        <Link
          href="/my-classes"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to my classes
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            title="Class not found"
            description="This section is not assigned to you, or it no longer exists."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/my-classes"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to my classes
      </Link>

      <PageHeader
        title={`${classItem.className} – ${classItem.sectionName}`}
        description={`${classItem.academicYearLabel} · ${students.length} enrolled students`}
        actions={
          classItem.isClassTeacher ? (
            <StatusBadge status="Class Teacher" variant="info" dot={false} />
          ) : null
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Students"
          value={String(students.length)}
          delta="Enrolled in this section"
          deltaDirection="neutral"
          icon={<UsersIcon className="size-4" />}
        />
        <StatsCard
          label="Subjects Taught"
          value={String(classItem.subjects.length)}
          delta="Assigned to you"
          deltaDirection="neutral"
          icon={<BookOpenIcon className="size-4" />}
        />
        <StatsCard
          label="Attendance (30 days)"
          value={attendanceRate === null ? "—" : `${attendanceRate.toFixed(1)}%`}
          delta="Section attendance rate"
          deltaDirection="neutral"
          icon={<ClipboardCheckIcon className="size-4" />}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-bg-default">
          <header className="border-b border-neutral-100 px-5 py-4">
            <h2 className="font-medium text-neutral-900">Subjects</h2>
            <p className="text-xs text-neutral-400">Subjects you teach in this section</p>
          </header>
          {classItem.subjects.length === 0 ? (
            <EmptyState
              title="No subjects assigned"
              description="No subjects are mapped to you for this section yet."
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {classItem.subjects.map((subject) => (
                <li key={subject.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
                    <BookOpenIcon className="size-4" />
                  </span>
                  <p className="truncate text-sm font-medium text-neutral-800">{subject.name}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-neutral-200 bg-bg-default">
          <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
            <div>
              <h2 className="font-medium text-neutral-900">Overview</h2>
              <p className="text-xs text-neutral-400">Facts about this section</p>
            </div>
          </header>
          <ul className="divide-y divide-neutral-100">
            <li className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
              <span className="text-neutral-500">Class</span>
              <span className="font-medium text-neutral-800">{classItem.className}</span>
            </li>
            <li className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
              <span className="text-neutral-500">Section</span>
              <span className="font-medium text-neutral-800">{classItem.sectionName}</span>
            </li>
            <li className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
              <span className="text-neutral-500">Academic year</span>
              <span className="font-medium text-neutral-800">{classItem.academicYearLabel}</span>
            </li>
            <li className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
              <span className="text-neutral-500">Role</span>
              <span className="font-medium text-neutral-800">
                {classItem.isClassTeacher ? "Class teacher" : "Subject teacher"}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-bg-default">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className="font-medium text-neutral-900">Students</h2>
            <p className="text-xs text-neutral-400">
              {students.length} enrolled · your section roster
            </p>
          </div>
        </header>
        {students.length === 0 ? (
          <EmptyState
            title="No students enrolled"
            description="No students are enrolled in this section yet."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {students.map((student) => (
              <li
                key={student.studentId}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-bg-subtle"
              >
                <Link
                  href={`/students/${student.studentId}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <Avatar name={student.fullName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-800 hover:underline">
                      {student.fullName}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      Roll {student.rollNumber} · Adm. {student.admissionNumber}
                      {student.guardianName
                        ? ` · ${student.guardianName} (${
                            GUARDIAN_RELATION_LABEL[student.guardianRelation ?? ""] ?? "Guardian"
                          })`
                        : ""}
                    </p>
                  </div>
                </Link>
                <RowActions
                  actions={[
                    {
                      label: "Mark attendance",
                      icon: <ClipboardCheckIcon className="size-4" />,
                      href: "/attendance/students",
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default MyClassDetailPage;
