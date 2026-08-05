"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

const STATUSES = ["Verified", "Pending"] as const;

const AddParentSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  students: z.string().min(1, "Link at least one student"),
  status: z.enum(STATUSES),
});

export type AddParentValues = z.infer<typeof AddParentSchema>;

export function AddParentForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: AddParentValues) => void;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddParentValues>({
    resolver: zodResolver(AddParentSchema),
    defaultValues: { status: "Verified" },
  });

  const onSubmit = async (values: AddParentValues) => {
    setApiError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onAdd(values);
    } catch {
      setApiError("Could not add the parent. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
          <Input
            type="text"
            autoComplete="name"
            placeholder="Hari Sharma"
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} className="sm:col-span-2">
          <Input
            type="email"
            autoComplete="email"
            placeholder="guardian@gmail.com"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message} className="sm:col-span-2">
          <Input
            type="tel"
            placeholder="9841-000000"
            disabled={isSubmitting}
            error={errors.phone?.message}
            {...register("phone")}
          />
        </Field>

        <Field
          label="Linked students"
          error={errors.students?.message}
          hint="Comma-separated student names"
          className="sm:col-span-2"
        >
          <Input
            type="text"
            placeholder="Aarav Sharma, Sita Rai"
            disabled={isSubmitting}
            error={errors.students?.message}
            {...register("students")}
          />
        </Field>

        <Field label="Status" error={errors.status?.message}>
          <Select disabled={isSubmitting} {...register("status")}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
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
          text={isSubmitting ? "Adding…" : "Add Parent"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
