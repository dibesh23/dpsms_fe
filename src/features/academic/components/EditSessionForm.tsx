"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field } from "@/shared/components/ui/form-field";

const EditSessionSchema = z.object({
  label: z.string().min(1, "Session label is required").max(20),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type EditSessionValues = z.infer<typeof EditSessionSchema>;

export function EditSessionForm({
  initial,
  onSave,
  onClose,
}: {
  initial: EditSessionValues;
  onSave: (values: EditSessionValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditSessionValues>({
    resolver: zodResolver(EditSessionSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: EditSessionValues) => {
    setApiError(null);
    const error = await onSave(values);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Session label" error={errors.label?.message} hint="e.g. Academic Year 2083/84">
        <Input
          type="text"
          placeholder="Academic Year 2083/84"
          disabled={isSubmitting}
          error={errors.label?.message}
          {...register("label")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Start date" error={errors.startDate?.message}>
          <Input
            type="date"
            disabled={isSubmitting}
            error={errors.startDate?.message}
            {...register("startDate")}
          />
        </Field>

        <Field label="End date" error={errors.endDate?.message}>
          <Input
            type="date"
            disabled={isSubmitting}
            error={errors.endDate?.message}
            {...register("endDate")}
          />
        </Field>
      </div>

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
