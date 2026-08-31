"use client";

import { useCallback, useEffect, useState } from "react";
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
import { AssignSubjectForm, type AssignSubjectValues } from "./AssignSubjectForm";
import { AssignClassForm, type AssignClassValues } from "./AssignClassForm";
import { SetClassTeacherForm, type SetClassTeacherValues } from "./SetClassTeacherForm";
import {
  BanIcon,
  BookOpenIcon,
  GraduationCapIcon,
  LayoutGridIcon,
  PlusIcon,
  UserPlusIcon,
} from "@/shared/components/ui/icons";

interface SubjectAssignmentView {
  key: string;
  id: string;
  teacherId: string;
  teacherName: string;
  subjectName: string;
  subjectCode: string | null;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
}

interface ClassAssignmentView {
  key: string;
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  academicYearLabel: string;
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
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string | null }>>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; label: string; isActive: boolean }>>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectAssignmentView[]>([]);
  const [classAssignments, setClassAssignments] = useState<ClassAssignmentView[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);

  const [assignSubjectOpen, setAssignSubjectOpen] = useState(false);
  const [assignClassOpen, setAssignClassOpen] = useState(false);
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

      setSubjectAssignments(
        subjectLists.flatMap((records, index) =>
          records.map((record) => ({
            key: `${teacherRecords[index].id}:${record.id}`,
            id: record.id,
            teacherId: teacherRecords[index].id,
            teacherName: teacherRecords[index].name,
            subjectName: record.subjectName,
            subjectCode: record.subjectCode,
            classId: record.classId,
            className: record.className,
            sectionId: record.sectionId,
            sectionName: record.sectionName,
          })),
        ),
      );

      setClassAssignments(
        classLists.flatMap((records, index) =>
          records.map((record) => ({
            key: `${teacherRecords[index].id}:${record.id}`,
            id: record.id,
            teacherId: teacherRecords[index].id,
            teacherName: teacherRecords[index].name,
            classId: record.classId,
            className: record.className,
            sectionId: record.sectionId,
            sectionName: record.sectionName,
            academicYearLabel: record.academicYearLabel,
          })),
        ),
      );

      const sectionLists = await Promise.all(
        classRecords.map((c) =>
          academicApi.listSections(c.id).catch(() => []),
        ),
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
      setSubjectAssignments([]);
      setClassAssignments([]);
      setSections([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAssignSubject = async (values: AssignSubjectValues): Promise<string | null> => {
    const duplicate = subjectAssignments.some(
      (a) =>
        a.teacherId === values.teacherId &&
        a.sectionId === values.sectionId &&
        a.subjectName === subjects.find((s) => s.id === values.subjectId)?.name,
    );
    if (duplicate) {
      return "This teacher is already assigned to this subject for the selected section.";
    }
    try {
      const record = await teacherAssignmentApi.createSubjectAssignment(values.teacherId, {
        subjectId: values.subjectId,
        sectionId: values.sectionId,
      });
      const teacher = teachers.find((t) => t.id === values.teacherId);
      setSubjectAssignments((current) => [
        ...current,
        {
          key: `${values.teacherId}:${record.id}`,
          id: record.id,
          teacherId: values.teacherId,
          teacherName: teacher?.name ?? "",
          subjectName: record.subjectName,
          subjectCode: record.subjectCode,
          classId: record.classId,
          className: record.className,
          sectionId: record.sectionId,
          sectionName: record.sectionName,
        },
      ]);
      setAssignSubjectOpen(false);
      toast.success("Subject assigned successfully.");
      return null;
    } catch {
      return "Could not assign the subject. Check the details and try again.";
    }
  };

  const handleAssignClass = async (values: AssignClassValues): Promise<string | null> => {
    const duplicate = classAssignments.some(
      (a) => a.teacherId === values.teacherId && a.sectionId === values.sectionId,
    );
    if (duplicate) {
      return "This teacher already has a class assignment for the selected section.";
    }
    try {
      const record = await teacherAssignmentApi.createClassAssignment(values.teacherId, {
        sectionId: values.sectionId,
        academicYearId: values.academicYearId || undefined,
      });
      const teacher = teachers.find((t) => t.id === values.teacherId);
      setClassAssignments((current) => [
        ...current,
        {
          key: `${values.teacherId}:${record.id}`,
          id: record.id,
          teacherId: values.teacherId,
          teacherName: teacher?.name ?? "",
          classId: record.classId,
          className: record.className,
          sectionId: record.sectionId,
          sectionName: record.sectionName,
          academicYearLabel: record.academicYearLabel,
        },
      ]);
      setAssignClassOpen(false);
      toast.success("Class assigned successfully.");
      return null;
    } catch {
      return "Could not assign the class. Check the details and try again.";
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
        setSubjectAssignments((current) =>
          current.filter((a) => a.id !== confirmTarget.assignmentId),
        );
        toast.success("Subject assignment removed.");
      } else {
        await teacherAssignmentApi.removeClassAssignment(
          confirmTarget.teacherId,
          confirmTarget.assignmentId,
        );
        setClassAssignments((current) =>
          current.filter((a) => a.id !== confirmTarget.assignmentId),
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

  const subjectTable = useTable<SubjectAssignmentView>({
    data: subjectAssignments,
    pageSize: 8,
    getSearchText: (row) =>
      `${row.teacherName} ${row.subjectName} ${row.subjectCode ?? ""} ${row.className} ${row.sectionName}`,
    filterMatch: (row, value) => row.classId === value,
    sortValue: sortValueOf,
    defaultSortKey: "teacherName",
  });

  const classTable = useTable<ClassAssignmentView>({
    data: classAssignments,
    pageSize: 8,
    getSearchText: (row) =>
      `${row.teacherName} ${row.className} ${row.sectionName} ${row.academicYearLabel}`,
    filterMatch: (row, value) => row.classId === value,
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

  const subjectColumns: Column<SubjectAssignmentView>[] = [
    {
      key: "teacherName",
      header: "Teacher",
      sortValue: (row) => row.teacherName,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
            <GraduationCapIcon className="size-4" />
          </span>
          <p className="truncate font-medium text-neutral-900">{row.teacherName}</p>
        </div>
      ),
    },
    {
      key: "subjectName",
      header: "Subject",
      sortValue: (row) => row.subjectName,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">{row.subjectName}</p>
          {row.subjectCode && <p className="text-xs text-neutral-400">{row.subjectCode}</p>}
        </div>
      ),
    },
    {
      key: "className",
      header: "Class",
      sortValue: (row) => row.className,
      render: (row) => <span className="text-neutral-600">{row.className}</span>,
    },
    {
      key: "sectionName",
      header: "Section",
      sortValue: (row) => row.sectionName,
      render: (row) => <span className="text-neutral-600">{row.sectionName}</span>,
    },
    ...(canManage
      ? [
          {
            key: "subjectActions",
            header: "",
            align: "right" as const,
            render: (row: SubjectAssignmentView) => (
              <RowActions
                actions={[
                  {
                    label: "Remove assignment",
                    icon: <BanIcon className="size-3.5" />,
                    danger: true,
                    onClick: () =>
                      setConfirmTarget({
                        kind: "subject",
                        teacherId: row.teacherId,
                        assignmentId: row.id,
                        title: "Remove subject assignment",
                        message: `Remove ${row.teacherName}'s assignment for ${row.subjectName} in ${row.className} · Section ${row.sectionName}?`,
                      }),
                  },
                ]}
              />
            ),
          },
        ]
      : []),
  ];

  const classColumns: Column<ClassAssignmentView>[] = [
    {
      key: "teacherName",
      header: "Teacher",
      sortValue: (row) => row.teacherName,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
            <GraduationCapIcon className="size-4" />
          </span>
          <p className="truncate font-medium text-neutral-900">{row.teacherName}</p>
        </div>
      ),
    },
    {
      key: "className",
      header: "Class",
      sortValue: (row) => row.className,
      render: (row) => <span className="text-neutral-600">{row.className}</span>,
    },
    {
      key: "sectionName",
      header: "Section",
      sortValue: (row) => row.sectionName,
      render: (row) => <span className="text-neutral-600">{row.sectionName}</span>,
    },
    {
      key: "academicYearLabel",
      header: "Academic Year",
      sortValue: (row) => row.academicYearLabel,
      render: (row) => <span className="text-neutral-500">{row.academicYearLabel}</span>,
    },
    ...(canManage
      ? [
          {
            key: "classActions",
            header: "",
            align: "right" as const,
            render: (row: ClassAssignmentView) => (
              <RowActions
                actions={[
                  {
                    label: "Remove assignment",
                    icon: <BanIcon className="size-3.5" />,
                    danger: true,
                    onClick: () =>
                      setConfirmTarget({
                        kind: "class",
                        teacherId: row.teacherId,
                        assignmentId: row.id,
                        title: "Remove class assignment",
                        message: `Remove ${row.teacherName}'s class assignment for ${row.className} · Section ${row.sectionName}?`,
                      }),
                  },
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
      render: (row) => (
        <span className="font-medium text-neutral-700">{row.capacity ?? "—"}</span>
      ),
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Assignments"
        description="Assign teachers to class sections, subjects, and class teacher roles"
        actions={
          canManage ? (
            <>
              <Button
                text="Assign Class"
                icon={<PlusIcon className="size-4" />}
                variant="secondary"
                className="w-auto"
                onClick={() => setAssignClassOpen(true)}
              />
              <Button
                text="Assign Subject"
                icon={<PlusIcon className="size-4" />}
                className="w-auto"
                onClick={() => setAssignSubjectOpen(true)}
              />
            </>
          ) : undefined
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Subject Assignments"
          value={String(subjectAssignments.length)}
          icon={<BookOpenIcon className="size-4" />}
        />
        <StatsCard
          label="Class Assignments"
          value={String(classAssignments.length)}
          icon={<LayoutGridIcon className="size-4" />}
        />
        <StatsCard
          label="Sections with Class Teacher"
          value={`${sectionsWithTeacher}/${sections.length}`}
          icon={<UserPlusIcon className="size-4" />}
        />
      </section>

      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Subject Assignments</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Who teaches which subject, across every class section
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterDropdown
            label="Filter by class"
            options={classFilterOptions}
            value={subjectTable.filter}
            onChange={subjectTable.setFilter}
          />
          <SearchBar
            value={subjectTable.query}
            onChange={subjectTable.setQuery}
            placeholder="Search assignments…"
          />
        </div>
        <DataTable
          columns={subjectColumns}
          data={subjectTable.pageRows}
          keyExtractor={(row) => row.key}
          sortKey={subjectTable.sortKey}
          sortDir={subjectTable.sortDir}
          onSort={subjectTable.handleSort}
          empty={{
            title: "No subject assignments yet",
            description: canManage
              ? "Use Assign Subject to assign a teacher to a class section."
              : "Assignments will appear here once created.",
          }}
          footer={
            <Pagination
              page={subjectTable.page}
              pageSize={subjectTable.pageSize}
              total={subjectTable.total}
              onPageChange={subjectTable.setPage}
              label="subject assignments"
            />
          }
        />
      </div>

      <div className="space-y-3 pt-2">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Class Assignments</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Sections each teacher is assigned to for the academic year
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterDropdown
            label="Filter by class"
            options={classFilterOptions}
            value={classTable.filter}
            onChange={classTable.setFilter}
          />
          <SearchBar
            value={classTable.query}
            onChange={classTable.setQuery}
            placeholder="Search assignments…"
          />
        </div>
        <DataTable
          columns={classColumns}
          data={classTable.pageRows}
          keyExtractor={(row) => row.key}
          sortKey={classTable.sortKey}
          sortDir={classTable.sortDir}
          onSort={classTable.handleSort}
          empty={{
            title: "No class assignments yet",
            description: canManage
              ? "Use Assign Class to assign a teacher to a class section."
              : "Assignments will appear here once created.",
          }}
          footer={
            <Pagination
              page={classTable.page}
              pageSize={classTable.pageSize}
              total={classTable.total}
              onPageChange={classTable.setPage}
              label="class assignments"
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
        <>
          <Dialog
            open={assignSubjectOpen}
            onClose={() => setAssignSubjectOpen(false)}
            title="Assign Subject"
            description="Assign a teacher to a subject in a class section."
          >
            <AssignSubjectForm
              teachers={teachers}
              classes={classes}
              onAdd={handleAssignSubject}
              onClose={() => setAssignSubjectOpen(false)}
            />
          </Dialog>

          <Dialog
            open={assignClassOpen}
            onClose={() => setAssignClassOpen(false)}
            title="Assign Class"
            description="Assign a teacher to a class section for an academic year."
          >
            <AssignClassForm
              teachers={teachers}
              classes={classes}
              sessions={sessions}
              onAdd={handleAssignClass}
              onClose={() => setAssignClassOpen(false)}
            />
          </Dialog>
        </>
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
