"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import { academicApi } from "@/features/academic/api/academicApi";

const ROLES = [
  "Accountant",
  "Office Manager",
  "Librarian",
  "Lab Assistant",
  "IT Support",
  "Groundskeeper",
  "Admin Officer",
  "Transport Coordinator",
];

export const STAFF_STATUS_LABELS = ["Active", "On Leave", "Resigned"] as const;
export type StaffStatusLabel = (typeof STAFF_STATUS_LABELS)[number];

export function staffStatusToLabel(status: string): StaffStatusLabel {
  if (status === "RESIGNED") return "Resigned";
  return status === "ON_LEAVE" ? "On Leave" : "Active";
}

export function staffLabelToStatus(label: StaffStatusLabel): "ACTIVE" | "ON_LEAVE" | "RESIGNED" {
  return label === "Resigned" ? "RESIGNED" : label === "On Leave" ? "ON_LEAVE" : "ACTIVE";
}

function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export { toDateInputValue };

const EditStaffSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.email("Enter a valid email address"),
  role: z.string().min(1, "Select a role").max(100, "Role is too long"),
  department: z.string().min(1, "Select a department"),
  phone: z.string().trim().max(20, "Phone number is too long"),
  joinedAt: z.string().min(1, "Join date is required"),
  status: z.enum(STAFF_STATUS_LABELS),
});

export interface EditStaffValues {
  fullName: string;
  email: string;
  role: string;
  department: string;
  phone: string;
  joinedAt: string;
  status: StaffStatusLabel;
}

export function EditStaffForm({
  initial,
  onSave,
  onClose,
}: {
  initial: EditStaffValues;
  onSave: (values: EditStaffValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    academicApi
      .listDepartments()
      .then((records) => {
        if (active) setDepartments(records.map((d) => d.name).sort());
      })
      .catch(() => {
        if (active) setDepartments([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditStaffValues>({
    resolver: zodResolver(EditStaffSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: EditStaffValues) => {
    setApiError(null);
    const error = await onSave(values);
    if (error) setApiError(error);
  };

  const departmentOptions = [initial.department, ...departments]
    .filter(Boolean)
    .filter((name, index, arr) => arr.indexOf(name) === index);

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
            placeholder="Hari Sharma"
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} className="sm:col-span-2" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="staff@pathshala.edu.np"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field label="Role" error={errors.role?.message} required>
          <Select disabled={isSubmitting} {...register("role")}>
            {[...new Set([initial.role, ...ROLES])].filter(Boolean).map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Department"
          error={errors.department?.message}
          required
          hint={
            departments.length === 0
              ? "No departments exist yet. Create one in Departments first."
              : undefined
          }
        >
          <Select
            disabled={isSubmitting || departmentOptions.length === 0}
            {...register("department")}
          >
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Phone" error={errors.phone?.message} hint="Leave empty to remove">
          <Input
            type="tel"
            autoComplete="tel"
            placeholder="9841-000000"
            disabled={isSubmitting}
            error={errors.phone?.message}
            {...register("phone")}
          />
        </Field>

        <Field label="Joined on" error={errors.joinedAt?.message} required>
          <Input
            type="date"
            disabled={isSubmitting}
            error={errors.joinedAt?.message}
            {...register("joinedAt")}
          />
        </Field>

        <Field label="Status" error={errors.status?.message}>
          <Select disabled={isSubmitting} {...register("status")}>
            {STAFF_STATUS_LABELS.map((status) => (
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

export function editValuesToPayload(values: EditStaffValues) {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    role: values.role.trim(),
    department: values.department.trim(),

    phone: values.phone.trim() || "",
    ...(values.joinedAt ? { joinedAt: values.joinedAt } : {}),
    status: staffLabelToStatus(values.status),
  };
}
