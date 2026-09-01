"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { AddTeacherForm, type AddTeacherValues } from "./AddTeacherForm";
import { EditTeacherForm, editValuesToPayload, type EditTeacherValues } from "./EditTeacherForm";
import { CredentialsRevealDialog } from "@/shared/components/ui/credentials-reveal-dialog";
import { teacherApi, type TeacherRecord } from "../api/teacherApi";
import { academicApi } from "@/features/academic/api/academicApi";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { teacherLabelToStatus, teacherStatusToLabel } from "../utils";
import {
  GraduationCapIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  subjects: string[];
  department: string;
  email: string;
  phone: string;
  classesPerWeek: number;
  status: "Active" | "On Leave" | "Invited" | "Inactive";
}

const toTeacher = (record: TeacherRecord): Teacher => ({
  id: record.id,
  name: record.name,
  subject: record.subject,
  subjects: record.subjects ?? [],
  department: record.department,
  email: record.email,
  phone: record.phone ?? "",
  classesPerWeek: record.classesPerWeek,
  status: teacherStatusToLabel(record.status),
});

const sortValueOf = <T extends object>(row: T, key: string): string | number => {
  const value = row[key as keyof T];
  return typeof value === "number" ? value : String(value ?? "");
};

const COLUMNS: Column<Teacher>[] = [
  {
    key: "name",
    header: "Teacher",
    sortValue: (row) => row.name,
    render: (row) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{row.name}</p>
          <p className="truncate text-xs text-neutral-400">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "subject",
    header: "Subjects",
    sortValue: (row) => row.subjects.join(", ") || row.subject,
    render: (row) => {
      const subjects =
        row.subjects.length > 0
          ? row.subjects
          : row.subject
            ? [row.subject]
            : [];
      return subjects.length === 0 ? (
        <span className="text-neutral-400">—</span>
      ) : (
        <span className="flex max-w-64 flex-wrap gap-1">
          {subjects.map((subject) => (
            <span
              key={subject}
              className="inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600"
            >
              {subject}
            </span>
          ))}
        </span>
      );
    },
  },
  {
    key: "department",
    header: "Department",
    sortValue: (row) => row.department,
    render: (row) => (
      <span className="text-neutral-600">{row.department || "—"}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortValue: (row) => row.status,
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "classesPerWeek",
    header: "Classes/wk",
    align: "right",
    sortValue: (row) => row.classesPerWeek,
    render: (row) => <span className="font-medium text-neutral-700">{row.classesPerWeek}</span>,
  },
];

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departmentRecords, setDepartmentRecords] = useState<string[]>([]);
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

  useEffect(() => {
    let active = true;
    academicApi
      .listDepartments()
      .then((records) => {
        if (active) setDepartmentRecords(records.map((d) => d.name));
      })
      .catch(() => {
        if (active) setDepartmentRecords([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAdd = async (values: AddTeacherValues): Promise<boolean> => {
    try {
      const record = await teacherApi.create({
        fullName: values.fullName,
        email: values.email,
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
    pageSize: 10,
    getSearchText: (teacher) =>
      `${teacher.name} ${teacher.subject} ${teacher.subjects.join(" ")} ${teacher.department} ${teacher.email}`,
    filterMatch: (teacher, value) => teacher.department === value,
    sortValue: sortValueOf,
    defaultSortKey: "name",
  });

  const departments = useMemo(
    () => new Set(teachers.map((teacher) => teacher.department)).size,
    [teachers],
  );
  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...departmentRecords,
          ...teachers.map((teacher) => teacher.department).filter(Boolean),
        ]),
      )
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ value: name, label: name })),
    [departmentRecords, teachers],
  );
  const weeklyLoad = useMemo(() => {
    if (teachers.length === 0) return 0;
    return Math.round(
      teachers.reduce((sum, teacher) => sum + teacher.classesPerWeek, 0) / teachers.length,
    );
  }, [teachers]);

  const actionColumns: Column<Teacher>[] = canUpdate || canDelete
    ? [
        ...COLUMNS,
        {
          key: "actions",
          header: "",
          align: "right" as const,
          render: (row: Teacher) => (
            <RowActions
              actions={[
                ...(canUpdate
                  ? [
                      {
                        label: "Edit teacher",
                        icon: <PencilIcon className="size-3.5" />,
                        onClick: () => setEditTarget(row),
                      },
                    ]
                  : []),
                ...(canDelete
                  ? [
                      {
                        label: "Remove teacher",
                        icon: <TrashIcon className="size-3.5" />,
                        danger: true,
                        onClick: () => setRemoveTarget(row),
                      },
                    ]
                  : []),
              ]}
            />
          ),
        },
      ]
    : COLUMNS;

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
          options={departmentOptions}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search teachers…" />
      </div>

      <DataTable
        columns={actionColumns}
        data={table.pageRows}
        keyExtractor={(row) => row.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No teachers found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="teachers"
          />
        }
      />

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
