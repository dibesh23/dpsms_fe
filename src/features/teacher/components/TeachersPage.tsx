"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { RowActions } from "@/shared/components/ui/row-actions";
import { useTable } from "@/shared/hooks/useTable";
import { AddTeacherForm, type AddTeacherValues } from "./AddTeacherForm";
import { EditTeacherForm, editValuesToPayload, type EditTeacherValues } from "./EditTeacherForm";
import { CredentialsRevealDialog } from "@/shared/components/ui/credentials-reveal-dialog";
import { teacherApi, type TeacherRecord } from "../api/teacherApi";
import {
  GraduationCapIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { teacherLabelToStatus, teacherStatusToLabel } from "../utils";

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  department: string;
  email: string;
  phone: string;
  classesPerWeek: number;
  status: "Active" | "On Leave" | "Invited" | "Inactive";
}

const DEPARTMENT_FILTERS = [
  { value: "Science & Math", label: "Science & Math" },
  { value: "Languages", label: "Languages" },
  { value: "Humanities", label: "Humanities" },
  { value: "Commerce", label: "Commerce" },
  { value: "Sports", label: "Sports" },
];

const toTeacher = (record: TeacherRecord): Teacher => ({
  id: record.id,
  name: record.name,
  subject: record.subject,
  department: record.department,
  email: record.email,
  phone: record.phone ?? "",
  classesPerWeek: record.classesPerWeek,
  status: teacherStatusToLabel(record.status),
});

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Teacher | null>(null);
  const [removing, setRemoving] = useState(false);
  const [credentials, setCredentials] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.TEACHER_CREATE);
  const canUpdate = can(PERMISSIONS.TEACHER_UPDATE);
  const canDelete = can(PERMISSIONS.TEACHER_DELETE);

  const load = useCallback(async () => {
    try {
      const records = await teacherApi.list();
      setTeachers(records.map(toTeacher));
    } catch {
      setTeachers([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: AddTeacherValues): Promise<boolean> => {
    try {
      const record = await teacherApi.create({
        fullName: values.fullName,
        email: values.email,
        subject: values.subject,
        department: values.department,
        phone: values.phone,
        classesPerWeek: Number(values.classesPerWeek) || 0,
        status: teacherLabelToStatus(values.status),
      });
      setTeachers((current) => [toTeacher(record), ...current]);
      setDialogOpen(false);
      if (record.credentials) {
        setCredentials({
          name: record.name,
          email: record.credentials.email,
          password: record.credentials.password,
        });
      } else {
        toast.success("Teacher invited successfully.");
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleEdit = async (values: EditTeacherValues): Promise<string | null> => {
    if (!editTarget) return "Could not save changes. Try again.";
    try {
      const record = await teacherApi.update(editTarget.id, editValuesToPayload(values));
      setTeachers((current) =>
        current.map((teacher) =>
          teacher.id === editTarget.id
            ? {
                ...teacher,
                name: record.fullName,
                department: record.department?.name ?? "",
                email: record.user.email,
                phone: record.phone ?? "",
                classesPerWeek: record.classesPerWeek,
                status: teacherStatusToLabel(record.status),
              }
            : teacher,
        ),
      );
      setEditTarget(null);
      toast.success("Teacher updated successfully.");
      return null;
    } catch (err) {
      if (err instanceof Error && "response" in err) {
        const message = (err as { response?: { data?: { error?: { message?: string } } } }).response
          ?.data?.error?.message;
        if (message) return message;
      }
      return "Could not update the teacher. Check the details and try again.";
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await teacherApi.remove(removeTarget.id);
      toast.success("Teacher removed successfully.");
      await load();
      setRemoveTarget(null);
    } catch {
      toast.error("Could not remove the teacher. Try again.");
    } finally {
      setRemoving(false);
    }
  };

  const handleCredentialsAcknowledged = useCallback(() => {
    setCredentials(null);
    toast.success("Teacher invited successfully.");
  }, [toast]);

  const table = useTable<Teacher>({
    data: teachers,
    pageSize: 6,
    getSearchText: (teacher) =>
      `${teacher.name} ${teacher.subject} ${teacher.department} ${teacher.email}`,
    filterMatch: (teacher, value) => teacher.department === value,
    sortValue: (teacher, key) => String(teacher[key as keyof Teacher] ?? ""),
  });

  const departments = useMemo(
    () => new Set(teachers.map((teacher) => teacher.department)).size,
    [teachers],
  );
  const weeklyLoad = useMemo(() => {
    if (teachers.length === 0) return 0;
    return Math.round(
      teachers.reduce((sum, teacher) => sum + teacher.classesPerWeek, 0) / teachers.length,
    );
  }, [teachers]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers"
        description="Faculty accounts, subjects and weekly assignments"
        actions={
          canCreate ? (
            <Button
              text="Invite Teacher"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setDialogOpen(true)}
            />
          ) : undefined
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Teachers"
          value={String(teachers.length)}
          icon={<GraduationCapIcon className="size-4" />}
        />
        <StatsCard
          label="Departments"
          value={String(departments)}
          icon={<UsersIcon className="size-4" />}
        />
        <StatsCard
          label="Avg. Weekly Load"
          value={`${weeklyLoad} classes`}
          deltaDirection="neutral"
          icon={<GraduationCapIcon className="size-4" />}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by department"
          options={DEPARTMENT_FILTERS}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search teachers…" />
      </div>

      {table.rows.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState
            title="No teachers found"
            description="Try adjusting your search or filters."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {table.rows.map((teacher) => (
            <div
              key={teacher.id}
              className="flex flex-col rounded-lg border border-neutral-200 bg-bg-default p-5 transition-colors hover:border-neutral-300"
            >
              <div className="flex items-start justify-between gap-3">
                <Link href={`/teachers/${teacher.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar name={teacher.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900 transition-colors hover:underline">
                      {teacher.name}
                    </p>
                    <p className="truncate text-xs text-neutral-500">{teacher.subject || "—"}</p>
                  </div>
                </Link>
                <StatusBadge status={teacher.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center gap-2 text-neutral-500">
                  <span className="w-4 flex-none text-neutral-400">
                    <GraduationCapIcon className="size-4" />
                  </span>
                  <span className="truncate">{teacher.department || "—"}</span>
                </p>
                <p className="flex items-center gap-2 text-neutral-500">
                  <span className="w-4 flex-none text-neutral-400">
                    <MailIcon className="size-4" />
                  </span>
                  <span className="truncate">{teacher.email}</span>
                </p>
                <p className="flex items-center gap-2 text-neutral-500">
                  <span className="w-4 flex-none text-neutral-400">
                    <PhoneIcon className="size-4" />
                  </span>
                  {teacher.phone || "—"}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-xs text-neutral-400">
                  {teacher.classesPerWeek} classes / week
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100")}>
                    <span
                      className="block h-full rounded-full bg-neutral-900"
                      style={{
                        width: `${Math.min(100, (teacher.classesPerWeek / 30) * 100)}%`,
                      }}
                    />
                  </span>
                  <RowActions
                    actions={[
                      {
                        label: "View details",
                        href: `/teachers/${teacher.id}`,
                      },
                      ...(canUpdate
                        ? [
                            {
                              label: "Edit teacher",
                              icon: <PencilIcon className="size-4" />,
                              onClick: () => setEditTarget(teacher),
                            },
                          ]
                        : []),
                      ...(canDelete
                        ? [
                            {
                              label: "Remove teacher",
                              icon: <TrashIcon className="size-4" />,
                              danger: true,
                              onClick: () => setRemoveTarget(teacher),
                            },
                          ]
                        : []),
                    ]}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {canCreate && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Invite Teacher"
          description="Create a faculty account for the current academic year."
        >
          <AddTeacherForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
        </Dialog>
      )}

      {canUpdate && editTarget && (
        <Dialog
          open={editTarget !== null}
          onClose={() => setEditTarget(null)}
          title="Edit Teacher"
          description={`Update ${editTarget.name}'s account details.`}
        >
          <EditTeacherForm
            initial={{
              fullName: editTarget.name,
              email: editTarget.email,
              phone: editTarget.phone,
              department: editTarget.department,
              classesPerWeek: String(editTarget.classesPerWeek),
              status: editTarget.status,
            }}
            onSave={handleEdit}
            onClose={() => setEditTarget(null)}
          />
        </Dialog>
      )}

      {canDelete && removeTarget && (
        <Dialog
          open={removeTarget !== null}
          onClose={() => setRemoveTarget(null)}
          title={`Remove ${removeTarget.name}?`}
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
                onClick={() => setRemoveTarget(null)}
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

      <CredentialsRevealDialog
        open={credentials !== null}
        personName={credentials?.name ?? ""}
        credentials={{
          email: credentials?.email ?? "",
          password: credentials?.password ?? "",
        }}
        personType="Teacher"
        slipFooter="Please keep this credential safe. Do not share it with anyone other than the teacher."
        onAcknowledged={handleCredentialsAcknowledged}
      />
    </div>
  );
}
