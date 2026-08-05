"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { AddTeacherForm, type AddTeacherValues } from "./AddTeacherForm";
import {
  GraduationCapIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";
import { cn } from "@/shared/lib/cn";

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  department: string;
  email: string;
  phone: string;
  classesPerWeek: number;
  status: "Active" | "On Leave" | "Invited";
}

const TEACHERS: Teacher[] = [
  {
    id: "t-01",
    name: "Ram Prasad Dahal",
    subject: "Mathematics",
    department: "Science & Math",
    email: "ram.dahal@pathshala.edu.np",
    phone: "9841-220011",
    classesPerWeek: 24,
    status: "Active",
  },
  {
    id: "t-02",
    name: "Sunita K.C.",
    subject: "Science",
    department: "Science & Math",
    email: "sunita.kc@pathshala.edu.np",
    phone: "9851-102938",
    classesPerWeek: 22,
    status: "Active",
  },
  {
    id: "t-03",
    name: "Manoj Bhattarai",
    subject: "English",
    department: "Languages",
    email: "manoj.bhattarai@pathshala.edu.np",
    phone: "9803-456712",
    classesPerWeek: 20,
    status: "On Leave",
  },
  {
    id: "t-04",
    name: "Gita Adhikari",
    subject: "Nepali",
    department: "Languages",
    email: "gita.adhikari@pathshala.edu.np",
    phone: "9812-334455",
    classesPerWeek: 26,
    status: "Active",
  },
  {
    id: "t-05",
    name: "Prakash Khadka",
    subject: "Social Studies",
    department: "Humanities",
    email: "prakash.khadka@pathshala.edu.np",
    phone: "9860-778899",
    classesPerWeek: 18,
    status: "Active",
  },
  {
    id: "t-06",
    name: "Renu Poudel",
    subject: "Computer Science",
    department: "Science & Math",
    email: "renu.poudel@pathshala.edu.np",
    phone: "9843-221100",
    classesPerWeek: 16,
    status: "Active",
  },
  {
    id: "t-07",
    name: "Bikash Tamang",
    subject: "Physical Education",
    department: "Sports",
    email: "bikash.tamang@pathshala.edu.np",
    phone: "9851-667788",
    classesPerWeek: 28,
    status: "Invited",
  },
  {
    id: "t-08",
    name: "Kabita Shrestha",
    subject: "Accountancy",
    department: "Commerce",
    email: "kabita.shrestha@pathshala.edu.np",
    phone: "9814-998877",
    classesPerWeek: 19,
    status: "Active",
  },
];

const DEPARTMENT_FILTERS = [
  { value: "Science & Math", label: "Science & Math" },
  { value: "Languages", label: "Languages" },
  { value: "Humanities", label: "Humanities" },
  { value: "Commerce", label: "Commerce" },
  { value: "Sports", label: "Sports" },
];

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>(TEACHERS);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = (values: AddTeacherValues) => {
    const record: Teacher = {
      id: `t-${String(teachers.length + 1).padStart(2, "0")}`,
      name: values.fullName,
      subject: values.subject,
      department: values.department,
      email: values.email,
      phone: values.phone,
      classesPerWeek: Number(values.classesPerWeek) || 0,
      status: values.status,
    };
    setTeachers((current) => [record, ...current]);
    setDialogOpen(false);
  };

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
  const weeklyLoad = useMemo(
    () =>
      Math.round(
        teachers.reduce((sum, teacher) => sum + teacher.classesPerWeek, 0) / teachers.length,
      ),
    [teachers],
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers"
        description="Faculty accounts, subjects and weekly assignments"
        actions={
          <Button
            text="Invite Teacher"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Teachers"
          value={String(teachers.length)}
          delta="3 new this term"
          icon={<GraduationCapIcon className="size-4" />}
        />
        <StatsCard
          label="Departments"
          value={String(departments)}
          delta="Fully staffed"
          deltaDirection="neutral"
          icon={<UsersIcon className="size-4" />}
        />
        <StatsCard
          label="Avg. Weekly Load"
          value={`${weeklyLoad} classes`}
          delta="16 – 28 per teacher"
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
                <div className="flex items-center gap-3">
                  <Avatar name={teacher.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900">{teacher.name}</p>
                    <p className="text-xs text-neutral-500">{teacher.subject}</p>
                  </div>
                </div>
                <StatusBadge status={teacher.status} />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="flex items-center gap-2 text-neutral-500">
                  <span className="w-4 flex-none text-neutral-400">
                    <GraduationCapIcon className="size-4" />
                  </span>
                  {teacher.department}
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
                  {teacher.phone}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-xs text-neutral-400">
                  {teacher.classesPerWeek} classes / week
                </span>
                <span className={cn("h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100")}>
                  <span
                    className="block h-full rounded-full bg-neutral-900"
                    style={{
                      width: `${Math.min(100, (teacher.classesPerWeek / 30) * 100)}%`,
                    }}
                  />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Invite Teacher"
        description="Create a faculty account for the 2082/83 academic year."
      >
        <AddTeacherForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
