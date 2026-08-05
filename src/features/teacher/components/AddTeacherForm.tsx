"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Nepali",
  "Social Studies",
  "Computer Science",
  "Physical Education",
  "Accountancy",
];

const DEPARTMENTS = ["Science & Math", "Languages", "Humanities", "Commerce", "Sports"];

const STATUSES = ["Active", "On Leave", "Invited"] as const;

const AddTeacherSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(1, "Select a subject"),
  department: z.string().min(1, "Select a department"),
  phone: z.string().min(7, "Enter a valid phone number"),
  classesPerWeek: z.string().min(1, "Classes per week is required"),
  status: z.enum(STATUSES),
});

export type AddTeacherValues = z.infer<typeof AddTeacherSchema>;

export function AddTeacherForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: AddTeacherValues) => void;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddTeacherValues>({
    resolver: zodResolver(AddTeacherSchema),
    defaultValues: { status: "Active", classesPerWeek: "20" },
  });

  const onSubmit = async (values: AddTeacherValues) => {
    setApiError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onAdd(values);
    } catch {
      setApiError("Could not add the teacher. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
          <Input
            type="text"
            autoComplete="name"
            placeholder="Sunita K.C."
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} className="sm:col-span-2">
          <Input
            type="email"
            autoComplete="email"
            placeholder="teacher@pathshala.edu.np"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field label="Subject" error={errors.subject?.message}>
          <Select disabled={isSubmitting} {...register("subject")}>
            <option value="">Select subject</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
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

        <Field label="Phone" error={errors.phone?.message}>
          <Input
            type="tel"
            placeholder="9841-000000"
            disabled={isSubmitting}
            error={errors.phone?.message}
            {...register("phone")}
          />
        </Field>

        <Field label="Classes / week" error={errors.classesPerWeek?.message}>
          <Input
            type="number"
            min={0}
            max={40}
            disabled={isSubmitting}
            error={errors.classesPerWeek?.message}
            {...register("classesPerWeek")}
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
          text={isSubmitting ? "Adding…" : "Invite Teacher"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
