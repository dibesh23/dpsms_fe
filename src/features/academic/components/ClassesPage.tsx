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
import { cn } from "@/shared/lib/cn";
import { AddClassForm, type AddClassValues } from "./AddClassForm";
import { academicApi } from "../api/academicApi";
import {
  LayoutGridIcon,
  MapPinIcon,
  PlusIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

export interface SchoolClass {
  id: string;
  name: string;
  sections: string[];
  students: number;
  teacher: string;
  room: string;
  attendance: number;
}

export function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const records = await academicApi.listClasses();
      setClasses(
        records.map((r) => ({
          id: r.id,
          name: r.name,
          sections: r.sections,
          students: r.students,
          teacher: "",
          room: "",
          attendance: 0,
        })),
      );
    } catch {
      setClasses([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (values: AddClassValues): Promise<boolean> => {
    try {
      const sections = values.sections
        ? values.sections.split(",").map((s) => s.trim()).filter(Boolean)
        : ["A"];
      const record = await academicApi.createClass({ name: values.name, sections });
      setClasses((current) => [
        {
          id: record.id,
          name: record.name,
          sections: record.sections,
          students: 0,
          teacher: "",
          room: "",
          attendance: 0,
        },
        ...current,
      ]);
      setDialogOpen(false);
      return true;
    } catch {
      return false;
    }
  };

  const table = useTable<SchoolClass>({
    data: classes,
    pageSize: 6,
    getSearchText: (schoolClass) =>
      `${schoolClass.name} ${schoolClass.sections.join(" ")} ${schoolClass.teacher} ${schoolClass.room}`,
    sortValue: (schoolClass, key) => String(schoolClass[key as keyof SchoolClass] ?? ""),
    defaultSortKey: "name",
  });

  const totalSections = classes.reduce((sum, schoolClass) => sum + schoolClass.sections.length, 0);
  const totalStudents = classes.reduce((sum, schoolClass) => sum + schoolClass.students, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Classes"
        description="Grades and sections for the active academic year"
        actions={
          <Button
            text="New Class"
            icon={<PlusIcon className="size-4" />}
            className="w-auto"
            onClick={() => setDialogOpen(true)}
          />
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Classes"
          value={String(classes.length)}
          delta="Across all grades"
          deltaDirection="neutral"
          icon={<LayoutGridIcon className="size-4" />}
        />
        <StatsCard
          label="Sections"
          value={String(totalSections)}
          delta="2 per grade on average"
          deltaDirection="neutral"
          icon={<UserPlusIcon className="size-4" />}
        />
        <StatsCard
          label="Enrolled Students"
          value={String(totalStudents)}
          delta="Across all classes"
          deltaDirection="neutral"
          icon={<UsersIcon className="size-4" />}
        />
      </section>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">{table.total} class records</p>
        <SearchBar value={table.query} onChange={table.setQuery} placeholder="Search classes…" />
      </div>

      {table.rows.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="No classes found" description="Try adjusting your search." />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {table.rows.map((schoolClass) => (
            <div
              key={schoolClass.id}
              className="flex flex-col rounded-lg border border-neutral-200 bg-bg-default p-5 transition-colors hover:border-neutral-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">{schoolClass.name}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {schoolClass.sections.map((section) => (
                      <span
                        key={section}
                        className="rounded-md border border-neutral-200 bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600"
                      >
                        Section {section}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    schoolClass.attendance >= 95
                      ? "text-emerald-600"
                      : schoolClass.attendance >= 90
                        ? "text-amber-600"
                        : "text-red-600",
                  )}
                >
                  {schoolClass.attendance}%
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-neutral-400">Students</p>
                  <p className="mt-0.5 font-medium text-neutral-800">{schoolClass.students}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Attendance today</p>
                  <p className="mt-0.5 font-medium text-neutral-800">{schoolClass.attendance}%</p>
                </div>
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    schoolClass.attendance >= 95
                      ? "bg-emerald-500"
                      : schoolClass.attendance >= 90
                        ? "bg-amber-500"
                        : "bg-red-500",
                  )}
                  style={{ width: `${schoolClass.attendance}%` }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar name={schoolClass.teacher} size="sm" />
                  <span className="truncate text-neutral-600">{schoolClass.teacher}</span>
                </div>
                <span className="flex flex-none items-center gap-1 text-xs text-neutral-400">
                  <MapPinIcon className="size-3.5" />
                  {schoolClass.room}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Class"
        description="Create a class with one or more sections."
      >
        <AddClassForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
      </Dialog>
    </div>
  );
}
