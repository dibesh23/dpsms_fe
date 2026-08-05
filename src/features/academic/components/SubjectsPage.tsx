"use client";

import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { RowActions } from "@/shared/components/ui/row-actions";
import { useTable } from "@/shared/hooks/useTable";
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

const SUBJECTS: Subject[] = [
  {
    id: "su-01",
    name: "Mathematics",
    code: "MATH-101",
    department: "Science & Math",
    teacher: "Ram Prasad Dahal",
    classes: "6 – 11",
    credit: 4,
    status: "Active",
  },
  {
    id: "su-02",
    name: "Physics",
    code: "PHY-201",
    department: "Science & Math",
    teacher: "Sunita K.C.",
    classes: "9 – 11",
    credit: 4,
    status: "Active",
  },
  {
    id: "su-03",
    name: "Chemistry",
    code: "CHE-202",
    department: "Science & Math",
    teacher: "Renu Poudel",
    classes: "9 – 11",
    credit: 3,
    status: "Active",
  },
  {
    id: "su-04",
    name: "English",
    code: "ENG-210",
    department: "Languages",
    teacher: "Manoj Bhattarai",
    classes: "6 – 11",
    credit: 4,
    status: "Active",
  },
  {
    id: "su-05",
    name: "Nepali",
    code: "NEP-211",
    department: "Languages",
    teacher: "Gita Adhikari",
    classes: "6 – 11",
    credit: 3,
    status: "Active",
  },
  {
    id: "su-06",
    name: "Social Studies",
    code: "SOC-220",
    department: "Humanities",
    teacher: "Prakash Khadka",
    classes: "6 – 10",
    credit: 3,
    status: "Active",
  },
  {
    id: "su-07",
    name: "Accountancy",
    code: "ACC-310",
    department: "Commerce",
    teacher: "Kabita Shrestha",
    classes: "11",
    credit: 4,
    status: "Invited",
  },
  {
    id: "su-08",
    name: "Computer Science",
    code: "CSC-240",
    department: "Science & Math",
    teacher: "Renu Poudel",
    classes: "9 – 11",
    credit: 2,
    status: "Active",
  },
];

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
    render: (subject) => <span className="text-neutral-600">{subject.department}</span>,
  },
  {
    key: "teacher",
    header: "Teacher",
    sortValue: (subject) => subject.teacher,
    render: (subject) => <span className="text-neutral-600">{subject.teacher}</span>,
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
  const table = useTable<Subject>({
    data: SUBJECTS,
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
          <Button text="New Subject" icon={<PlusIcon className="size-4" />} className="w-auto" />
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
    </div>
  );
}
