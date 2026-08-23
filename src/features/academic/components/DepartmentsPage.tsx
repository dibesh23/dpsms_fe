"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { AddDepartmentForm, type AddDepartmentValues } from "./AddDepartmentForm";
import {
  SetDepartmentHeadForm,
  type SetDepartmentHeadValues,
} from "./SetDepartmentHeadForm";
import { academicApi } from "../api/academicApi";
import { teacherApi } from "@/features/teacher/api/teacherApi";
import { BookOpenIcon, Building2Icon, PlusIcon, UsersIcon } from "@/shared/components/ui/icons";

export interface Department {
  id: string;
  name: string;
  headTeacher: { id: string; fullName: string } | null;
  staffCount: number;
  teacherCount: number;
  subjectCount: number;
  description: string;
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [headTarget, setHeadTarget] = useState<Department | null>(null);
  const [teachers, setTeachers] = useState<
    Array<{ id: string; name: string; department: string }>
  >([]);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.ACADEMIC_DEPARTMENT_CREATE);
  const canUpdate = can(PERMISSIONS.ACADEMIC_DEPARTMENT_UPDATE);

  const load = useCallback(async () => {
    try {
      const records = await academicApi.listDepartments();
      setDepartments(
        records.map((r) => ({
          id: r.id,
          name: r.name,
          headTeacher: r.headTeacher,
          staffCount: r.staffCount,
          teacherCount: r.teacherCount,
          subjectCount: r.subjectCount,
          description: r.description,
        })),
      );
    } catch {
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openHeadDialog = async (department: Department) => {
    setHeadTarget(department);
    if (teachers.length === 0) {
      try {
        const records = await teacherApi.list();
        setTeachers(
          records.map((t) => ({ id: t.id, name: t.name, department: t.department })),
        );
      } catch {
        setTeachers([]);
      }
    }
  };

  const headOptions = useMemo(() => {
    if (!headTarget) return [];
    const inDepartment = teachers.filter(
      (t) => t.department === headTarget.name,
    );
    // Keep the current head selectable even if their membership drifted.
    const current = headTarget.headTeacher;
    if (current && !inDepartment.some((t) => t.id === current.id)) {
      return [{ id: current.id, name: current.fullName }, ...inDepartment];
    }
    return inDepartment;
  }, [teachers, headTarget]);

  const handleAdd = async (values: AddDepartmentValues): Promise<boolean> => {
    try {
      const record = await academicApi.createDepartment({
        name: values.name,
        description: values.description?.trim() || undefined,
      });
      setDepartments((current) => [
        {
          id: record.id,
          name: record.name,
          headTeacher: record.headTeacher,
          staffCount: 0,
          teacherCount: 0,
          subjectCount: 0,
          description: record.description,
        },
        ...current,
      ]);
      setDialogOpen(false);
      toast.success("Department added successfully.");
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdateHead = async (
    values: SetDepartmentHeadValues,
  ): Promise<string | null> => {
    if (!headTarget) return "Could not update the department head. Try again.";
    try {
      const record = await academicApi.updateDepartment(headTarget.id, {
        headTeacherId: values.headTeacherId || null,
      });
      setDepartments((current) =>
        current.map((department) =>
          department.id === record.id
            ? {
                id: record.id,
                name: record.name,
                headTeacher: record.headTeacher,
                staffCount: record.staffCount,
                teacherCount: record.teacherCount,
                subjectCount: record.subjectCount,
                description: record.description,
              }
            : department,
        ),
      );
      setHeadTarget(null);
      toast.success("Department head updated successfully.");
      return null;
    } catch (err) {
      if (err instanceof Error && "response" in err) {
        const response = (
          err as { response?: { data?: { error?: { message?: string } } } }
        ).response;
        const message = response?.data?.error?.message;
        if (message) return message;
      }
      return "Could not update the department head. Check the details and try again.";
    }
  };

  const table = useTable<Department>({
    data: departments,
    pageSize: 6,
    getSearchText: (department) =>
      `${department.name} ${department.headTeacher?.fullName ?? ""} ${department.description}`,
    sortValue: (department, key) => String(department[key as keyof Department] ?? ""),
    defaultSortKey: "name",
  });

  const totalStaff = departments.reduce((sum, department) => sum + department.staffCount, 0);
  const totalSubjects = departments.reduce((sum, department) => sum + department.subjectCount, 0);

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

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">{table.total} departments</p>
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Search departments…"
        />
      </div>

      {table.rows.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="No departments found" description="Try adjusting your search." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {table.rows.map((department) => (
            <div
              key={department.id}
              className="flex flex-col rounded-lg border border-neutral-200 bg-bg-default p-5 transition-colors hover:border-neutral-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-600">
                  <Building2Icon className="size-5" />
                </div>
                <div className="flex flex-none gap-2">
                  <span className="rounded-md bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {department.staffCount} staff
                  </span>
                  <span className="rounded-md bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {department.teacherCount} teachers
                  </span>
                  <span className="rounded-md bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {department.subjectCount} subjects
                  </span>
                </div>
              </div>
              <h3 className="mt-3 font-medium text-neutral-900">{department.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{department.description}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-100 pt-4">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={department.headTeacher?.fullName ?? ""} size="sm" />
                  <div className="min-w-0">
                    <p className="text-xs text-neutral-400">Department head</p>
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {department.headTeacher?.fullName ?? "Not assigned"}
                    </p>
                  </div>
                </div>
                {canUpdate && (
                  <Button
                    variant="secondary"
                    text="Set Head"
                    className="w-auto"
                    onClick={() => void openHeadDialog(department)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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

      {canUpdate && (
        <Dialog
          open={headTarget !== null}
          onClose={() => setHeadTarget(null)}
          title="Set Department Head"
          description="Assign a teacher from this department as its head."
        >
          {headTarget && (
            <SetDepartmentHeadForm
              department={{
                id: headTarget.id,
                name: headTarget.name,
                headTeacherId: headTarget.headTeacher?.id ?? null,
              }}
              teachers={headOptions}
              onUpdate={handleUpdateHead}
              onClose={() => setHeadTarget(null)}
            />
          )}
        </Dialog>
      )}
    </div>
  );
}
