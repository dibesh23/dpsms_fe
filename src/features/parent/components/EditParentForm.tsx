"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

export const PARENT_STATUS_LABELS = ["Verified", "Pending"] as const;
export type ParentStatusLabel = (typeof PARENT_STATUS_LABELS)[number];

export function parentStatusToLabel(status: string): ParentStatusLabel {
  return status === "PENDING" ? "Pending" : "Verified";
}

export function parentLabelToStatus(label: ParentStatusLabel): "VERIFIED" | "PENDING" {
  return label === "Pending" ? "PENDING" : "VERIFIED";
}

const RELATIONS = [
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "GUARDIAN", label: "Guardian" },
] as const;

export function relationToLabel(relation: string): string {
  return RELATIONS.find((item) => item.value === relation)?.label ?? "Guardian";
}

// Linked students are matched by exact full name server-side and the list is
// replaced wholesale, so an empty value intentionally unlinks every student.
const EditParentSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN"]),
  phone: z.string().trim().min(1, "Phone is required").max(20, "Phone number is too long"),
  email: z.union([z.email("Enter a valid email address"), z.literal("")]),
  occupation: z.string().trim().max(100, "Occupation is too long"),
  students: z.string(),
  status: z.enum(PARENT_STATUS_LABELS),
});

export type EditParentValues = z.infer<typeof EditParentSchema>;

export function EditParentForm({
  initial,
  onSave,
  onClose,
}: {
  initial: EditParentValues;
  onSave: (values: EditParentValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditParentValues>({
    resolver: zodResolver(EditParentSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: EditParentValues) => {
    setApiError(null);
    const error = await onSave(values);
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
            placeholder="Sunita K.C."
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Relation" error={errors.relation?.message} required>
          <Select disabled={isSubmitting} {...register("relation")}>
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

        <Field label="Email" error={errors.email?.message} hint="Leave empty to remove">
          <Input
            type="email"
            autoComplete="email"
            placeholder="parent@example.com"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field label="Occupation" error={errors.occupation?.message}>
          <Input
            type="text"
            placeholder="Shop owner"
            disabled={isSubmitting}
            error={errors.occupation?.message}
            {...register("occupation")}
          />
        </Field>

        <Field
          label="Linked students"
          error={errors.students?.message}
          className="sm:col-span-2"
          hint="Comma-separated full names. Leave empty to unlink all students."
        >
          <Input
            type="text"
            placeholder="Aarav Sharma, Diya Sharma"
            disabled={isSubmitting}
            error={errors.students?.message}
            {...register("students")}
          />
        </Field>

        <Field label="Status" error={errors.status?.message}>
          <Select disabled={isSubmitting} {...register("status")}>
            {PARENT_STATUS_LABELS.map((status) => (
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
          text={isSubmitting ? "Saving…" : "Save changes"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}

// Payload rules mirror the backend contract:
// - omit a key entirely -> keep the existing value
// - email "" -> clears it server-side; occupation "" -> stored as empty string
// - studentNames is always sent and replaces the whole link set (replace-all)
export function editValuesToPayload(values: EditParentValues) {
  const email = values.email?.trim();
  return {
    fullName: values.fullName.trim(),
    relation: values.relation,
    phone: values.phone.trim(),
    ...(email ? { email } : { email: "" }),
    occupation: values.occupation.trim() || "",
    status: parentLabelToStatus(values.status),
    studentNames: values.students
      .split(",")
      .map((student) => student.trim())
      .filter(Boolean),
  };
}
