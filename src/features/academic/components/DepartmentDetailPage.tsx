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
import { formatDate } from "@/shared/lib/format";
import { academicApi, type DepartmentRecord as DepartmentRecordDto } from "../api/academicApi";
import { teacherApi, type TeacherRecord } from "@/features/teacher/api/teacherApi";
import { staffApi, type StaffRecord } from "@/features/staff/api/staffApi";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import {
  SetDepartmentHeadForm,
  headValueToPayload,
  type DepartmentHeadOption,
  type SetDepartmentHeadValues,
} from "./SetDepartmentHeadForm";
import {
  EditDepartmentForm,
  editValuesToPayload,
  type EditDepartmentValues,
} from "./EditDepartmentForm";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  Building2Icon,
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

const STAFF_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_LEAVE: "On Leave",
  RESIGNED: "Resigned",
};

export function DepartmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const departmentId = params?.id;
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.ACADEMIC_DEPARTMENT_UPDATE);
  const canDelete = can(PERMISSIONS.ACADEMIC_DEPARTMENT_DELETE);

  const [department, setDepartment] = useState<DepartmentRecordDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [headOpen, setHeadOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!departmentId) return;
    setLoadError(null);
    try {
      setDepartment(await academicApi.getDepartment(departmentId));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not load this department."));
    }
  }, [departmentId]);

  useEffect(() => {
    void load();
    void teacherApi
      .list()
      .then(setTeachers)
      .catch(() => setTeachers([]));
    void staffApi
      .list()
      .then(setStaff)
      .catch(() => setStaff([]));
  }, [load]);

  const headOptions = useMemo(() => {
    if (!department) return [];
    const inDepartment: DepartmentHeadOption[] = [
      ...teachers
        .filter((t) => t.department === department.name)
        .map((t) => ({ id: t.id, name: t.name, kind: "teacher" as const })),
      ...staff
        .filter((s) => s.department === department.name)
        .map((s) => ({ id: s.id, name: s.name, kind: "staff" as const })),
    ];
    const current = department.headTeacher
      ? {
          id: department.headTeacher.id,
          name: department.headTeacher.fullName,
          kind: "teacher" as const,
        }
      : department.headStaff
        ? {
            id: department.headStaff.id,
            name: department.headStaff.fullName,
            kind: "staff" as const,
          }
        : null;
    if (current && !inDepartment.some((option) => option.id === current.id)) {
      return [current, ...inDepartment];
    }
    return inDepartment;
  }, [teachers, staff, department]);

  const departmentTeachers = useMemo(
    () => (department ? teachers.filter((t) => t.department === department.name) : []),
    [teachers, department],
  );

  const handleSaveEdit = async (values: EditDepartmentValues): Promise<string | null> => {
    if (!departmentId) return "Could not save changes. Try again.";
    try {
      setDepartment(await academicApi.updateDepartment(departmentId, editValuesToPayload(values)));
      setEditOpen(false);
      toast.success("Department updated successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(
        err,
        "Could not update the department. Check the details and try again.",
      );
    }
  };

  const departmentStaff = useMemo(
    () => (department ? staff.filter((s) => s.department === department.name) : []),
    [staff, department],
  );

  const handleUpdateHead = async (values: SetDepartmentHeadValues): Promise<string | null> => {
    if (!department) return "Department is not loaded yet.";
    try {
      const record = await academicApi.updateDepartment(
        department.id,
        headValueToPayload(values.head),
      );
      setDepartment(record);
      setHeadOpen(false);
      toast.success("Department head updated successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not update the department head. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!department) return;
    setDeleteBusy(true);
    try {
      await academicApi.deleteDepartment(department.id);
      toast.success(`Department "${department.name}" removed.`);
      router.push("/departments");
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Could not remove the department. Teachers or staff may still be assigned to it.",
        ),
      );
      setDeleteBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/departments"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to departments
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Department not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!department) {
    return <LoadingState label="Loading department…" />;
  }

  const stats = [
    {
      label: "Staff members",
      value: department.staffCount,
      icon: <UsersIcon className="size-4" />,
    },
    {
      label: "Teachers",
      value: department.teacherCount,
      icon: <Building2Icon className="size-4" />,
    },
    {
      label: "Subjects",
      value: department.subjectCount,
      icon: <BookOpenIcon className="size-4" />,
    },
  ];

  return (
    <div className="space-y-4">
      <Link
        href="/departments"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to departments
      </Link>

      <PageHeader
        title={department.name}
        description={`Created ${formatDate(department.createdAt)}`}
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
            {canUpdate && (
              <Button
                variant="secondary"
                text="Set Head"
                icon={<UsersIcon className="size-4" />}
                className="w-auto"
                onClick={() => setHeadOpen(true)}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-bg-default p-5">
          <h2 className="font-medium text-neutral-900">About</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {department.description || "No description has been added for this department."}
          </p>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-bg-default p-5">
          <h2 className="font-medium text-neutral-900">Department Head</h2>
          <div className="mt-3 flex items-center gap-3">
            <Avatar
              name={department.headTeacher?.fullName ?? department.headStaff?.fullName ?? ""}
              size="lg"
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900">
                {department.headTeacher?.fullName ??
                  department.headStaff?.fullName ??
                  "Not assigned"}
              </p>
              <p className="text-xs text-neutral-400">
                {department.headTeacher
                  ? "Teacher lead"
                  : department.headStaff
                    ? "Staff lead"
                    : "Assign a teacher or staff member from this department"}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Members: teachers */}
      <section className="rounded-lg border border-neutral-200 bg-bg-default">
        <header className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-medium text-neutral-900">Teachers</h2>
          <p className="text-xs text-neutral-400">{departmentTeachers.length} in this department</p>
        </header>
        {departmentTeachers.length === 0 ? (
          <EmptyState
            title="No teachers assigned"
            description="Teachers appear here once they are assigned to this department."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {departmentTeachers.map((teacher) => (
              <li key={teacher.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={teacher.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{teacher.name}</p>
                  <p className="truncate text-xs text-neutral-400">
                    {[teacher.subject, `${teacher.classesPerWeek} classes/wk`]
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

      {/* Members: staff */}
      <section className="rounded-lg border border-neutral-200 bg-bg-default">
        <header className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-medium text-neutral-900">Staff</h2>
          <p className="text-xs text-neutral-400">{departmentStaff.length} in this department</p>
        </header>
        {departmentStaff.length === 0 ? (
          <EmptyState
            title="No staff assigned"
            description="Staff members appear here once they are assigned to this department."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {departmentStaff.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={member.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{member.name}</p>
                  <p className="truncate text-xs text-neutral-400">{member.role}</p>
                </div>
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="truncate text-xs text-neutral-500">{member.email}</p>
                  <p className="truncate text-xs text-neutral-400">{member.phone ?? "—"}</p>
                </div>
                <StatusBadge status={STAFF_STATUS_LABELS[member.status] ?? member.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {canUpdate && editOpen && (
        <Dialog
          open
          onClose={() => setEditOpen(false)}
          title="Edit Department"
          description={`Update "${department.name}".`}
        >
          <EditDepartmentForm
            initial={{
              name: department.name,
              description: department.description ?? "",
            }}
            onSave={handleSaveEdit}
            onClose={() => setEditOpen(false)}
          />
        </Dialog>
      )}

      {canUpdate && (
        <Dialog
          open={headOpen}
          onClose={() => setHeadOpen(false)}
          title="Set Department Head"
          description="Assign a teacher or staff member from this department as its head."
        >
          <SetDepartmentHeadForm
            department={{
              id: department.id,
              name: department.name,
              headTeacherId: department.headTeacher?.id ?? null,
              headStaffId: department.headStaff?.id ?? null,
            }}
            options={headOptions}
            onUpdate={handleUpdateHead}
            onClose={() => setHeadOpen(false)}
          />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Remove Department"
          description={`This will remove "${department.name}". This action cannot be undone.`}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Departments with active teachers or staff assigned cannot be removed.
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
                text={deleteBusy ? "Removing…" : "Remove Department"}
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
