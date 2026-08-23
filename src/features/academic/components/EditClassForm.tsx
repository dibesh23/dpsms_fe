"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field } from "@/shared/components/ui/form-field";

const EditClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required").max(50),
});

export type EditClassValues = z.infer<typeof EditClassSchema>;

export function EditClassForm({
  currentName,
  onUpdate,
  onClose,
}: {
  currentName: string;
  onUpdate: (values: EditClassValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditClassValues>({
    resolver: zodResolver(EditClassSchema),
    defaultValues: { name: currentName },
  });

  const onSubmit = async (values: EditClassValues) => {
    setApiError(null);
    const error = await onUpdate(values);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Class name" error={errors.name?.message} required>
        <Input
          type="text"
          placeholder="Grade 12"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
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
          text={isSubmitting ? "Saving…" : "Save Changes"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
