"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field } from "@/shared/components/ui/form-field";

const EditDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100),
  description: z.string().trim().max(500, "Description must be at most 500 characters"),
});

export type EditDepartmentValues = z.infer<typeof EditDepartmentSchema>;

export function EditDepartmentForm({
  initial,
  onSave,
  onClose,
}: {
  initial: EditDepartmentValues;
  onSave: (values: EditDepartmentValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditDepartmentValues>({
    resolver: zodResolver(EditDepartmentSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: EditDepartmentValues) => {
    setApiError(null);
    const error = await onSave(values);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Department name" error={errors.name?.message} required>
        <Input
          type="text"
          placeholder="Science & Math"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
        />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <Input
          type="text"
          placeholder="What this department covers"
          disabled={isSubmitting}
          error={errors.description?.message}
          {...register("description")}
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
          text={isSubmitting ? "Saving…" : "Save changes"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}

export function editValuesToPayload(values: EditDepartmentValues) {
  return {
    name: values.name.trim(),

    description: values.description.trim() || "",
  };
}
