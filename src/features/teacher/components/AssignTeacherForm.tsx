"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Field, Select } from "@/shared/components/ui/form-field";
import { academicApi, type SectionRecord } from "@/features/academic/api/academicApi";

const AssignTeacherSchema = z.object({
  teacherId: z.string().min(1, "Select a teacher"),
  classId: z.string().min(1, "Select a class"),
  sectionId: z.string().min(1, "Select a section"),
  subjectId: z.string().optional(),
  academicYearId: z.string().optional(),
});

export type AssignTeacherValues = z.infer<typeof AssignTeacherSchema>;

export function AssignTeacherForm({
  teachers,
  classes,
  sessions,
  onAdd,
  onClose,
}: {
  teachers: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
  sessions: Array<{ id: string; label: string; isActive: boolean }>;
  onAdd: (values: AssignTeacherValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; code: string | null }>>(
    [],
  );
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignTeacherValues>({
    resolver: zodResolver(AssignTeacherSchema),
    defaultValues: {
      teacherId: "",
      classId: "",
      sectionId: "",
      subjectId: "",
      academicYearId: "",
    },
  });

  const selectedClassId = watch("classId");

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
    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) {
      setSubjects([]);
      return;
    }
    let cancelled = false;
    setSubjectsLoading(true);
    academicApi
      .listClassSubjects(selectedClassId)
      .then((records) => {
        if (!cancelled)
          setSubjects(
            records.map((r) => ({ id: r.subjectId, name: r.subjectName, code: null })),
          );
      })
      .catch(() => {
        if (!cancelled) setSubjects([]);
      })
      .finally(() => {
        if (!cancelled) setSubjectsLoading(false);
      });
    setValue("subjectId", "");
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, setValue]);

  const onSubmit = async (values: AssignTeacherValues) => {
    setApiError(null);
    const error = await onAdd(values);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Teacher" error={errors.teacherId?.message} required>
        <Select disabled={isSubmitting} {...register("teacherId")}>
          <option value="">Select teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Class" error={errors.classId?.message} required>
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
        error={errors.sectionId?.message}
        hint={
          selectedClassId && !sectionsLoading && sections.length === 0
            ? "No sections created for this class"
            : undefined
        }
        required
      >
        <Select disabled={isSubmitting || !selectedClassId || sectionsLoading} {...register("sectionId")}>
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

      <Field
        label="Subject"
        error={errors.subjectId?.message}
        hint={
          selectedClassId && !subjectsLoading && subjects.length === 0
            ? "No subjects mapped to this class yet. You can still assign the class."
            : "Optional. Leave as 'No subject' to assign just the class."
        }
      >
        <Select disabled={isSubmitting || !selectedClassId || subjectsLoading} {...register("subjectId")}>
          <option value="">No subject (class assignment only)</option>
          {!selectedClassId || subjectsLoading ? null : subjects.length === 0 ? (
            <option value="" disabled>
              No subjects available
            </option>
          ) : (
            subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code ? `${subject.name} (${subject.code})` : subject.name}
              </option>
            ))
          )}
        </Select>
      </Field>

      <Field
        label="Academic Year"
        error={errors.academicYearId?.message}
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
          text={isSubmitting ? "Assigning…" : "Assign Teacher"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
