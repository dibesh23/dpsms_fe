"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { academicApi, type SubjectRecord as SubjectRecordDto } from "../api/academicApi";
import { teacherApi, type TeacherRecord } from "@/features/teacher/api/teacherApi";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EditSubjectForm, type EditSubjectValues, type EditableSubject } from "./EditSubjectForm";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  LayoutGridIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

const TEACHER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  INVITED: "Invited",
  INACTIVE: "Inactive",
};

interface ClassSubjectMapping {
  classId: string;
  className: string;
  isElectiveGroup: boolean;
}

export function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const subjectId = params?.id;
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.ACADEMIC_SUBJECT_UPDATE);
  const canDelete = can(PERMISSIONS.ACADEMIC_SUBJECT_DELETE);

  const [subject, setSubject] = useState<SubjectRecordDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [classMappings, setClassMappings] = useState<ClassSubjectMapping[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoadError(null);
    try {
      const record = await academicApi.getSubject(subjectId);
      setSubject(record);

      const [teacherRecords, classRecords] = await Promise.all([
        teacherApi.list().catch(() => [] as TeacherRecord[]),
        academicApi.listClasses().catch(() => []),
      ]);
      setTeachers(teacherRecords.filter((teacher) => teacher.subject === record.name));

      const mappings = await Promise.all(
        classRecords.map(async (schoolClass) => {
          try {
            const mapped = await academicApi.listClassSubjects(schoolClass.id);
            return mapped
              .filter((cs) => cs.subjectId === record.id)
              .map<ClassSubjectMapping>((cs) => ({
                classId: schoolClass.id,
                className: schoolClass.name,
                isElectiveGroup: cs.isElectiveGroup,
              }));
          } catch {
            return [] as ClassSubjectMapping[];
          }
        }),
      );
      setClassMappings(mappings.flat());
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not load this subject."));
    }
  }, [subjectId]);

  useEffect(() => {
    void load();
    void academicApi
      .listDepartments()
      .then((records) => setDepartments(records.map((d) => d.name)))
      .catch(() => setDepartments([]));
  }, [load]);

  const editInitial = useMemo<EditableSubject | null>(
    () =>
      subject
        ? {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            type: subject.type === "ELECTIVE" ? "ELECTIVE" : "COMPULSORY",
            department: subject.department,
          }
        : null,
    [subject],
  );

  const handleUpdate = async (values: EditSubjectValues): Promise<string | null> => {
    if (!subjectId) return "Could not save changes. Try again.";
    try {
      await academicApi.updateSubject(subjectId, values);
      setEditOpen(false);
      toast.success("Subject updated successfully.");
      void load();
      return null;
    } catch (err) {
      return getApiErrorMessage(
        err,
        "Could not update the subject. Check the details and try again.",
      );
    }
  };

  const handleDelete = async () => {
    if (!subjectId || !subject) return;
    setDeleteBusy(true);
    try {
      await academicApi.deleteSubject(subjectId);
      toast.success(`Subject "${subject.name}" removed.`);
      router.push("/subjects");
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Could not remove the subject. It may still be assigned to teachers or classes.",
        ),
      );
      setDeleteBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/subjects"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to subjects
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Subject not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!subject) {
    return <LoadingState label="Loading subject…" />;
  }

  const stats = [
    {
      label: "Assigned Teachers",
      value: String(teachers.length),
      icon: <UsersIcon className="size-5" />,
    },
    {
      label: "Mapped Classes",
      value: String(classMappings.length),
      icon: <LayoutGridIcon className="size-5" />,
    },
    {
      label: "Type",
      value: subject.type === "ELECTIVE" ? "Elective" : "Compulsory",
      icon: <BookOpenIcon className="size-5" />,
    },
  ];

  return (
    <div className="space-y-4">
      <Link
        href="/subjects"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to subjects
      </Link>

      <PageHeader
        title={subject.name}
        description={subject.code ? `Code ${subject.code}` : "Curriculum subject"}
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
                onClick={() => setDeleteOpen(true)}
              />
            )}
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-bg-default p-5"
          >
            <span className="flex size-10 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-600">
              {stat.icon}
            </span>
            <div>
              <p className="text-xs text-neutral-400">{stat.label}</p>
              <p className="mt-0.5 font-medium text-neutral-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-bg-default p-5">
        <h2 className="font-medium text-neutral-900">Details</h2>
        <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-neutral-400">Code</dt>
            <dd className="mt-0.5 text-sm text-neutral-800">{subject.code || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Type</dt>
            <dd className="mt-0.5 text-sm text-neutral-800">
              {subject.type === "ELECTIVE" ? "Elective" : "Compulsory"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Department</dt>
            <dd className="mt-0.5 text-sm text-neutral-800">{subject.department || "—"}</dd>
          </div>
        </dl>
      </section>

      {/* Assigned teachers */}
      <section className="rounded-lg border border-neutral-200 bg-bg-default">
        <header className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-medium text-neutral-900">Teachers</h2>
          <p className="text-xs text-neutral-400">{teachers.length} teaching this subject</p>
        </header>
        {teachers.length === 0 ? (
          <EmptyState
            title="No teachers assigned"
            description="Teachers appear here once they are assigned to this subject."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {teachers.map((teacher) => (
              <li key={teacher.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={teacher.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{teacher.name}</p>
                  <p className="truncate text-xs text-neutral-400">
                    {[teacher.department, `${teacher.classesPerWeek} classes/wk`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-xs text-neutral-500">{teacher.email}</p>
                  <p className="truncate text-xs text-neutral-400">{teacher.phone ?? "—"}</p>
                </div>
                <StatusBadge status={TEACHER_STATUS_LABELS[teacher.status] ?? teacher.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Mapped classes */}
      <section className="rounded-lg border border-neutral-200 bg-bg-default">
        <header className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-medium text-neutral-900">Classes</h2>
          <p className="text-xs text-neutral-400">
            {classMappings.length} classes mapped to this subject
          </p>
        </header>
        {classMappings.length === 0 ? (
          <EmptyState
            title="Not mapped to any class"
            description="Map this subject to a class from the class detail page."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {classMappings.map((mapping) => (
              <li key={mapping.classId} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-xs font-semibold text-neutral-600">
                  {mapping.className.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">
                    {mapping.className}
                  </p>
                  <p className="truncate text-xs text-neutral-400">
                    {mapping.isElectiveGroup ? "Elective group" : "Core subject"}
                  </p>
                </div>
                <Link
                  href={`/classes/${mapping.classId}`}
                  className="flex-none text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  View class
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canUpdate && editOpen && editInitial && (
        <Dialog
          open
          onClose={() => setEditOpen(false)}
          title="Edit Subject"
          description={`Update "${editInitial.name}".`}
        >
          <EditSubjectForm
            subject={editInitial}
            departments={departments}
            onUpdate={handleUpdate}
            onClose={() => setEditOpen(false)}
          />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Remove Subject"
          description={`Remove "${subject.name}" from the catalog?`}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Subjects with active teacher assignments or class mappings cannot be removed.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setDeleteOpen(false)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={deleteBusy ? "Removing…" : "Remove Subject"}
                loading={deleteBusy}
                disabled={deleteBusy}
                className="w-auto"
                onClick={() => void handleDelete()}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
