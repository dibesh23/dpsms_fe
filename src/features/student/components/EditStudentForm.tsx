"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const STATUSES = ["Active", "On Leave", "Inactive"] as const;

const EditStudentSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.union([z.email("Enter a valid email address"), z.literal("")]).optional(),
  phone: z
    .string()
    .trim()
    .max(20, "Phone must be at most 20 characters")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).or(z.literal("")).optional(),
  dateOfBirth: z.string().optional(),
  bloodGroup: z
    .string()
    .trim()
    .max(5, "Blood group must be at most 5 characters")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(500, "Address must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(STATUSES),
  admissionDate: z.string().min(1, "Admission date is required"),
});

export type EditStudentValues = z.infer<typeof EditStudentSchema>;

export const STATUS_TO_API = {
  Active: "ACTIVE",
  "On Leave": "ON_LEAVE",
  Inactive: "INACTIVE",
} as const;

export function EditStudentForm({
  initial,
  onSave,
  onClose,
}: {
  initial: EditStudentValues;
  onSave: (values: EditStudentValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditStudentValues>({
    resolver: zodResolver(EditStudentSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: EditStudentValues) => {
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
            placeholder="Aarav Sharma"
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="student@pathshala.edu.np"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field label="Phone" error={errors.phone?.message}>
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="9841-000000"
            disabled={isSubmitting}
            error={errors.phone?.message}
            {...register("phone")}
          />
        </Field>

        <Field label="Date of birth" error={errors.dateOfBirth?.message}>
          <Input
            type="date"
            disabled={isSubmitting}
            max={new Date().toISOString().slice(0, 10)}
            error={errors.dateOfBirth?.message}
            {...register("dateOfBirth")}
          />
        </Field>

        <Field label="Gender" error={errors.gender?.message}>
          <Select disabled={isSubmitting} {...register("gender")}>
            <option value="">Select gender</option>
            {GENDERS.map((gender) => (
              <option key={gender.value} value={gender.value}>
                {gender.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Blood group" error={errors.bloodGroup?.message}>
          <Select disabled={isSubmitting} {...register("bloodGroup")}>
            <option value="">Select blood group</option>
            {BLOOD_GROUPS.map((bloodGroup) => (
              <option key={bloodGroup} value={bloodGroup}>
                {bloodGroup}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" error={errors.status?.message} required>
          <Select disabled={isSubmitting} required {...register("status")}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Admission date" error={errors.admissionDate?.message} required>
          <Input
            type="date"
            disabled={isSubmitting}
            required
            error={errors.admissionDate?.message}
            {...register("admissionDate")}
          />
        </Field>

        <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
          <Input
            type="text"
            autoComplete="street-address"
            placeholder="Baluwatar, Kathmandu"
            disabled={isSubmitting}
            error={errors.address?.message}
            {...register("address")}
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

export function editValuesToPayload(values: EditStudentValues): {
  fullName: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE";
  admissionDate: string;
  email?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
} {
  const email = values.email?.trim();
  const dateOfBirth = values.dateOfBirth;
  return {
    fullName: values.fullName.trim(),
    status: STATUS_TO_API[values.status],
    admissionDate: values.admissionDate,
    ...(email ? { email } : {}),
    phone: values.phone?.trim() || "",
    ...(values.gender ? { gender: values.gender } : {}),
    ...(dateOfBirth ? { dateOfBirth } : {}),
    bloodGroup: values.bloodGroup?.trim() || "",
    address: values.address?.trim() || "",
  };
}

export function apiStatusToLabel(status: string): (typeof STATUSES)[number] {
  if (status === "ON_LEAVE") return "On Leave";
  return status === "INACTIVE" ? "Inactive" : "Active";
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}
