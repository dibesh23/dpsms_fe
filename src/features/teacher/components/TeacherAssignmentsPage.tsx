"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { FilterDropdown } from "@/shared/components/ui/filter-dropdown";
import { DataTable, type Column } from "@/shared/components/ui/data-table";
import { Pagination } from "@/shared/components/ui/pagination";
import { RowActions } from "@/shared/components/ui/row-actions";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { Dialog } from "@/shared/components/ui/dialog";
import { useTable } from "@/shared/hooks/useTable";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { teacherApi } from "../api/teacherApi";
import {
  teacherAssignmentApi,
  type ClassAssignmentRecord,
  type SubjectAssignmentRecord,
} from "../api/teacherAssignmentApi";
import { academicApi } from "@/features/academic/api/academicApi";
import { AssignTeacherForm, type AssignTeacherValues } from "./AssignTeacherForm";
import { SetClassTeacherForm, type SetClassTeacherValues } from "./SetClassTeacherForm";
import {
  BanIcon,
  BookOpenIcon,
  GraduationCapIcon,
  LayoutGridIcon,
  PlusIcon,
  UserPlusIcon,
} from "@/shared/components/ui/icons";

interface AssignmentView {
  key: string;
  id: string;
  teacherId: string;
  teacherName: string;
  type: "class" | "subject";
  subjectName?: string;
  subjectCode?: string | null;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  academicYearId?: string;
  academicYearLabel?: string;
}

interface SectionRow {
  id: string;
  classId: string;
  className: string;
  name: string;
  capacity: number | null;
  classTeacherId: string | null;
  classTeacherName: string;
}

interface TeacherGroupRow {
  teacherId: string;
  teacherName: string;
  classAssignments: AssignmentView[];
  subjectAssignments: AssignmentView[];
  academicYears: string[];
}

interface ConfirmTarget {
  kind: "subject" | "class";
  teacherId: string;
  assignmentId: string;
  title: string;
  message: string;
}

const sortValueOf = <T extends object>(row: T, key: string): string | number => {
  const value = row[key as keyof T];
  return typeof value === "number" ? value : String(value ?? "");
};

export function TeacherAssignmentsPage() {
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<
    Array<{ id: string; name: string; code: string | null }>
  >([]);
  const [sessions, setSessions] = useState<Array<{ id: string; label: string; isActive: boolean }>>(
    [],
  );
  const [assignments, setAssignments] = useState<AssignmentView[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);

  const [assignOpen, setAssignOpen] = useState(false);
  const [classTeacherTarget, setClassTeacherTarget] = useState<SectionRow | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [removing, setRemoving] = useState(false);

  const toast = useToast();
  const { can } = useAuth();
  const canManage = can(PERMISSIONS.TEACHER_ASSIGNMENT_MANAGE);
  const canEditClassTeacher = can(PERMISSIONS.ACADEMIC_SECTION_UPDATE);

  const load = useCallback(async () => {
    try {
      const [teacherRecords, classRecords, subjectRecords, sessionRecords] = await Promise.all([
        teacherApi.list(),
        academicApi.listClasses(),
        academicApi.listSubjects(),
        academicApi.listSessions(),
      ]);

      const teacherOptions = teacherRecords.map((t) => ({ id: t.id, name: t.name }));
      const classOptions = classRecords.map((c) => ({ id: c.id, name: c.name }));
      setTeachers(teacherOptions);
      setClasses(classOptions);
      setSubjects(subjectRecords.map((s) => ({ id: s.id, name: s.name, code: s.code || null })));
      setSessions(sessionRecords.map((s) => ({ id: s.id, label: s.label, isActive: s.isActive })));

      const [subjectLists, classLists] = await Promise.all([
        Promise.all(
          teacherRecords.map((t) =>
            teacherAssignmentApi
              .listSubjectAssignments(t.id)
              .catch(() => [] as SubjectAssignmentRecord[]),
          ),
        ),
        Promise.all(
          teacherRecords.map((t) =>
            teacherAssignmentApi
              .listClassAssignments(t.id)
              .catch(() => [] as ClassAssignmentRecord[]),
          ),
        ),
      ]);

      const merged: AssignmentView[] = [];

      subjectLists.forEach((records, index) => {
        records.forEach((record) => {
          merged.push({
            key: `subject:${teacherRecords[index].id}:${record.id}`,
            id: record.id,
            teacherId: teacherRecords[index].id,
            teacherName: teacherRecords[index].name,
            type: "subject",
            subjectName: record.subjectName,
            subjectCode: record.subjectCode,
            classId: "",
            className: "",
            sectionId: "",
            sectionName: "",
            academicYearId: record.academicYearId,
            academicYearLabel: record.academicYearLabel,
          });
        });
      });

      classLists.forEach((records, index) => {
        records.forEach((record) => {
          merged.push({
            key: `class:${teacherRecords[index].id}:${record.id}`,
            id: record.id,
            teacherId: teacherRecords[index].id,
            teacherName: teacherRecords[index].name,
            type: "class",
            classId: record.classId,
            className: record.className,
            sectionId: record.sectionId,
            sectionName: record.sectionName,
            academicYearId: record.academicYearId,
            academicYearLabel: record.academicYearLabel,
          });
        });
      });

      setAssignments(merged);

      const sectionLists = await Promise.all(
        classRecords.map((c) => academicApi.listSections(c.id).catch(() => [])),
      );

      setSections(
        sectionLists.flatMap((records, index) =>
          records.map((record) => ({
            id: record.id,
            classId: record.classId,
            className: record.className,
            name: record.name,
            capacity: record.capacity,
            classTeacherId: record.classTeacherId,
            classTeacherName:
              teacherOptions.find((t) => t.id === record.classTeacherId)?.name ?? "",
          })),
        ),
      );
    } catch {
      setTeachers([]);
      setClasses([]);
      setSubjects([]);
      setSessions([]);
      setAssignments([]);
      setSections([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAssign = async (values: AssignTeacherValues): Promise<string | null> => {
    const teacher = teachers.find((t) => t.id === values.teacherId);
    const explicitYearId = values.academicYearId || undefined;
    const effectiveYearId = explicitYearId ?? sessions.find((s) => s.isActive)?.id ?? undefined;

    if (values.mode === "subject") {
      const subjectDuplicate = assignments.some(
        (a) =>
          a.type === "subject" &&
          a.teacherId === values.teacherId &&
          a.subjectName === subjects.find((s) => s.id === values.subjectId)?.name &&
          a.academicYearId === effectiveYearId,
      );
      if (subjectDuplicate) {
        return "This teacher is already assigned to this subject for the selected academic year.";
      }
      try {
        const subjectRecord = await teacherAssignmentApi.createSubjectAssignment(values.teacherId, {
          subjectId: values.subjectId,
          academicYearId: explicitYearId,
        });
        const subjectRow: AssignmentView = {
          key: `subject:${values.teacherId}:${subjectRecord.id}`,
          id: subjectRecord.id,
          teacherId: values.teacherId,
          teacherName: teacher?.name ?? "",
          type: "subject",
          subjectName: subjectRecord.subjectName,
          subjectCode: subjectRecord.subjectCode,
          classId: "",
          className: "",
          sectionId: "",
          sectionName: "",
          academicYearId: subjectRecord.academicYearId,
          academicYearLabel: subjectRecord.academicYearLabel,
        };
        setAssignments((current) => [...current, subjectRow]);
        setAssignOpen(false);
        toast.success("Subject assigned to the teacher for the academic year.");
        return null;
      } catch {
        return "Could not assign the subject. Check the details and try again.";
      }
    }

    const existingClass = assignments.find(
      (a) =>
        a.type === "class" &&
        a.teacherId === values.teacherId &&
        a.sectionId === values.sectionId &&
        a.academicYearId === effectiveYearId,
    );
    if (existingClass) {
      return "This teacher is already assigned to this section for the selected academic year.";
    }

    try {
      const classRecord = await teacherAssignmentApi.createClassAssignment(values.teacherId, {
        sectionId: values.sectionId,
        academicYearId: explicitYearId,
      });
      const classRow: AssignmentView = {
        key: `class:${values.teacherId}:${classRecord.id}`,
        id: classRecord.id,
        teacherId: values.teacherId,
        teacherName: teacher?.name ?? "",
        type: "class",
        classId: classRecord.classId,
        className: classRecord.className,
        sectionId: classRecord.sectionId,
        sectionName: classRecord.sectionName,
        academicYearId: classRecord.academicYearId,
        academicYearLabel: classRecord.academicYearLabel,
      };
      setAssignments((current) => [...current, classRow]);
      setAssignOpen(false);
      toast.success("Teacher assigned to the class section for the academic year.");
      return null;
    } catch {
      return "Could not create the class assignment. Check the details and try again.";
    }
  };

  const handleSetClassTeacher = async (values: SetClassTeacherValues): Promise<string | null> => {
    if (!classTeacherTarget) return "No section selected.";
    try {
      const record = await academicApi.updateSection(classTeacherTarget.id, {
        classTeacherId: values.teacherId,
      });
      const teacherName = teachers.find((t) => t.id === record.classTeacherId)?.name ?? "";
      setSections((current) =>
        current.map((s) =>
          s.id === classTeacherTarget.id
            ? { ...s, classTeacherId: record.classTeacherId, classTeacherName: teacherName }
            : s,
        ),
      );
      setClassTeacherTarget(null);
      toast.success("Class teacher updated successfully.");
      return null;
    } catch {
      return "Could not set the class teacher. Try again.";
    }
  };

  const handleConfirmRemove = async () => {
    if (!confirmTarget) return;
    setRemoving(true);
    try {
      if (confirmTarget.kind === "subject") {
        await teacherAssignmentApi.removeSubjectAssignment(
          confirmTarget.teacherId,
          confirmTarget.assignmentId,
        );
        setAssignments((current) =>
          current.filter((a) => a.id !== confirmTarget.assignmentId || a.type !== "subject"),
        );
        toast.success("Subject assignment removed.");
      } else {
        await teacherAssignmentApi.removeClassAssignment(
          confirmTarget.teacherId,
          confirmTarget.assignmentId,
        );
        setAssignments((current) =>
          current.filter((a) => a.id !== confirmTarget.assignmentId || a.type !== "class"),
        );
        toast.success("Class assignment removed.");
      }
      setConfirmTarget(null);
    } catch {
      toast.error("Could not remove the assignment. Try again.");
    } finally {
      setRemoving(false);
    }
  };

  const classFilterOptions = classes.map((c) => ({ value: c.id, label: c.name }));

  const teacherGroups = useMemo<TeacherGroupRow[]>(() => {
    const groupsByTeacher = new Map<string, TeacherGroupRow>();
    for (const assignment of assignments) {
      let group = groupsByTeacher.get(assignment.teacherId);
      if (!group) {
        group = {
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          classAssignments: [],
          subjectAssignments: [],
          academicYears: [],
        };
        groupsByTeacher.set(assignment.teacherId, group);
      }
      if (assignment.type === "class") {
        group.classAssignments.push(assignment);
      } else {
        group.subjectAssignments.push(assignment);
      }
    }
    const groups = Array.from(groupsByTeacher.values());
    groups.forEach((group) => {
      group.classAssignments.sort(
        (a, b) =>
          a.className.localeCompare(b.className) || a.sectionName.localeCompare(b.sectionName),
      );
      group.subjectAssignments.sort((a, b) =>
        (a.subjectName ?? "").localeCompare(b.subjectName ?? ""),
      );
      const years = new Set<string>();
      for (const assignment of [...group.classAssignments, ...group.subjectAssignments]) {
        if (assignment.academicYearLabel) years.add(assignment.academicYearLabel);
      }
      group.academicYears = Array.from(years).sort();
    });
    return groups;
  }, [assignments]);

  const table = useTable<TeacherGroupRow>({
    data: teacherGroups,
    pageSize: 8,
    getSearchText: (row) =>
      `${row.teacherName} ${row.academicYears.join(" ")} ${row.classAssignments
        .map((a) => `${a.className} ${a.sectionName}`)
        .join(" ")} ${row.subjectAssignments
        .map((a) => `${a.subjectName ?? ""} ${a.subjectCode ?? ""}`)
        .join(" ")}`,
    filterMatch: (row, value) => row.classAssignments.some((a) => a.classId === value),
    sortValue: sortValueOf,
    defaultSortKey: "teacherName",
  });

  const sectionTable = useTable<SectionRow>({
    data: sections,
    pageSize: 8,
    getSearchText: (row) => `${row.className} ${row.name} ${row.classTeacherName}`,
    filterMatch: (row, value) => row.classId === value,
    sortValue: sortValueOf,
    defaultSortKey: "className",
  });

  const columns: Column<TeacherGroupRow>[] = [
    {
      key: "teacherName",
      header: "Teacher",
      sortValue: (row) => row.teacherName,
      render: (row) => {
        const totalAssignments = row.classAssignments.length + row.subjectAssignments.length;
        return (
          <div className="flex items-center gap-3">
            <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
              <GraduationCapIcon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-neutral-900">{row.teacherName}</p>
              <p className="text-xs text-neutral-400">{totalAssignments} assignment(s)</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "classes",
      header: "Classes",
      sortValue: (row) => row.classAssignments.map((a) => a.className).join(", "),
      render: (row) =>
        row.classAssignments.length === 0 ? (
          <span className="text-neutral-300">—</span>
        ) : (
          <div className="flex max-w-72 flex-wrap gap-1.5">
            {row.classAssignments.map((assignment) => (
              <span
                key={assignment.id}
                title={row.academicYears.length > 1 ? assignment.academicYearLabel : undefined}
                className="inline-flex items-center rounded-md border border-neutral-200 bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600"
              >
                {assignment.className} · {assignment.sectionName}
                {row.academicYears.length > 1 && (
                  <span className="ml-1 text-neutral-400">({assignment.academicYearLabel})</span>
                )}
              </span>
            ))}
          </div>
        ),
    },
    {
      key: "subjects",
      header: "Subjects",
      sortValue: (row) => row.subjectAssignments.map((a) => a.subjectName).join(", "),
      render: (row) =>
        row.subjectAssignments.length === 0 ? (
          <span className="text-neutral-300">—</span>
        ) : (
          <div className="flex max-w-72 flex-wrap gap-1.5">
            {row.subjectAssignments.map((assignment) => (
              <span
                key={assignment.id}
                title={row.academicYears.length > 1 ? assignment.academicYearLabel : undefined}
                className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"
              >
                {assignment.subjectName}
                {row.academicYears.length > 1 && (
                  <span className="ml-1 text-emerald-500">({assignment.academicYearLabel})</span>
                )}
              </span>
            ))}
          </div>
        ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (row: TeacherGroupRow) => (
              <RowActions
                actions={[
                  ...row.classAssignments.map((assignment) => ({
                    label: `Remove class · ${assignment.className} · ${assignment.sectionName}`,
                    icon: <BanIcon className="size-3.5" />,
                    danger: true,
                    onClick: () =>
                      setConfirmTarget({
                        kind: "class" as const,
                        teacherId: row.teacherId,
                        assignmentId: assignment.id,
                        title: "Remove class assignment",
                        message: `Remove ${row.teacherName}'s class assignment for ${assignment.className} · Section ${assignment.sectionName}?`,
                      }),
                  })),
                  ...row.subjectAssignments.map((assignment) => ({
                    label: `Remove subject · ${assignment.subjectName}`,
                    icon: <BanIcon className="size-3.5" />,
                    danger: true,
                    onClick: () =>
                      setConfirmTarget({
                        kind: "subject" as const,
                        teacherId: row.teacherId,
                        assignmentId: assignment.id,
                        title: "Remove subject assignment",
                        message: `Remove ${row.teacherName}'s assignment for ${assignment.subjectName} in ${assignment.academicYearLabel ?? "the active year"}?`,
                      }),
                  })),
                ]}
              />
            ),
          },
        ]
      : []),
  ];

  const sectionColumns: Column<SectionRow>[] = [
    {
      key: "className",
      header: "Class",
      sortValue: (row) => row.className,
      render: (row) => <span className="font-medium text-neutral-900">{row.className}</span>,
    },
    {
      key: "name",
      header: "Section",
      sortValue: (row) => row.name,
      render: (row) => <span className="text-neutral-600">{row.name}</span>,
    },
    {
      key: "capacity",
      header: "Capacity",
      align: "right",
      sortValue: (row) => row.capacity ?? 0,
      render: (row) => <span className="font-medium text-neutral-700">{row.capacity ?? "—"}</span>,
    },
    {
      key: "classTeacherName",
      header: "Class Teacher",
      sortValue: (row) => row.classTeacherName,
      render: (row) =>
        row.classTeacherName ? (
          <span className="text-neutral-700">{row.classTeacherName}</span>
        ) : (
          <span className="text-neutral-400">Unassigned</span>
        ),
    },
    ...(canEditClassTeacher
      ? [
          {
            key: "sectionActions",
            header: "",
            align: "right" as const,
            render: (row: SectionRow) => (
              <RowActions
                actions={[
                  {
                    label: "Set class teacher",
                    icon: <UserPlusIcon className="size-3.5" />,
                    onClick: () => setClassTeacherTarget(row),
                  },
                ]}
              />
            ),
          },
        ]
      : []),
  ];

  const sectionsWithTeacher = sections.filter((s) => s.classTeacherId).length;
  const subjectCount = teacherGroups.reduce(
    (sum, group) => sum + group.subjectAssignments.length,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Assignments"
        description="Assign teachers to class sections, subjects, and class teacher roles"
        actions={
          canManage ? (
            <Button
              text="Assign Teacher"
              icon={<PlusIcon className="size-4" />}
              className="w-auto"
              onClick={() => setAssignOpen(true)}
            />
          ) : undefined
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Teachers Assigned"
          value={String(teacherGroups.length)}
          icon={<GraduationCapIcon className="size-4" />}
        />
        <StatsCard
          label="Subject Assignments"
          value={String(subjectCount)}
          icon={<BookOpenIcon className="size-4" />}
        />
        <StatsCard
          label="Sections with Class Teacher"
          value={`${sectionsWithTeacher}/${sections.length}`}
          icon={<UserPlusIcon className="size-4" />}
        />
      </section>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Assignments</h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              Each teacher is listed once, with all their class sections and subjects
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Subject
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-neutral-400" /> Class
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterDropdown
            label="Filter by class"
            options={classFilterOptions}
            value={table.filter}
            onChange={table.setFilter}
          />
          <SearchBar
            value={table.query}
            onChange={table.setQuery}
            placeholder="Search assignments…"
          />
        </div>
        <DataTable
          columns={columns}
          data={table.pageRows}
          keyExtractor={(row) => row.teacherId}
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.handleSort}
          minWidth="min-w-[760px]"
          empty={{
            title: "No assignments yet",
            description: canManage
              ? "Use Assign Teacher to assign a teacher to a class section and subject."
              : "Assignments will appear here once created.",
          }}
          footer={
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
              label="assignments"
            />
          }
        />
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Class Teachers</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Class teacher role for every section of every class
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterDropdown
            label="Filter by class"
            options={classFilterOptions}
            value={sectionTable.filter}
            onChange={sectionTable.setFilter}
          />
          <SearchBar
            value={sectionTable.query}
            onChange={sectionTable.setQuery}
            placeholder="Search sections…"
          />
        </div>
        <DataTable
          columns={sectionColumns}
          data={sectionTable.pageRows}
          keyExtractor={(row) => row.id}
          sortKey={sectionTable.sortKey}
          sortDir={sectionTable.sortDir}
          onSort={sectionTable.handleSort}
          minWidth="min-w-[640px]"
          empty={{
            title: "No sections found",
            description: "Create classes with sections first.",
          }}
          footer={
            <Pagination
              page={sectionTable.page}
              pageSize={sectionTable.pageSize}
              total={sectionTable.total}
              onPageChange={sectionTable.setPage}
              label="sections"
            />
          }
        />
      </div>

      {canManage && (
        <Dialog
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          title="Assign Teacher"
          description="Assign a teacher to a class section, or assign a subject for an academic year."
        >
          <AssignTeacherForm
            teachers={teachers}
            classes={classes}
            sessions={sessions}
            subjects={subjects}
            onAdd={handleAssign}
            onClose={() => setAssignOpen(false)}
          />
        </Dialog>
      )}

      {canEditClassTeacher && (
        <Dialog
          open={classTeacherTarget !== null}
          onClose={() => setClassTeacherTarget(null)}
          title="Set Class Teacher"
          description="Choose the teacher responsible for this section."
        >
          {classTeacherTarget && (
            <SetClassTeacherForm
              section={{
                id: classTeacherTarget.id,
                className: classTeacherTarget.className,
                sectionName: classTeacherTarget.name,
                classTeacherId: classTeacherTarget.classTeacherId,
              }}
              teachers={teachers}
              onUpdate={handleSetClassTeacher}
              onClose={() => setClassTeacherTarget(null)}
            />
          )}
        </Dialog>
      )}

      <Dialog
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        title={confirmTarget?.title ?? ""}
        description="This action cannot be undone."
      >
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{confirmTarget?.message}</p>
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <Button
              variant="secondary"
              text="Cancel"
              onClick={() => setConfirmTarget(null)}
              className="w-auto"
            />
            <Button
              variant="danger"
              text={removing ? "Removing…" : "Remove"}
              loading={removing}
              disabled={removing}
              className="w-auto"
              onClick={() => void handleConfirmRemove()}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
