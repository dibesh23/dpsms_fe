"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field } from "@/shared/components/ui/form-field";

const EditSectionSchema = z.object({
  name: z
    .string()
    .min(1, "Section name is required")
    .max(20, "Section name must be at most 20 characters"),
  capacity: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || value.trim() === "" || (Number(value) >= 1 && Number.isInteger(Number(value))),
      "Capacity must be a whole number of at least 1",
    ),
});

export type EditSectionValues = z.infer<typeof EditSectionSchema>;

export function EditSectionForm({
  initial,
  onSave,
  onClose,
}: {
  initial: EditSectionValues;
  onSave: (values: EditSectionValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditSectionValues>({
    resolver: zodResolver(EditSectionSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: EditSectionValues) => {
    setApiError(null);
    const error = await onSave(values);
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

      <Field
        label="Capacity"
        hint="Leave empty to keep the current capacity"
        error={errors.capacity?.message}
      >
        <Input
          type="number"
          min={1}
          step={1}
          placeholder="40"
          disabled={isSubmitting}
          error={errors.capacity?.message}
          {...register("capacity")}
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

export function editValuesToPayload(values: EditSectionValues) {
  const trimmedCapacity = values.capacity?.trim();
  return {
    name: values.name.trim(),
    ...(trimmedCapacity ? { capacity: Number(trimmedCapacity) } : {}),
  };
}
