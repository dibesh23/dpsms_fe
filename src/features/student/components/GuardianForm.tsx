"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

const RELATIONS = [
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "GUARDIAN", label: "Guardian" },
] as const;

const GuardianSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN"], {
    message: "Select a relation",
  }),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .max(20, "Phone must be at most 20 characters"),
  email: z.union([z.email("Enter a valid email address"), z.literal("")]).optional(),
  occupation: z
    .string()
    .trim()
    .max(100, "Occupation must be at most 100 characters")
    .optional()
    .or(z.literal("")),
});

export type GuardianFormValues = z.infer<typeof GuardianSchema>;

export function GuardianForm({
  initial,
  showPrimary,
  onSave,
  onClose,
}: {
  initial?: Partial<GuardianFormValues>;

  showPrimary?: boolean;
  onSave: (values: GuardianFormValues, isPrimary: boolean) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GuardianFormValues>({
    resolver: zodResolver(GuardianSchema),
    defaultValues: {
      relation: undefined,
      ...initial,
    },
  });

  const onSubmit = async (values: GuardianFormValues) => {
    setApiError(null);
    const error = await onSave(values, isPrimary);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          error={errors.fullName?.message}
          className="sm:col-span-2"
          required
        >
          <Input
            type="text"
            autoComplete="name"
            placeholder="Rajesh Sharma"
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Relation" error={errors.relation?.message} required>
          <Select disabled={isSubmitting} required {...register("relation")}>
            <option value="">Select relation</option>
            {RELATIONS.map((relation) => (
              <option key={relation.value} value={relation.value}>
                {relation.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Phone" error={errors.phone?.message} required>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="9841-000000"
            disabled={isSubmitting}
            error={errors.phone?.message}
            {...register("phone")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="guardian@example.com"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field label="Occupation" error={errors.occupation?.message}>
          <Input
            type="text"
            placeholder="Business"
            disabled={isSubmitting}
            error={errors.occupation?.message}
            {...register("occupation")}
          />
        </Field>

        <div className="min-h-6 sm:col-span-2">
          {showPrimary && (
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(event) => setIsPrimary(event.target.checked)}
                disabled={isSubmitting}
                className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
              />
              Set as primary guardian
            </label>
          )}
        </div>
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
          text={isSubmitting ? "Saving…" : "Save Guardian"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
