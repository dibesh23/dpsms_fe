"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { StatsCard } from "@/shared/components/ui/stats-card";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { RowActions } from "@/shared/components/ui/row-actions";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { formatDate } from "@/shared/lib/format";
import {
  academicApi,
  type ClassRecord,
  type SectionRecord,
  type ClassSubjectRecord,
  type ClassStudentRow,
} from "../api/academicApi";
import { teacherApi } from "@/features/teacher/api/teacherApi";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EditClassForm, type EditClassValues } from "./EditClassForm";
import { AddSectionForm } from "./AddSectionForm";
import { EditSectionForm, editValuesToPayload, type EditSectionValues } from "./EditSectionForm";
import { AddClassSubjectForm } from "./AddClassSubjectForm";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
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

const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
};

export function ClassDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const classId = params?.id;
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.ACADEMIC_CLASS_UPDATE);
  const canDelete = can(PERMISSIONS.ACADEMIC_CLASS_DELETE);
  const canCreateSection = can(PERMISSIONS.ACADEMIC_SECTION_CREATE);
  const canUpdateSection = can(PERMISSIONS.ACADEMIC_SECTION_UPDATE);
  const canDeleteSection = can(PERMISSIONS.ACADEMIC_SECTION_DELETE);
  const canManageSubjects = can(PERMISSIONS.ACADEMIC_CLASS_SUBJECT_MANAGE);

  const [schoolClass, setSchoolClass] = useState<ClassRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectRecord[]>([]);
  const [students, setStudents] = useState<ClassStudentRow[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string }>>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [sectionTarget, setSectionTarget] = useState<SectionRecord | null>(null);
  const [sectionDeleting, setSectionDeleting] = useState(false);
  const [editSectionTarget, setEditSectionTarget] = useState<SectionRecord | null>(null);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [subjectTarget, setSubjectTarget] = useState<ClassSubjectRecord | null>(null);
  const [subjectDeleting, setSubjectDeleting] = useState(false);

  const loadTeachers = useCallback(async () => {
    try {
      const records = await teacherApi.list();
      setTeachers(records.map((t) => ({ id: t.id, name: t.name })));
    } catch {
      setTeachers([]);
    }
  }, []);

  const loadSubjects = useCallback(async () => {
    try {
      const records = await academicApi.listSubjects();
      setSubjects(records.map((s) => ({ id: s.id, name: s.name, code: s.code })));
    } catch {
      setSubjects([]);
    }
  }, []);

  const load = useCallback(async () => {
    if (!classId) return;
    setLoadError(null);
    try {
      const [classRecord, sectionRecords, subjectRecords, studentRows] = await Promise.all([
        academicApi.getClass(classId),
        academicApi.listSections(classId),
        academicApi.listClassSubjects(classId),
        academicApi.listClassStudents(classId).catch(() => [] as ClassStudentRow[]),
      ]);
      setSchoolClass(classRecord);
      setSections(sectionRecords);
      setClassSubjects(subjectRecords);
      setStudents(studentRows);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not load this class."));
    }
  }, [classId]);

  useEffect(() => {
    void load();
    void loadTeachers();
  }, [load, loadTeachers]);

  const teacherNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const teacher of teachers) map.set(teacher.id, teacher.name);
    return map;
  }, [teachers]);

  const studentsBySection = useMemo(() => {
    const map = new Map<string, ClassStudentRow[]>();
    for (const row of students) {
      const list = map.get(row.sectionName) ?? [];
      list.push(row);
      map.set(row.sectionName, list);
    }
    return map;
  }, [students]);

  const handleUpdateClass = async (values: EditClassValues): Promise<string | null> => {
    if (!schoolClass) return "Class is not loaded yet.";
    try {
      const record = await academicApi.updateClass(schoolClass.id, { name: values.name });
      setSchoolClass(record);
      setEditOpen(false);
      toast.success("Class renamed successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not rename the class. Try again.");
    }
  };

  const handleDeleteClass = async () => {
    if (!schoolClass) return;
    setDeleteBusy(true);
    try {
      await academicApi.deleteClass(schoolClass.id);
      toast.success(`Class "${schoolClass.name}" removed.`);
      router.push("/classes");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the class. Try again."));
      setDeleteBusy(false);
    }
  };

  const handleCreateSection = async (values: {
    name: string;
    capacity?: number;
    classTeacherId?: string;
  }): Promise<string | null> => {
    if (!schoolClass) return "Class is not loaded yet.";
    try {
      const record = await academicApi.createSection(schoolClass.id, values);
      setSections((current) => [...current, record]);
      setSchoolClass((current) =>
        current ? { ...current, sections: [...current.sections, record.name] } : current,
      );
      setAddSectionOpen(false);
      toast.success(`Section "${record.name}" added.`);
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not add the section. Try again.");
    }
  };

  const handleEditSection = async (values: EditSectionValues): Promise<string | null> => {
    if (!editSectionTarget) return "Could not save changes. Try again.";
    try {
      const record = await academicApi.updateSection(
        editSectionTarget.id,
        editValuesToPayload(values),
      );
      setSections((current) =>
        current.map((section) => (section.id === record.id ? record : section)),
      );
      setSchoolClass((current) =>
        current
          ? {
              ...current,
              sections: current.sections.map((name) =>
                name === editSectionTarget.name ? record.name : name,
              ),
            }
          : current,
      );
      setEditSectionTarget(null);
      toast.success(`Section "${record.name}" updated.`);
      return null;
    } catch (err) {
      return getApiErrorMessage(
        err,
        "Could not update the section. Check the details and try again.",
      );
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionTarget) return;
    setSectionDeleting(true);
    try {
      await academicApi.deleteSection(sectionTarget.id);
      setSections((current) => current.filter((s) => s.id !== sectionTarget.id));
      setSchoolClass((current) =>
        current
          ? { ...current, sections: current.sections.filter((n) => n !== sectionTarget.name) }
          : current,
      );
      toast.success(`Section "${sectionTarget.name}" removed.`);
      setSectionTarget(null);
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Could not remove the section. It may still have students enrolled.",
        ),
      );
    } finally {
      setSectionDeleting(false);
    }
  };

  const availableSubjects = useMemo(() => {
    const mapped = new Set(classSubjects.map((cs) => cs.subjectId));
    return subjects.filter((subject) => !mapped.has(subject.id));
  }, [subjects, classSubjects]);

  const handleAddClassSubject = async (values: {
    subjectIds: string[];
    isElectiveGroup: boolean;
  }): Promise<string | null> => {
    if (!schoolClass) return "Class is not loaded yet.";
    try {
      const records = await academicApi.addClassSubject(schoolClass.id, values);
      setClassSubjects(records);
      setAddSubjectOpen(false);
      toast.success(
        `${records.length} subject${records.length === 1 ? "" : "s"} mapped to ${schoolClass.name}.`,
      );
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not map the subjects. Try again.");
    }
  };

  const handleRemoveClassSubject = async () => {
    if (!schoolClass || !subjectTarget) return;
    setSubjectDeleting(true);
    try {
      await academicApi.removeClassSubject(schoolClass.id, subjectTarget.subjectId);
      setClassSubjects((current) =>
        current.filter((cs) => cs.subjectId !== subjectTarget.subjectId),
      );
      toast.success(`"${subjectTarget.subjectName}" unmapped from the class.`);
      setSubjectTarget(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not unmap the subject. Try again."));
    } finally {
      setSubjectDeleting(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/classes"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to classes
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Class not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!schoolClass) {
    return <LoadingState label="Loading class…" />;
  }

  return (
    <div className="space-y-4">
      <Link
        href="/classes"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to classes
      </Link>

      <PageHeader
        title={schoolClass.name}
        description={`Academic year ${schoolClass.academicYearLabel || "—"} · Added ${formatDate(schoolClass.createdAt)}`}
        actions={
          <>
            {canUpdate && (
              <Button
                variant="secondary"
                text="Rename"
                icon={<PencilIcon className="size-4" />}
                className="w-auto"
                onClick={() => setEditOpen(true)}
              />
            )}
            {canDelete && (
              <Button
                variant="danger-outline"
                text="Remove"
                icon={<TrashIcon className="size-4" />}
                className="w-auto"
                onClick={() => setDeleteOpen(true)}
              />
            )}
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label="Sections"
          value={String(sections.length)}
          delta="In this class"
          deltaDirection="neutral"
          icon={<LayoutGridIcon className="size-4" />}
        />
        <StatsCard
          label="Enrolled Students"
          value={String(schoolClass.students)}
          delta="Active enrollments"
          deltaDirection="neutral"
          icon={<UsersIcon className="size-4" />}
        />
        <StatsCard
          label="Mapped Subjects"
          value={String(classSubjects.length)}
          delta="Taught in this class"
          deltaDirection="neutral"
          icon={<BookOpenIcon className="size-4" />}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {}
        <section className="rounded-lg border border-neutral-200 bg-bg-default">
          <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
            <div>
              <h2 className="font-medium text-neutral-900">Sections</h2>
              <p className="text-xs text-neutral-400">Divisions within {schoolClass.name}</p>
            </div>
            {canCreateSection && (
              <Button
                variant="secondary"
                text="Add Section"
                icon={<PlusIcon className="size-4" />}
                className="w-auto"
                onClick={() => setAddSectionOpen(true)}
              />
            )}
          </header>
          {sections.length === 0 ? (
            <EmptyState
              title="No sections yet"
              description={
                canCreateSection
                  ? "Add the first section to start enrolling students."
                  : "No sections have been created for this class."
              }
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {sections.map((section) => (
                <li key={section.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-xs font-semibold text-neutral-600">
                    {section.name}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      Section {section.name}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      Capacity {section.capacity === null ? "—" : String(section.capacity)} ·
                      Teacher:{" "}
                      {section.classTeacherId
                        ? (teacherNameById.get(section.classTeacherId) ?? "Assigned")
                        : "Not assigned"}
                    </p>
                  </div>
                  {(canUpdateSection || canDeleteSection) && (
                    <RowActions
                      actions={[
                        ...(canUpdateSection
                          ? [
                              {
                                label: "Edit",
                                icon: <PencilIcon className="size-3.5" />,
                                onClick: () => setEditSectionTarget(section),
                              },
                            ]
                          : []),
                        ...(canDeleteSection
                          ? [
                              {
                                label: "Remove section",
                                icon: <TrashIcon className="size-3.5" />,
                                danger: true,
                                onClick: () => setSectionTarget(section),
                              },
                            ]
                          : []),
                      ]}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {}
        <section className="rounded-lg border border-neutral-200 bg-bg-default">
          <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
            <div>
              <h2 className="font-medium text-neutral-900">Subjects</h2>
              <p className="text-xs text-neutral-400">Curriculum mapped to this class</p>
            </div>
            {canManageSubjects && (
              <Button
                variant="secondary"
                text="Map Subject"
                icon={<PlusIcon className="size-4" />}
                className="w-auto"
                onClick={() => {
                  void loadSubjects();
                  setAddSubjectOpen(true);
                }}
              />
            )}
          </header>
          {classSubjects.length === 0 ? (
            <EmptyState
              title="No subjects mapped"
              description={
                canManageSubjects
                  ? "Map subjects so teachers and exams can reference them."
                  : "No curriculum has been mapped to this class yet."
              }
            />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {classSubjects.map((cs) => (
                <li key={cs.subjectId} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
                    <BookOpenIcon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {cs.subjectName}
                    </p>
                    <p className="truncate text-xs text-neutral-400">{cs.subjectCode || "—"}</p>
                  </div>
                  {cs.isElectiveGroup && (
                    <span className="flex-none rounded-md bg-bg-subtle px-2 py-0.5 text-xs font-medium text-neutral-600">
                      Elective group
                    </span>
                  )}
                  {canManageSubjects && (
                    <RowActions
                      actions={[
                        {
                          label: "Unmap subject",
                          icon: <TrashIcon className="size-3.5" />,
                          danger: true,
                          onClick: () => setSubjectTarget(cs),
                        },
                      ]}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {}
      <section className="rounded-lg border border-neutral-200 bg-bg-default">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <h2 className="font-medium text-neutral-900">Students</h2>
            <p className="text-xs text-neutral-400">
              {students.length} enrolled · grouped by section
            </p>
          </div>
        </header>
        {students.length === 0 ? (
          <EmptyState
            title="No students enrolled"
            description="Students appear here once they are admitted or transferred into this class."
          />
        ) : (
          <div>
            {sections
              .filter((section) => (studentsBySection.get(section.name) ?? []).length > 0)
              .map((section) => (
                <div key={section.id} className="border-b border-neutral-100 last:border-b-0">
                  <p className="bg-bg-subtle px-5 py-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                    Section {section.name} · {(studentsBySection.get(section.name) ?? []).length}{" "}
                    students
                  </p>
                  <ul className="divide-y divide-neutral-100">
                    {(studentsBySection.get(section.name) ?? []).map((row) => (
                      <li key={row.enrollmentId}>
                        <Link
                          href={`/students/${row.studentId}`}
                          className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-bg-subtle"
                        >
                          <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-default text-xs font-semibold text-neutral-600">
                            {row.rollNumber}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-800">
                              {row.fullName}
                            </p>
                            <p className="truncate text-xs text-neutral-400">
                              Adm. No. {row.admissionNumber}
                            </p>
                          </div>
                          <StatusBadge status={STUDENT_STATUS_LABELS[row.status] ?? row.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </section>

      {canUpdate && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Rename Class"
          description="Changing the name applies to the whole academic year."
        >
          <EditClassForm
            currentName={schoolClass.name}
            onUpdate={handleUpdateClass}
            onClose={() => setEditOpen(false)}
          />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Remove Class"
          description={`This will remove "${schoolClass.name}" and its sections. This action cannot be undone.`}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Consider that students may still be enrolled. The backend rejects removal when
              dependent records exist.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setDeleteOpen(false)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={deleteBusy ? "Removing…" : "Remove Class"}
                loading={deleteBusy}
                disabled={deleteBusy}
                className="w-auto"
                onClick={() => void handleDeleteClass()}
              />
            </div>
          </div>
        </Dialog>
      )}

      {canCreateSection && (
        <Dialog
          open={addSectionOpen}
          onClose={() => setAddSectionOpen(false)}
          title="Add Section"
          description={`Create a new section within ${schoolClass.name}.`}
        >
          <AddSectionForm
            teachers={teachers}
            onCreate={handleCreateSection}
            onClose={() => setAddSectionOpen(false)}
          />
        </Dialog>
      )}

      {canUpdateSection && editSectionTarget && (
        <Dialog
          open
          onClose={() => setEditSectionTarget(null)}
          title="Edit Section"
          description={`Update section "${editSectionTarget.name}" of ${schoolClass.name}.`}
        >
          <EditSectionForm
            initial={{
              name: editSectionTarget.name,
              capacity:
                editSectionTarget.capacity === null ? "" : String(editSectionTarget.capacity),
            }}
            onSave={handleEditSection}
            onClose={() => setEditSectionTarget(null)}
          />
        </Dialog>
      )}

      {canDeleteSection && (
        <Dialog
          open={sectionTarget !== null}
          onClose={() => setSectionTarget(null)}
          title="Remove Section"
          description={
            sectionTarget ? `Remove section "${sectionTarget.name}" from ${schoolClass.name}?` : ""
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              Sections with active student enrollments cannot be removed.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setSectionTarget(null)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={sectionDeleting ? "Removing…" : "Remove Section"}
                loading={sectionDeleting}
                disabled={sectionDeleting}
                className="w-auto"
                onClick={() => void handleDeleteSection()}
              />
            </div>
          </div>
        </Dialog>
      )}

      {canManageSubjects && (
        <Dialog
          open={addSubjectOpen}
          onClose={() => setAddSubjectOpen(false)}
          title="Map Subjects"
          description={`Select one or more subjects taught in ${schoolClass.name}.`}
        >
          <AddClassSubjectForm
            subjects={availableSubjects}
            onCreate={handleAddClassSubject}
            onClose={() => setAddSubjectOpen(false)}
          />
        </Dialog>
      )}

      {canManageSubjects && (
        <Dialog
          open={subjectTarget !== null}
          onClose={() => setSubjectTarget(null)}
          title="Unmap Subject"
          description={subjectTarget ? `Unmap "${subjectTarget.subjectName}" from this class?` : ""}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              The subject itself stays in the catalog — only this class mapping is removed.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setSubjectTarget(null)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={subjectDeleting ? "Unmapping…" : "Unmap Subject"}
                loading={subjectDeleting}
                disabled={subjectDeleting}
                className="w-auto"
                onClick={() => void handleRemoveClassSubject()}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
