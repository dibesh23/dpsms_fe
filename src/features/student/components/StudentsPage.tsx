"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { RowActions } from "@/shared/components/ui/row-actions";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { formatDate } from "@/shared/lib/format";
import { AddStudentForm, type AddStudentValues } from "./AddStudentForm";
import { MailIcon, PlusIcon, UserPlusIcon, FileTextIcon } from "@/shared/components/ui/icons";

export interface Student {
  id: string;
  name: string;
  email: string;
  grade: string;
  status: "Active" | "Inactive" | "On Leave";
  enrolledAt: string;
}

const STUDENTS: Student[] = [
  {
    id: "s-01",
    name: "Aarav Sharma",
    email: "aarav.sharma@pathshala.edu.np",
    grade: "Grade 7 A",
    status: "Active",
    enrolledAt: "2024-04-12",
  },
  {
    id: "s-02",
    name: "Sita Rai",
    email: "sita.rai@pathshala.edu.np",
    grade: "Grade 6 A",
    status: "Active",
    enrolledAt: "2024-04-15",
  },
  {
    id: "s-03",
    name: "Bibek Gurung",
    email: "bibek.gurung@pathshala.edu.np",
    grade: "Grade 8 B",
    status: "On Leave",
    enrolledAt: "2024-05-02",
  },
  {
    id: "s-04",
    name: "Anisha Shrestha",
    email: "anisha.shrestha@pathshala.edu.np",
    grade: "Grade 9 A",
    status: "Active",
    enrolledAt: "2024-05-20",
  },
  {
    id: "s-05",
    name: "Rohan Karki",
    email: "rohan.karki@pathshala.edu.np",
    grade: "Grade 10 A",
    status: "Active",
    enrolledAt: "2024-06-01",
  },
  {
    id: "s-06",
    name: "Prativa Maharjan",
    email: "prativa.maharjan@pathshala.edu.np",
    grade: "Grade 6 B",
    status: "Active",
    enrolledAt: "2024-06-18",
  },
  {
    id: "s-07",
    name: "Sagar Thapa",
    email: "sagar.thapa@pathshala.edu.np",
    grade: "Grade 7 B",
    status: "Inactive",
    enrolledAt: "2024-07-03",
  },
  {
    id: "s-08",
    name: "Nisha Tamang",
    email: "nisha.tamang@pathshala.edu.np",
    grade: "Grade 8 A",
    status: "Active",
    enrolledAt: "2024-07-21",
  },
  {
    id: "s-09",
    name: "Dipesh Adhikari",
    email: "dipesh.adhikari@pathshala.edu.np",
    grade: "Grade 8 A",
    status: "Active",
    enrolledAt: "2025-04-08",
  },
  {
    id: "s-10",
    name: "Kritika Basnet",
    email: "kritika.basnet@pathshala.edu.np",
    grade: "Grade 9 A",
    status: "On Leave",
    enrolledAt: "2025-04-25",
  },
  {
    id: "s-11",
    name: "Sujan Shrestha",
    email: "sujan.shrestha@pathshala.edu.np",
    grade: "Grade 10 B",
    status: "Active",
    enrolledAt: "2025-05-14",
  },
  {
    id: "s-12",
    name: "Aashish Pandey",
    email: "aashish.pandey@pathshala.edu.np",
    grade: "Grade 6 A",
    status: "Active",
    enrolledAt: "2025-06-09",
  },
];

const STATUS_FILTERS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "On Leave", label: "On Leave" },
];

const COLUMNS: Column<Student>[] = [
  {
    key: "name",
    header: "Student",
    sortValue: (student) => student.name,
    render: (student) => (
      <div className="flex items-center gap-3">
        <Avatar name={student.name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{student.name}</p>
          <p className="text-xs text-neutral-400">Adm. {student.id.replace("s-", "DP")}</p>
        </div>
      </div>
    ),
  },
  {
    key: "email",
    header: "Email",
    sortValue: (student) => student.email,
    render: (student) => <span className="text-neutral-500">{student.email}</span>,
  },
  {
    key: "grade",
    header: "Grade",
    sortValue: (student) => student.grade,
    render: (student) => <span className="font-medium text-neutral-700">{student.grade}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortValue: (student) => student.status,
    render: (student) => <StatusBadge status={student.status} />,
  },
  {
    key: "enrolledAt",
    header: "Enrollment Date",
    sortValue: (student) => student.enrolledAt,
    render: (student) => <span className="text-neutral-500">{formatDate(student.enrolledAt)}</span>,
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (student) => (
      <RowActions
        actions={[
          { label: "View profile", href: "/students", icon: <UserPlusIcon className="size-3.5" /> },
          { label: "Edit details", icon: <FileTextIcon className="size-3.5" /> },
          { label: "Send email", icon: <MailIcon className="size-3.5" /> },
          { label: "Remove", danger: true, icon: <FileTextIcon className="size-3.5" /> },
        ]}
      />
    ),
  },
];

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(STUDENTS);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = (values: AddStudentValues) => {
    const record: Student = {
      id: `s-${String(students.length + 1).padStart(2, "0")}`,
      name: values.fullName,
      email: values.email,
      grade: values.grade,
      status: values.status,
      enrolledAt: values.enrolledAt,
    };
    setStudents((current) => [record, ...current]);
    setDialogOpen(false);
  };

  const table = useTable<Student>({
    data: students,
    pageSize: 8,
    getSearchText: (student) => `${student.name} ${student.email} ${student.grade}`,
    filterMatch: (student, value) => student.status === value,
    sortValue: (student, key) => String(student[key as keyof Student] ?? ""),
    defaultSortKey: "name",
  });

  const filters = useMemo(
    () =>
      STATUS_FILTERS.map((option) => ({
        ...option,
        label: `${option.label} (${students.filter((s) => s.status === option.value).length})`,
      })),
    [students],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        description={`${students.length} records · Admissions for the 2082/83 academic year`}
        actions={
          <Button
            text="Add Student"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterDropdown
          label="Filter by status"
          options={filters}
          value={table.filter}
          onChange={table.setFilter}
        />
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search students…" />
      </div>

      <DataTable
        columns={COLUMNS}
        data={table.pageRows}
        keyExtractor={(student) => student.id}
        sortKey={table.sortKey}
        sortDir={table.sortDir}
        onSort={table.handleSort}
        empty={{
          title: "No students found",
          description: "Try adjusting your search or filters.",
        }}
        footer={
          <Pagination
            page={table.page}
            pageSize={table.pageSize}
            total={table.total}
            onPageChange={table.setPage}
            label="students"
          />
        }
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Student"
        description="Enrol a new student for the 2082/83 academic year."
      >
        <AddStudentForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
