"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  GraduationCapIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  TrashIcon,
} from "@/shared/components/ui/icons";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { teacherApi, type TeacherDetailRecord } from "../api/teacherApi";
import { EditTeacherForm, editValuesToPayload, type EditTeacherValues } from "./EditTeacherForm";
import { teacherStatusToLabel } from "../utils";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TeacherDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const teacherId = params?.id;
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.TEACHER_UPDATE);
  const canDelete = can(PERMISSIONS.TEACHER_DELETE);

  const [teacher, setTeacher] = useState<TeacherDetailRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!teacherId) return;
    setLoadError(null);
    try {
      const record = await teacherApi.get(teacherId);
      setTeacher(record);
    } catch {
      setLoadError("We couldn't find this teacher.");
    }
  }, [teacherId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (values: EditTeacherValues): Promise<string | null> => {
    if (!teacherId) return "Could not save changes. Try again.";
    try {
      const updated = await teacherApi.update(teacherId, editValuesToPayload(values));
      setTeacher(updated);
      setEditOpen(false);
      toast.success("Teacher updated successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(
        err,
        "Could not update the teacher. Check the details and try again.",
      );
    }
  };

  const handleRemove = async () => {
    if (!teacherId) return;
    setRemoving(true);
    try {
      await teacherApi.remove(teacherId);
      toast.success("Teacher removed successfully.");
      router.push("/teachers");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the teacher. Try again."));
      setRemoving(false);
      setRemoveOpen(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/teachers"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to teachers
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Teacher not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!teacher) {
    return <LoadingState label="Loading teacher…" />;
  }

  const statusLabel = teacherStatusToLabel(teacher.status);
  const subjects = teacher.teacherSubjectAssignments.map((assignment) => ({
    id: assignment.id,
    name: assignment.subject.name,
    code: assignment.subject.code,
    academicYearLabel: assignment.academicYear.label,
  }));
  const subjectSummary = Array.from(new Set(subjects.map((subject) => subject.name))).join(", ");
  const membership = teacher.teacherSchoolMemberships[0] ?? null;
  const joinedAt = formatDate(membership?.joinedAt);

  return (
    <div className="space-y-4">
      <Link
        href="/teachers"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to teachers
      </Link>

      <PageHeader
        title={teacher.fullName}
        description={subjects.length > 0 ? subjectSummary : undefined}
        actions={
          <>
            {canUpdate && (
              <Button
                variant="secondary"
                text="Edit"
                icon={<PencilIcon className="size-4" />}
                className="w-auto"
                onClick={() => setEditOpen(true)}
              />
            )}
            {canDelete && (
              <Button
                variant="danger-outline"
                text="Remove"
                icon={<TrashIcon className="size-4" />}
                className="w-auto"
                onClick={() => setRemoveOpen(true)}
              />
            )}
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={teacher.fullName} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-900">{teacher.fullName}</p>
                <p className="text-sm text-neutral-500">{teacher.user.email}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={statusLabel} />
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Email
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm break-all text-neutral-700">
                <MailIcon className="size-4 flex-none text-neutral-400" />
                {teacher.user.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Phone
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <PhoneIcon className="size-4 flex-none text-neutral-400" />
                {teacher.phone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Department
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <GraduationCapIcon className="size-4 flex-none text-neutral-400" />
                {teacher.department?.name || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Weekly Load
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <CalendarDaysIcon className="size-4 flex-none text-neutral-400" />
                {teacher.classesPerWeek} classes / week
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <BookOpenIcon className="size-4 text-neutral-400" />
              Subject Assignments
            </h3>
            {subjects.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No subjects assigned yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {subjects.map((subject) => (
                  <li
                    key={subject.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-bg-subtle px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate text-neutral-800">{subject.name}</span>
                    <span className="flex flex-none items-center gap-2">
                      {subject.code && (
                        <span className="text-xs text-neutral-400">{subject.code}</span>
                      )}
                      <span className="type-badge rounded-full border border-neutral-200 bg-bg-default px-2 py-0.5 text-neutral-600">
                        {subject.academicYearLabel}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/teacher-assignments"
              className="mt-4 inline-block text-sm text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-900 hover:underline"
            >
              Manage assignments
            </Link>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <h3 className="text-sm font-semibold text-neutral-900">Record</h3>
            <dl className="mt-3 space-y-3 text-sm">
              {membership?.employeeCode && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-neutral-500">Employee code</dt>
                  <dd className="text-neutral-700">{membership.employeeCode}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Joined</dt>
                <dd className="text-neutral-700">{joinedAt ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {canUpdate && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Teacher"
          description={`Update ${teacher.fullName}'s account details.`}
        >
          <EditTeacherForm
            initial={{
              fullName: teacher.fullName,
              email: teacher.user.email,
              phone: teacher.phone ?? "",
              department: teacher.department?.name ?? "",
              classesPerWeek: String(teacher.classesPerWeek),
              status: statusLabel,
            }}
            onSave={handleSave}
            onClose={() => setEditOpen(false)}
          />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={removeOpen}
          onClose={() => setRemoveOpen(false)}
          title={`Remove ${teacher.fullName}?`}
          description="This action cannot be undone."
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              This will mark the teacher as inactive and revoke their access to the school. Their
              past records and assignments stay intact.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setRemoveOpen(false)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={removing ? "Removing…" : "Remove"}
                loading={removing}
                disabled={removing}
                className="w-auto"
                onClick={() => void handleRemove()}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
