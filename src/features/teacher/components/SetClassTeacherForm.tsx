"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Field, Select } from "@/shared/components/ui/form-field";

const SetClassTeacherSchema = z.object({
  teacherId: z.string().min(1, "Select a class teacher"),
});

export type SetClassTeacherValues = z.infer<typeof SetClassTeacherSchema>;

export function SetClassTeacherForm({
  section,
  teachers,
  onUpdate,
  onClose,
}: {
  section: { id: string; className: string; sectionName: string; classTeacherId: string | null };
  teachers: Array<{ id: string; name: string }>;
  onUpdate: (values: SetClassTeacherValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetClassTeacherValues>({
    resolver: zodResolver(SetClassTeacherSchema),
    defaultValues: { teacherId: section.classTeacherId ?? "" },
  });

  const onSubmit = async (values: SetClassTeacherValues) => {
    setApiError(null);
    const error = await onUpdate(values);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-sm text-neutral-500">
        Class teacher for{" "}
        <span className="font-medium text-neutral-800">
          {section.className} · Section {section.sectionName}
        </span>
      </p>

      <Field
        label="Class Teacher"
        error={errors.teacherId?.message}
        hint="The class teacher can mark attendance for this section"
        required
      >
        <Select disabled={isSubmitting} {...register("teacherId")}>
          <option value="">Select teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
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
          text={isSubmitting ? "Saving…" : "Save Class Teacher"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
