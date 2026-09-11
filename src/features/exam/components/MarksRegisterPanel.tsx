"use client";

import { useState, useEffect, useCallback } from "react";
import { SectionCard } from "@/shared/components/ui/section-card";
import { Button } from "@/shared/components/ui/button";
import { Select } from "@/shared/components/ui/form-field";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { examApi, type ExamDetail, type MarksRegister } from "../api/examApi";
import { academicApi, type SectionRecord } from "../../academic/api/academicApi";
import { SUBJECT_STATUS_LABEL, SUBJECT_STATUS_VARIANT } from "./labels";
import { BanIcon, ClipboardCheckIcon } from "@/shared/components/ui/icons";

type MarksRow = { theory: string; practical: string; absent: boolean };
type MarksMap = Record<string, MarksRow>;

export function MarksRegisterPanel({
  exam,
  onChanged,
}: {
  exam: ExamDetail;
  onChanged: () => Promise<void>;
}) {
  const { hasRole } = useAuth();
  const canEditMarks = hasRole("TEACHER");
  const toast = useToast();
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [register, setRegister] = useState<MarksRegister | null>(null);
  const [marks, setMarks] = useState<MarksMap>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleSubjects = exam.subjects;
  const canEnter = exam.status === "MARKS_ENTRY";

  const loadSections = useCallback(async () => {
    try {
      setSections(await academicApi.listSections(exam.classId));
    } catch {
      setSections([]);
    }
  }, [exam.classId]);

  useEffect(() => {
    void loadSections();
  }, [loadSections]);

  const loadRegister = useCallback(
    async (section: string, subject: string) => {
      if (!section || !subject || !canEnter) return;
      setLoading(true);
      setError(null);
      try {
        const data = await examApi.getMarksRegister(exam.id, {
          sectionId: section,
          subjectId: subject,
        });
        setRegister(data);
        const next: MarksMap = {};
        for (const student of data.students) {
          next[student.enrollmentId] = {
            theory: student.theoryMarks == null ? "" : String(student.theoryMarks),
            practical: student.practicalMarks == null ? "" : String(student.practicalMarks),
            absent: student.isAbsent,
          };
        }
        setMarks(next);
      } catch (err) {
        setRegister(null);
        setError(err instanceof Error ? err.message : "Could not load the marks register.");
      } finally {
        setLoading(false);
      }
    },
    [exam.id, canEnter],
  );

  useEffect(() => {
    if (sections.length > 0 && visibleSubjects.length > 0) {
      if (!sectionId || !sections.some((s) => s.id === sectionId)) setSectionId(sections[0]!.id);
      if (!subjectId || !visibleSubjects.some((s) => s.subjectId === subjectId))
        setSubjectId(visibleSubjects[0]!.subjectId);
    }
  }, [sections, visibleSubjects, sectionId, subjectId]);

  useEffect(() => {
    if (sectionId && subjectId) void loadRegister(sectionId, subjectId);
  }, [sectionId, subjectId, loadRegister]);

  const setMarksFor = (enrollmentId: string, patch: Partial<MarksRow>) =>
    setMarks((current) => ({
      ...current,
      [enrollmentId]: {
        ...(current[enrollmentId] ?? { theory: "", practical: "", absent: false }),
        ...patch,
      },
    }));

  const toggleAbsent = (enrollmentId: string) =>
    setMarksFor(enrollmentId, {
      absent: !(marks[enrollmentId]?.absent ?? false),
    });

  const handleSave = async () => {
    if (!register) return;
    setSaving(true);
    setError(null);
    try {
      await examApi.enterMarks(exam.id, {
        sectionId: register.sectionId,
        subjectId: register.subjectId,
        results: register.students.map((student) => {
          const row = marks[student.enrollmentId] ?? { theory: "", practical: "", absent: false };
          return {
            enrollmentId: student.enrollmentId,
            theoryMarks: row.absent ? null : row.theory === "" ? null : Number(row.theory),
            practicalMarks: row.absent ? null : row.practical === "" ? null : Number(row.practical),
            isAbsent: row.absent,
          };
        }),
      });
      toast.success("Marks saved.");
      await loadRegister(register.sectionId, register.subjectId);
      await onChanged();
    } catch (err) {
      const message =
        err instanceof Error && "response" in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data
              ?.error?.message
          : undefined;
      setError(message ?? (err instanceof Error ? err.message : "Could not save marks."));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!register) return;
    setSubmitting(true);
    setError(null);
    try {
      await examApi.submitSubject(exam.id, register.subjectId);
      toast.success(`${register.subjectName} marks submitted for review.`);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit marks.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentSubject = visibleSubjects.find((s) => s.subjectId === subjectId) ?? null;
  const canSubmit = canEnter && currentSubject?.status === "ENTERED";

  return (
    <SectionCard
      title="Marks Register"
      description="Enter theory and practical marks per section and subject"
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-end gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="w-48">
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">Section</label>
          <Select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            disabled={loading || saving}
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <label className="mb-1.5 block text-sm font-medium text-neutral-800">Subject</label>
          <Select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={loading || saving}
          >
            {visibleSubjects.map((subject) => (
              <option key={subject.subjectId} value={subject.subjectId}>
                {subject.subjectName}
              </option>
            ))}
          </Select>
        </div>

        {currentSubject && register && (
          <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500">
            <StatusBadge
              status={SUBJECT_STATUS_LABEL[currentSubject.status]}
              variant={SUBJECT_STATUS_VARIANT[currentSubject.status]}
              dot={false}
            />
            {register.fullMarksTheory > 0 && <span>Theory {register.fullMarksTheory}</span>}
            {register.fullMarksPractical > 0 && (
              <span>Practical {register.fullMarksPractical}</span>
            )}
            {register.passMarks > 0 && <span>Pass {register.passMarks}</span>}
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mx-5 mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="px-5 py-8">
          <LoadingState label="Loading register…" />
        </div>
      ) : !register ? (
        <div className="px-5 py-8">
          <EmptyState
            icon={<ClipboardCheckIcon className="size-5" />}
            title="Select a section and subject"
            description="The register shows the students enrolled in the selected section."
          />
        </div>
      ) : register.students.length === 0 ? (
        <div className="px-5 py-8">
          <EmptyState
            title="No students in this section"
            description="Enrol students in the section before entering marks."
          />
        </div>
      ) : (
        <div className="overflow-x-auto px-5 py-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
                <th className="pb-2 pr-3 font-medium">Student</th>
                <th className="pb-2 pr-3 font-medium">Roll</th>
                <th className="w-28 pb-2 pr-3 font-medium">Theory</th>
                <th className="w-28 pb-2 pr-3 font-medium">Practical</th>
                <th className="pb-2 font-medium">Grade</th>
                <th className="pb-2 pl-3 text-right font-medium">Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {register.students.map((student) => {
                const row = marks[student.enrollmentId] ?? {
                  theory: "",
                  practical: "",
                  absent: false,
                };
                const absent = row.absent;
                return (
                  <tr key={student.enrollmentId} className={absent ? "bg-bg-subtle/50" : undefined}>
                    <td className="py-2 pr-3">
                      <p className="font-medium text-neutral-900">{student.studentName}</p>
                      <p className="text-xs text-neutral-400">{student.admissionNumber}</p>
                    </td>
                    <td className="py-2 pr-3 text-neutral-600">{student.rollNumber || "—"}</td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        max={register.fullMarksTheory || undefined}
                        value={absent ? "" : row.theory}
                        readOnly={!canEditMarks}
                        disabled={absent}
                        onChange={(e) =>
                          setMarksFor(student.enrollmentId, { theory: e.target.value })
                        }
                        className="w-full rounded-md border border-neutral-300 bg-bg-default px-2 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none disabled:opacity-60"
                        aria-label={`${student.studentName} theory marks`}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        min={0}
                        max={register.fullMarksPractical || undefined}
                        value={absent ? "" : row.practical}
                        readOnly={!canEditMarks}
                        disabled={absent}
                        onChange={(e) =>
                          setMarksFor(student.enrollmentId, { practical: e.target.value })
                        }
                        className="w-full rounded-md border border-neutral-300 bg-bg-default px-2 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none disabled:opacity-60"
                        aria-label={`${student.studentName} practical marks`}
                      />
                    </td>
                    <td className="py-2">
                      {absent ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          NG
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">{student.grade || "—"}</span>
                      )}
                    </td>
                    <td className="py-2 pl-3 text-right">
                      <button
                        type="button"
                        disabled={!canEditMarks}
                        onClick={() => toggleAbsent(student.enrollmentId)}
                        className={
                          absent
                            ? "inline-flex items-center gap-1 rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white"
                            : "inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-bg-muted"
                        }
                      >
                        <BanIcon className="size-3.5" />
                        {absent ? "Absent" : "Present"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            {canEditMarks ? (
              <>
                <Button
                  variant="secondary"
                  text={saving ? "Saving…" : "Save marks"}
                  loading={saving}
                  disabled={saving || submitting}
                  className="w-auto"
                  onClick={() => void handleSave()}
                />
                <Button
                  text={submitting ? "Submitting…" : "Submit for review"}
                  loading={submitting}
                  disabled={submitting || saving || !canSubmit}
                  className="w-auto"
                  onClick={() => void handleSubmit()}
                />
              </>
            ) : (
              <p className="text-xs text-neutral-400">
                Review mode — marks are read-only for this account.
              </p>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export default MarksRegisterPanel;
