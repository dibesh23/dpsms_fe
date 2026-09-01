"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { Avatar } from "@/shared/components/ui/avatar";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { AddDepartmentForm, type AddDepartmentValues } from "./AddDepartmentForm";
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
import { academicApi, type DepartmentRecord as DepartmentRecordDto } from "../api/academicApi";
import { teacherApi } from "@/features/teacher/api/teacherApi";
import { staffApi } from "@/features/staff/api/staffApi";
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  Building2Icon,
  PencilIcon,
  PlusIcon,
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

const sortValueOf = <T extends object>(row: T, key: string): string | number => {
  const value = row[key as keyof T];
  return typeof value === "number" ? value : String(value ?? "");
};

const COLUMNS: Column<DepartmentRecordDto>[] = [
  {
    key: "name",
    header: "Department",
    sortValue: (row) => row.name,
    render: (row) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
          <Building2Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{row.name}</p>
          {row.description && (
            <p className="truncate text-xs text-neutral-400">{row.description}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "staffCount",
    header: "Staff",
    align: "right",
    sortValue: (row) => row.staffCount,
    render: (row) => <span className="font-medium text-neutral-700">{row.staffCount}</span>,
  },
  {
    key: "teacherCount",
    header: "Teachers",
    align: "right",
    sortValue: (row) => row.teacherCount,
    render: (row) => <span className="font-medium text-neutral-700">{row.teacherCount}</span>,
  },
  {
    key: "subjectCount",
    header: "Subjects",
    align: "right",
    sortValue: (row) => row.subjectCount,
    render: (row) => <span className="font-medium text-neutral-700">{row.subjectCount}</span>,
  },
  {
    key: "head",
    header: "Head",
    sortValue: (row) => row.headTeacher?.fullName ?? row.headStaff?.fullName ?? "",
    render: (row) => {
      const name = row.headTeacher?.fullName ?? row.headStaff?.fullName;
      return name ? (
        <div className="flex items-center gap-2">
          <Avatar name={name} size="sm" />
          <span className="truncate text-neutral-700">{name}</span>
        </div>
      ) : (
        <span className="text-neutral-400">Not assigned</span>
      );
    },
  },
];

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentRecordDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [headTarget, setHeadTarget] = useState<DepartmentRecordDto | null>(null);
  const [editTarget, setEditTarget] = useState<DepartmentRecordDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DepartmentRecordDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string; department: string }>>(
    [],
  );
  const [staff, setStaff] = useState<Array<{ id: string; name: string; department: string }>>([]);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.ACADEMIC_DEPARTMENT_CREATE);
  const canUpdate = can(PERMISSIONS.ACADEMIC_DEPARTMENT_UPDATE);
  const canDelete = can(PERMISSIONS.ACADEMIC_DEPARTMENT_DELETE);

  const load = useCallback(async () => {
    try {
      setDepartments(await academicApi.listDepartments());
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openHeadDialog = async (department: DepartmentRecordDto) => {
    setHeadTarget(department);
    if (teachers.length === 0) {
      try {
        const records = await teacherApi.list();
        setTeachers(records.map((t) => ({ id: t.id, name: t.name, department: t.department })));
      } catch {
        setTeachers([]);
      }
    }
    if (staff.length === 0) {
      try {
        const records = await staffApi.list();
        setStaff(records.map((s) => ({ id: s.id, name: s.name, department: s.department })));
      } catch {
        setStaff([]);
      }
    }
  };

  const headOptions = useMemo(() => {
    if (!headTarget) return [];
    const inDepartment: DepartmentHeadOption[] = [
      ...teachers
        .filter((t) => t.department === headTarget.name)
        .map((t) => ({ id: t.id, name: t.name, kind: "teacher" as const })),
      ...staff
        .filter((s) => s.department === headTarget.name)
        .map((s) => ({ id: s.id, name: s.name, kind: "staff" as const })),
    ];
    const current = headTarget.headTeacher
      ? {
          id: headTarget.headTeacher.id,
          name: headTarget.headTeacher.fullName,
          kind: "teacher" as const,
        }
      : headTarget.headStaff
        ? {
            id: headTarget.headStaff.id,
            name: headTarget.headStaff.fullName,
            kind: "staff" as const,
          }
        : null;
    if (current && !inDepartment.some((option) => option.id === current.id)) {
      return [current, ...inDepartment];
    }
    return inDepartment;
  }, [teachers, staff, headTarget]);

  const handleAdd = async (values: AddDepartmentValues): Promise<boolean> => {
    try {
      await academicApi.createDepartment({
        name: values.name,
        description: values.description?.trim() || undefined,
      });
      await load();
      setDialogOpen(false);
      toast.success("Department added successfully.");
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add the department. Try again."));
      return false;
    }
  };

  const handleUpdateHead = async (values: SetDepartmentHeadValues): Promise<string | null> => {
    if (!headTarget) return "Could not update the department head. Try again.";
    try {
      const record = await academicApi.updateDepartment(
        headTarget.id,
        headValueToPayload(values.head),
      );
      setDepartments((current) =>
        current.map((department) => (department.id === record.id ? record : department)),
      );
      setHeadTarget(null);
      toast.success("Department head updated successfully.");
      return null;
    } catch (err) {
      if (err instanceof Error && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } })
          .response;
        const message = response?.data?.error?.message;
        if (message) return message;
      }
      return "Could not update the department head. Check the details and try again.";
    }
  };

  const handleSaveEdit = async (values: EditDepartmentValues): Promise<string | null> => {
    if (!editTarget) return "Could not save changes. Try again.";
    try {
      const record = await academicApi.updateDepartment(editTarget.id, editValuesToPayload(values));
      setDepartments((current) =>
        current.map((department) => (department.id === record.id ? record : department)),
      );
      setEditTarget(null);
      toast.success("Department updated successfully.");
      return null;
    } catch (err) {
      if (err instanceof Error && "response" in err) {
        const response = (err as { response?: { data?: { error?: { message?: string } } } })
          .response;
        const message = response?.data?.error?.message;
        if (message) return message;
      }
      return "Could not update the department. Check the details and try again.";
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await academicApi.deleteDepartment(deleteTarget.id);
      setDepartments((current) => current.filter((d) => d.id !== deleteTarget.id));
      toast.success(`Department "${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Could not remove the department. Teachers or staff may still be assigned to it.",
        ),
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  const table = useTable<DepartmentRecordDto>({
    data: departments,
    pageSize: 10,
    getSearchText: (department) =>
      `${department.name} ${department.headTeacher?.fullName ?? ""} ${department.headStaff?.fullName ?? ""} ${department.description}`,
    sortValue: sortValueOf,
    defaultSortKey: "name",
  });

  const totalStaff = departments.reduce((sum, department) => sum + department.staffCount, 0);
  const totalSubjects = departments.reduce((sum, department) => sum + department.subjectCount, 0);

  const columnsWithActions: Column<DepartmentRecordDto>[] = canUpdate || canDelete
    ? [
        ...COLUMNS,
        {
          key: "actions",
          header: "",
          align: "right" as const,
          render: (row: DepartmentRecordDto) => (
            <RowActions
              actions={[
                {
                  label: "View details",
                  icon: <ArrowUpRightIcon className="size-3.5" />,
                  href: `/departments/${row.id}`,
                },
                ...(canUpdate
                  ? [
                      {
                        label: "Edit",
                        icon: <PencilIcon className="size-3.5" />,
                        onClick: () => setEditTarget(row),
                      },
                      {
                        label: "Set Head",
                        icon: <UsersIcon className="size-3.5" />,
                        onClick: () => void openHeadDialog(row),
                      },
                    ]
                  : []),
                ...(canDelete
                  ? [
                      {
                        label: "Remove",
                        icon: <TrashIcon className="size-3.5" />,
                        danger: true,
                        onClick: () => setDeleteTarget(row),
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
        title="Departments"
        description="Academic departments and their faculty leads"
        actions={
          canCreate ? (
            <Button
              text="New Department"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setDialogOpen(true)}
            />
          ) : undefined
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Departments"
          value={String(departments.length)}
          delta="All faculties"
          deltaDirection="neutral"
          icon={<Building2Icon className="size-4" />}
        />
        <StatsCard
          label="Department Staff"
          value={String(totalStaff)}
          delta="Across all faculties"
          deltaDirection="neutral"
          icon={<UsersIcon className="size-4" />}
        />
        <StatsCard
          label="Taught Subjects"
          value={String(totalSubjects)}
          delta="Across all faculties"
          deltaDirection="neutral"
          icon={<BookOpenIcon className="size-4" />}
        />
      </section>

      <div className="flex items-center justify-end">
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search departments…" />
      </div>

      <DataTable
        columns={columnsWithActions}
        data={table.pageRows}
        keyExtractor={(row) => row.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No departments found",
          description: "Try adjusting your search.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="departments"
          />
        }
      />

      {canCreate && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add Department"
          description="Create a new academic department."
        >
          <AddDepartmentForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
        </Dialog>
      )}

      {canUpdate && editTarget && (
        <Dialog
          open
          onClose={() => setEditTarget(null)}
          title="Edit Department"
          description={`Update "${editTarget.name}".`}
        >
          <EditDepartmentForm
            initial={{
              name: editTarget.name,
              description: editTarget.description ?? "",
            }}
            onSave={handleSaveEdit}
            onClose={() => setEditTarget(null)}
          />
        </Dialog>
      )}

      {canUpdate && (
        <Dialog
          open={headTarget !== null}
          onClose={() => setHeadTarget(null)}
          title="Set Department Head"
          description="Assign a teacher or staff member from this department as its head."
        >
          {headTarget && (
            <SetDepartmentHeadForm
              department={{
                id: headTarget.id,
                name: headTarget.name,
                headTeacherId: headTarget.headTeacher?.id ?? null,
                headStaffId: headTarget.headStaff?.id ?? null,
              }}
              options={headOptions}
              onUpdate={handleUpdateHead}
              onClose={() => setHeadTarget(null)}
            />
          )}
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Remove Department"
          description={
            deleteTarget ? `Remove "${deleteTarget.name}"? This action cannot be undone.` : ""
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Departments with active teachers or staff assigned cannot be removed.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setDeleteTarget(null)}
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
