"use client";

import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useTable } from "@/shared/hooks/useTable";
import { BookOpenIcon, Building2Icon, PlusIcon, UsersIcon } from "@/shared/components/ui/icons";

export interface Department {
  id: string;
  name: string;
  head: string;
  staffCount: number;
  subjectCount: number;
  description: string;
}

const DEPARTMENTS: Department[] = [
  {
    id: "d-01",
    name: "Science & Math",
    head: "Sunita K.C.",
    staffCount: 18,
    subjectCount: 6,
    description: "Mathematics, Physics, Chemistry and Biology across Grades 6 – 11.",
  },
  {
    id: "d-02",
    name: "Languages",
    head: "Gita Adhikari",
    staffCount: 14,
    subjectCount: 4,
    description: "Nepali, English and Sanskrit literature and grammar.",
  },
  {
    id: "d-03",
    name: "Humanities",
    head: "Prakash Khadka",
    staffCount: 11,
    subjectCount: 5,
    description: "Social Studies, History, Geography and Civics.",
  },
  {
    id: "d-04",
    name: "Commerce",
    head: "Kabita Shrestha",
    staffCount: 8,
    subjectCount: 4,
    description: "Accountancy, Economics and Business Studies.",
  },
  {
    id: "d-05",
    name: "Sports",
    head: "Bikash Tamang",
    staffCount: 6,
    subjectCount: 3,
    description: "Physical education and inter-house sports programmes.",
  },
];

export function DepartmentsPage() {
  const table = useTable<Department>({
    data: DEPARTMENTS,
    pageSize: 6,
    getSearchText: (department) =>
      `${department.name} ${department.head} ${department.description}`,
    sortValue: (department, key) => String(department[key as keyof Department] ?? ""),
    defaultSortKey: "name",
  });

  const totalStaff = DEPARTMENTS.reduce((sum, department) => sum + department.staffCount, 0);
  const totalSubjects = DEPARTMENTS.reduce((sum, department) => sum + department.subjectCount, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Departments"
        description="Academic departments and their faculty leads"
        actions={
          <Button text="New Department" icon={<PlusIcon className="size-4" />} className="w-auto" />
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Departments"
          value={String(DEPARTMENTS.length)}
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
    </div>
  );
}
