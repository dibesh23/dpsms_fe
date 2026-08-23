"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Field, Select } from "@/shared/components/ui/form-field";

const SetDepartmentHeadSchema = z.object({
  headTeacherId: z.string(),
});

export type SetDepartmentHeadValues = z.infer<typeof SetDepartmentHeadSchema>;

export function SetDepartmentHeadForm({
  department,
  teachers,
  onUpdate,
  onClose,
}: {
  department: { id: string; name: string; headTeacherId: string | null };
  teachers: Array<{ id: string; name: string }>;
  onUpdate: (values: SetDepartmentHeadValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetDepartmentHeadValues>({
    resolver: zodResolver(SetDepartmentHeadSchema),
    defaultValues: { headTeacherId: department.headTeacherId ?? "" },
  });

  const onSubmit = async (values: SetDepartmentHeadValues) => {
    setApiError(null);
    const error = await onUpdate(values);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-sm text-neutral-500">
        Head of{" "}
        <span className="font-medium text-neutral-800">{department.name}</span>
      </p>

      <Field
        label="Department Head"
        error={errors.headTeacherId?.message}
        hint="Only teachers who belong to this department can be assigned as its head"
      >
        <Select disabled={isSubmitting} {...register("headTeacherId")}>
          <option value="">No head assigned</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
            </option>
          ))}
        </Select>
      </Field>

      {!isSubmitting && teachers.length === 0 && (
        <p className="text-sm text-neutral-500">
          No teachers in this department yet. Assign teachers to it first.
        </p>
      )}

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
          text={isSubmitting ? "Saving…" : "Save Department Head"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
