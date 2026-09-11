"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Field, Select } from "@/shared/components/ui/form-field";
import { academicApi, type SectionRecord } from "@/features/academic/api/academicApi";
import { cn } from "@/shared/lib/cn";

const ASSIGNMENT_MODES = ["section", "subject"] as const;
type AssignmentMode = (typeof ASSIGNMENT_MODES)[number];

const SectionAssignSchema = z.object({
  mode: z.literal("section"),
  teacherId: z.string().min(1, "Select a teacher"),
  classId: z.string().min(1, "Select a class"),
  sectionId: z.string().min(1, "Select a section"),
  academicYearId: z.string().optional(),
});

const SubjectAssignSchema = z.object({
  mode: z.literal("subject"),
  teacherId: z.string().min(1, "Select a teacher"),
  subjectId: z.string().min(1, "Select a subject"),
  academicYearId: z.string().optional(),
});

const AssignTeacherSchema = z.discriminatedUnion("mode", [
  SectionAssignSchema,
  SubjectAssignSchema,
]);

export type AssignTeacherValues = z.infer<typeof AssignTeacherSchema>;

export function AssignTeacherForm({
  teachers,
  classes,
  sessions,
  subjects,
  onAdd,
  onClose,
}: {
  teachers: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
  sessions: Array<{ id: string; label: string; isActive: boolean }>;
  subjects: Array<{ id: string; name: string; code: string | null }>;
  onAdd: (values: AssignTeacherValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [mode, setMode] = useState<AssignmentMode>("section");
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignTeacherValues>({
    resolver: zodResolver(AssignTeacherSchema),
    defaultValues: { mode: "section", academicYearId: "" },
  });

  const selectedClassId = watch("classId");

  useEffect(() => {
    setValue("academicYearId", "");
    setValue("classId", "");
    setValue("sectionId", "");
    setValue("subjectId", "");
    setSections([]);
  }, [mode, setValue]);

  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      return;
    }
    let cancelled = false;
    setSectionsLoading(true);
    academicApi
      .listSections(selectedClassId)
      .then((records) => {
        if (!cancelled) setSections(records);
      })
      .catch(() => {
        if (!cancelled) setSections([]);
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });
    setValue("sectionId", "");
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, setValue]);

  const onSubmit = async (values: AssignTeacherValues) => {
    setApiError(null);
    const error = await onAdd(values);
    if (error) setApiError(error);
  };

  const errorMessage = (
    name: "teacherId" | "classId" | "sectionId" | "subjectId" | "academicYearId",
  ): string | undefined => {
    const fieldError = errors[name as keyof typeof errors];
    return fieldError && typeof fieldError.message === "string" ? fieldError.message : undefined;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-bg-subtle p-0.5">
        <button
          type="button"
          onClick={() => {
            setMode("section");
            setValue("mode", "section");
          }}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "section"
              ? "bg-bg-default text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800",
          )}
        >
          Assign to Section
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("subject");
            setValue("mode", "subject");
          }}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "subject"
              ? "bg-bg-default text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-800",
          )}
        >
          Assign Subject
        </button>
      </div>

      <Field label="Teacher" error={errorMessage("teacherId")} required>
        <Select disabled={isSubmitting} {...register("teacherId")}>
          <option value="">Select teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="min-h-[11.5rem]">
        {mode === "section" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Class" error={errorMessage("classId")} className="sm:col-span-2" required>
              <Select
                disabled={isSubmitting}
                {...register("classId", {
                  onChange: () => setValue("sectionId", ""),
                })}
              >
                <option value="">Select class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Section"
              error={errorMessage("sectionId")}
              className="sm:col-span-2"
              hint={
                selectedClassId && !sectionsLoading && sections.length === 0
                  ? "No sections created for this class"
                  : undefined
              }
              required
            >
              <Select
                disabled={isSubmitting || !selectedClassId || sectionsLoading}
                {...register("sectionId")}
              >
                <option value="">
                  {!selectedClassId
                    ? "Select a class first"
                    : sectionsLoading
                      ? "Loading sections…"
                      : sections.length === 0
                        ? "No sections available"
                        : "Select section"}
                </option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        ) : (
          <Field
            label="Subject"
            error={errorMessage("subjectId")}
            hint={
              subjects.length === 0
                ? "No subjects exist yet. Create subjects under Academics first."
                : "A subject applies to the whole academic year."
            }
            required
          >
            <Select disabled={isSubmitting || subjects.length === 0} {...register("subjectId")}>
              <option value="">
                {subjects.length === 0 ? "No subjects available" : "Select subject"}
              </option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.code ? `${subject.name} (${subject.code})` : subject.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <Field
        label="Academic Year"
        error={errorMessage("academicYearId")}
        hint="Leave empty to use the active academic year"
      >
        <Select disabled={isSubmitting} {...register("academicYearId")}>
          <option value="">Default (active academic year)</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.isActive ? `${session.label} (Active)` : session.label}
            </option>
          ))}
        </Select>
      </Field>

      {apiError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {apiError}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
        <Button
          text={
            isSubmitting
              ? "Assigning…"
              : mode === "section"
                ? "Assign to Section"
                : "Assign Subject"
          }
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
