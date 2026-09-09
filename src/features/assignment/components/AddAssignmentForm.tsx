"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import { academicApi } from "@/features/academic/api/academicApi";
import { type AssignmentCreatePayload } from "../api/assignmentApi";

const AssignmentFormSchema = z.object({
  sectionId: z.string().min(1, "Choose a section"),
  subjectId: z.string().optional(),
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(2000).optional(),
  instructions: z.string().trim().min(1, "Instructions are required").max(10000),
  dueDate: z.string().min(1, "Due date is required"),
});

export type AssignmentFormValues = z.output<typeof AssignmentFormSchema>;

export interface TeacherOwnSection {
  sectionId: string;
  sectionName: string;
  className: string;
  classId: string;
}

export function AddAssignmentForm({
  sections,
  onAdd,
  onClose,
}: {
  sections: TeacherOwnSection[];
  onAdd: (values: AssignmentFormValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(AssignmentFormSchema),
    defaultValues: {
      sectionId: sections[0]?.sectionId ?? "",
      subjectId: "",
    },
  });

  const sectionId = watch("sectionId");

  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const section = sections.find((s) => s.sectionId === sectionId);
    if (!section) {
      setSubjects([]);
      return;
    }
    let active = true;
    academicApi
      .listClassSubjects(section.classId)
      .then((rows) => {
        if (!active) return;
        setSubjects(rows.map((r) => ({ id: r.subjectId, name: r.subjectName })));
      })
      .catch(() => {
        if (active) setSubjects([]);
      });
    setValue("subjectId", "");
    return () => {
      active = false;
    };
  }, [sectionId, sections, setValue]);

  const onSubmit = async (values: AssignmentFormValues) => {
    setApiError(null);
    const payload: AssignmentCreatePayload = {
      sectionId: values.sectionId,
      subjectId: values.subjectId ? values.subjectId : undefined,
      title: values.title,
      description: values.description || undefined,
      instructions: values.instructions,
      dueDate: values.dueDate,
    };
    const error = await onAdd(payload);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Section" error={errors.sectionId?.message} required>
          <Select disabled={isSubmitting || sections.length === 0} {...register("sectionId")}>
            <option value="">Select a section…</option>
            {sections.map((s) => (
              <option key={s.sectionId} value={s.sectionId}>
                {s.className} · {s.sectionName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subject" hint="Optional">
          <Select disabled={isSubmitting} {...register("subjectId")}>
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Title" error={errors.title?.message} required>
        <Input
          type="text"
          placeholder="e.g. Essay on Spring"
          disabled={isSubmitting}
          error={errors.title?.message}
          {...register("title")}
        />
      </Field>

      <Field
        label="Description"
        error={errors.description?.message}
        hint="Short summary shown in the student list"
      >
        <textarea
          {...register("description")}
          rows={2}
          placeholder="Brief description (optional)"
          disabled={isSubmitting}
          className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500"
        />
      </Field>

      <Field label="Instructions" error={errors.instructions?.message} required>
        <textarea
          {...register("instructions")}
          rows={4}
          placeholder="Full instructions students will see…"
          disabled={isSubmitting}
          className="w-full resize-none rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-neutral-500"
        />
      </Field>

      <Field label="Due date" error={errors.dueDate?.message} required>
        <Input
          type="date"
          disabled={isSubmitting}
          error={errors.dueDate?.message}
          {...register("dueDate")}
        />
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
          text={isSubmitting ? "Creating…" : "Create Assignment"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}

export default AddAssignmentForm;
