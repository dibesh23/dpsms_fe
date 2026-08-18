"use client";

import { useState, useEffect, useCallback } from "react";
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
import { academicApi } from "../api/academicApi";
import { BookOpenIcon, Building2Icon, PlusIcon, UsersIcon } from "@/shared/components/ui/icons";

export interface Department {
  id: string;
  name: string;
  head: string;
  staffCount: number;
  subjectCount: number;
  description: string;
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.ACADEMIC_DEPARTMENT_CREATE);

  const load = useCallback(async () => {
    try {
      const records = await academicApi.listDepartments();
      setDepartments(
        records.map((r) => ({
          id: r.id,
          name: r.name,
          head: r.head,
          staffCount: r.staffCount,
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

  const handleAdd = async (values: AddDepartmentValues): Promise<boolean> => {
    try {
      const record = await academicApi.createDepartment({
        name: values.name,
        headName: values.headName?.trim() || undefined,
        description: values.description?.trim() || undefined,
      });
      setDepartments((current) => [
        {
          id: record.id,
          name: record.name,
          head: record.head,
          staffCount: 0,
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

  const table = useTable<Department>({
    data: departments,
    pageSize: 6,
    getSearchText: (department) =>
      `${department.name} ${department.head} ${department.description}`,
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
                    {department.subjectCount} subjects
                  </span>
                </div>
              </div>
              <h3 className="mt-3 font-medium text-neutral-900">{department.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{department.description}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4">
                <Avatar name={department.head} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400">Department head</p>
                  <p className="truncate text-sm font-medium text-neutral-800">{department.head}</p>
                </div>
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
    </div>
  );
}
