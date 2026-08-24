"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { RowActions } from "@/shared/components/ui/row-actions";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { AddClassForm, type AddClassValues } from "./AddClassForm";
import { EditClassForm, type EditClassValues } from "./EditClassForm";
import { academicApi, type ClassRecord as ClassRecordDto } from "../api/academicApi";
import {
  ArrowUpRightIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
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

export function ClassesPage() {
  const [classes, setClasses] = useState<ClassRecordDto[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ClassRecordDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassRecordDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const toast = useToast();
  const { can } = useAuth();
  const canCreate = can(PERMISSIONS.ACADEMIC_CLASS_CREATE);
  const canUpdate = can(PERMISSIONS.ACADEMIC_CLASS_UPDATE);
  const canDelete = can(PERMISSIONS.ACADEMIC_CLASS_DELETE);

  const load = useCallback(async () => {
    try {
      setClasses(await academicApi.listClasses());
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
        ? values.sections
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["A"];
      await academicApi.createClass({ name: values.name, sections });
      await load();
      setDialogOpen(false);
      toast.success("Class added successfully.");
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not add the class. Try again."));
      return false;
    }
  };

  const handleRename = async (values: { name: string }): Promise<string | null> => {
    if (!renameTarget) return "Class is not loaded yet.";
    try {
      const record = await academicApi.updateClass(renameTarget.id, values);
      setClasses((current) => current.map((c) => (c.id === record.id ? record : c)));
      setRenameTarget(null);
      toast.success("Class renamed successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not rename the class. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await academicApi.deleteClass(deleteTarget.id);
      setClasses((current) => current.filter((c) => c.id !== deleteTarget.id));
      toast.success(`Class "${deleteTarget.name}" removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the class. Try again."));
    } finally {
      setDeleteBusy(false);
    }
  };

  const table = useTable<ClassRecordDto>({
    data: classes,
    pageSize: 6,
    getSearchText: (schoolClass) =>
      `${schoolClass.name} ${schoolClass.sections.join(" ")} ${schoolClass.academicYearLabel}`,
    sortValue: (schoolClass, key) => String(schoolClass[key as keyof ClassRecordDto] ?? ""),
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
          canCreate ? (
            <Button
              text="New Class"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setDialogOpen(true)}
            />
          ) : undefined
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Total Classes"
          value={String(classes.length)}
          delta="In the active year"
          deltaDirection="neutral"
          icon={<LayoutGridIcon className="size-4" />}
        />
        <StatsCard
          label="Sections"
          value={String(totalSections)}
          delta="Across all classes"
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
              <div className="flex items-start justify-between gap-2">
                <Link href={`/classes/${schoolClass.id}`} className="group min-w-0 flex-1">
                  <p className="truncate font-medium text-neutral-900 group-hover:underline">
                    {schoolClass.name}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-400">
                    {schoolClass.academicYearLabel || "—"}
                  </p>
                </Link>
                <RowActions
                  actions={[
                    {
                      label: "View details",
                      icon: <ArrowUpRightIcon className="size-3.5" />,
                      href: `/classes/${schoolClass.id}`,
                    },
                    ...(canUpdate
                      ? [
                          {
                            label: "Rename",
                            icon: <PencilIcon className="size-3.5" />,
                            onClick: () => setRenameTarget(schoolClass),
                          },
                        ]
                      : []),
                    ...(canDelete
                      ? [
                          {
                            label: "Remove",
                            icon: <TrashIcon className="size-3.5" />,
                            danger: true,
                            onClick: () => setDeleteTarget(schoolClass),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              <Link href={`/classes/${schoolClass.id}`} className="mt-1.5 flex flex-wrap gap-1.5">
                {schoolClass.sections.map((section) => (
                  <span
                    key={section}
                    className="rounded-md border border-neutral-200 bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300"
                  >
                    Section {section}
                  </span>
                ))}
              </Link>

              <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4 text-sm">
                <div>
                  <p className="text-xs text-neutral-400">Students</p>
                  <p className="mt-0.5 font-medium text-neutral-800">{schoolClass.students}</p>
                </div>
                <Link
                  href={`/classes/${schoolClass.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
                >
                  Manage class
                  <ArrowUpRightIcon className="size-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {canCreate && (
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Add Class"
          description="Create a class with one or more sections."
        >
          <AddClassForm onAdd={handleAdd} onClose={() => setDialogOpen(false)} />
        </Dialog>
      )}

      {canUpdate && (
        <Dialog
          open={renameTarget !== null}
          onClose={() => setRenameTarget(null)}
          title="Rename Class"
          description="Changing the name applies to the whole academic year."
        >
          {renameTarget && (
            <EditClassForm
              currentName={renameTarget.name}
              onUpdate={handleRename}
              onClose={() => setRenameTarget(null)}
            />
          )}
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          title="Remove Class"
          description={
            deleteTarget
              ? `This will remove "${deleteTarget.name}" and its sections. This action cannot be undone.`
              : ""
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              The backend rejects removal when students are still enrolled or dependent records
              exist.
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
                text={deleteBusy ? "Removing…" : "Remove Class"}
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
