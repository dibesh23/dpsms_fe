"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

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

const DEPARTMENTS = ["Administration", "Library", "Science & Math", "Facilities", "Transport"];

const STATUSES = ["Active", "On Leave", "Resigned"] as const;

const AddStaffSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Enter a valid email address"),
  role: z.string().min(1, "Select a role"),
  department: z.string().min(1, "Select a department"),
  joinedAt: z.string().min(1, "Join date is required"),
  status: z.enum(STATUSES),
});

export type AddStaffValues = z.infer<typeof AddStaffSchema>;

export function AddStaffForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: AddStaffValues) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddStaffValues>({
    resolver: zodResolver(AddStaffSchema),
    defaultValues: {
      status: "Active",
      joinedAt: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (values: AddStaffValues) => {
    setApiError(null);
    const ok = await onAdd(values);
    if (!ok) setApiError("Could not add the staff member. Check the details and try again.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
          <Input
            type="text"
            autoComplete="name"
            placeholder="Rita Kunwar"
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} className="sm:col-span-2">
          <Input
            type="email"
            autoComplete="email"
            placeholder="staff@pathshala.edu.np"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field label="Role" error={errors.role?.message}>
          <Select disabled={isSubmitting} {...register("role")}>
            <option value="">Select role</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Department" error={errors.department?.message}>
          <Select disabled={isSubmitting} {...register("department")}>
            <option value="">Select department</option>
            {DEPARTMENTS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Join date" error={errors.joinedAt?.message}>
          <Input
            type="date"
            disabled={isSubmitting}
            error={errors.joinedAt?.message}
            {...register("joinedAt")}
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
          text={isSubmitting ? "Adding…" : "Add Staff"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
