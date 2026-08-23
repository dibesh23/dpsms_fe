"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

const AddSectionSchema = z.object({
  name: z.string().trim().min(1, "Section name is required").max(20),
  capacity: z
    .string()
    .optional()
    .refine(
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 1),
      "Capacity must be a whole number of at least 1",
    ),
  classTeacherId: z.string().optional(),
});

export type AddSectionValues = z.infer<typeof AddSectionSchema>;

export interface SectionTeacherOption {
  id: string;
  name: string;
}

export function AddSectionForm({
  teachers,
  onCreate,
  onClose,
}: {
  teachers: SectionTeacherOption[];
  onCreate: (values: {
    name: string;
    capacity?: number;
    classTeacherId?: string;
  }) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddSectionValues>({
    resolver: zodResolver(AddSectionSchema),
    defaultValues: { name: "", capacity: "", classTeacherId: "" },
  });

  const onSubmit = async (values: AddSectionValues) => {
    setApiError(null);
    const error = await onCreate({
      name: values.name,
      ...(values.capacity ? { capacity: Number(values.capacity) } : {}),
      ...(values.classTeacherId ? { classTeacherId: values.classTeacherId } : {}),
    });
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Section name" error={errors.name?.message} required>
        <Input
          type="text"
          placeholder="A"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
        />
      </Field>

      <Field label="Capacity" error={errors.capacity?.message} hint="Optional seat limit">
        <Input
          type="number"
          placeholder="40"
          min={1}
          disabled={isSubmitting}
          error={errors.capacity?.message}
          {...register("capacity")}
        />
      </Field>

      <Field label="Class teacher" error={errors.classTeacherId?.message} hint="Optional">
        <Select disabled={isSubmitting} {...register("classTeacherId")}>
          <option value="">Not assigned</option>
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
          text={isSubmitting ? "Adding…" : "Add Section"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
