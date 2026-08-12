"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { AddSubjectForm, type AddSubjectValues } from "./AddSubjectForm";
import { academicApi } from "../api/academicApi";
import {
  BookOpenIcon,
  FileTextIcon,
  GraduationCapIcon,
  MailIcon,
  PlusIcon,
} from "@/shared/components/ui/icons";

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  teacher: string;
  classes: string;
  credit: number;
  status: "Active" | "Invited";
}

const DEPARTMENT_FILTERS = [
  { value: "Science & Math", label: "Science & Math" },
  { value: "Languages", label: "Languages" },
  { value: "Humanities", label: "Humanities" },
  { value: "Commerce", label: "Commerce" },
];

const COLUMNS: Column<Subject>[] = [
  {
    key: "name",
    header: "Subject",
    sortValue: (subject) => subject.name,
    render: (subject) => (
      <div className="flex items-center gap-3">
        <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
          <BookOpenIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{subject.name}</p>
          <p className="text-xs text-neutral-400">{subject.code}</p>
        </div>
      </div>
    ),
  },
  {
    key: "department",
    header: "Department",
    sortValue: (subject) => subject.department,
    render: (subject) => <span className="text-neutral-600">{subject.department || "—"}</span>,
  },
  {
    key: "teacher",
    header: "Teacher",
    sortValue: (subject) => subject.teacher,
    render: (subject) => <span className="text-neutral-600">{subject.teacher || "Unassigned"}</span>,
  },
  {
    key: "classes",
    header: "Classes",
    sortValue: (subject) => subject.classes,
    render: (subject) => <span className="text-neutral-500">{subject.classes}</span>,
  },
  {
    key: "credit",
    header: "Credit",
    sortValue: (subject) => subject.credit,
    align: "right",
    render: (subject) => <span className="font-medium text-neutral-700">{subject.credit}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (subject) => subject.status,
    render: (subject) => <StatusBadge status={subject.status} />,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: () => (
      <RowActions
        actions={[
          { label: "View syllabus", icon: <FileTextIcon className="size-3.5" /> },
          { label: "Assign teacher", icon: <GraduationCapIcon className="size-3.5" /> },
          { label: "Send email", icon: <MailIcon className="size-3.5" /> },
        ]}
      />
    ),
  },
];

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const records = await academicApi.listSubjects();
      setSubjects(
        records.map((r) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          department: r.department,
          teacher: "",
          classes: "",
          credit: 0,
          status: r.type === "ELECTIVE" ? "Invited" : "Active",
        })),
      );
    } catch {
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: AddSubjectValues): Promise<boolean> => {
    try {
      const record = await academicApi.createSubject({
        name: values.name,
        code: values.code?.trim() || undefined,
        type: values.type,
        department: values.department?.trim() || undefined,
      });
      setSubjects((current) => [
        {
          id: record.id,
          name: record.name,
          code: record.code,
          department: record.department,
          teacher: "",
          classes: "",
          credit: 0,
          status: "Active",
        },
        ...current,
      ]);
      setDialogOpen(false);
      toast.success("Subject added successfully.");
      return true;
    } catch {
      return false;
    }
  };

  const table = useTable<Subject>({
    data: subjects,
    pageSize: 8,
    getSearchText: (subject) =>
      `${subject.name} ${subject.code} ${subject.department} ${subject.teacher}`,
    filterMatch: (subject, value) => subject.department === value,
    sortValue: (subject, key) => String(subject[key as keyof Subject] ?? ""),
    defaultSortKey: "name",
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Subjects"
        description="Subjects offered and their assigned faculty"
        actions={
          <Button
            text="New Subject"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by department"
          options={DEPARTMENT_FILTERS}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search subjects…" />
      </div>

      <DataTable
        columns={COLUMNS}
        data={table.pageRows}
        keyExtractor={(subject) => subject.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No subjects found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="subjects"
          />
        }
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Subject"
        description="Create a new subject."
      >
        <AddSubjectForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
