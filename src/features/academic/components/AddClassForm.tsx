"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field } from "@/shared/components/ui/form-field";

const AddClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(50),
  sections: z.string().max(200).optional(),
});

export type AddClassValues = z.infer<typeof AddClassSchema>;

export function AddClassForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: AddClassValues) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddClassValues>({
    resolver: zodResolver(AddClassSchema),
    defaultValues: { sections: "A" },
  });

  const onSubmit = async (values: AddClassValues) => {
    setApiError(null);
    const ok = await onAdd(values);
    if (!ok) setApiError("Could not add the class. Check the details and try again.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Class name" error={errors.name?.message}>
        <Input
          type="text"
          placeholder="Grade 12"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
        />
      </Field>

      <Field label="Sections" error={errors.sections?.message} hint="Comma-separated, e.g. A, B">
        <Input
          type="text"
          placeholder="A, B"
          disabled={isSubmitting}
          error={errors.sections?.message}
          {...register("sections")}
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
          text={isSubmitting ? "Adding…" : "Add Class"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
