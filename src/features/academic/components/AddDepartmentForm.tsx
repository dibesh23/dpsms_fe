"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field } from "@/shared/components/ui/form-field";

const AddDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(100),
  description: z.string().max(500).optional(),
});

export type AddDepartmentValues = z.infer<typeof AddDepartmentSchema>;

export function AddDepartmentForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: AddDepartmentValues) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddDepartmentValues>({
    resolver: zodResolver(AddDepartmentSchema),
  });

  const onSubmit = async (values: AddDepartmentValues) => {
    setApiError(null);
    const ok = await onAdd(values);
    if (!ok) setApiError("Could not add the department. Check the details and try again.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Department name" error={errors.name?.message}>
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
          placeholder="What this department covers…"
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
          text={isSubmitting ? "Adding…" : "Add Department"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
