"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

const GRADES = [
  "Grade 6 A",
  "Grade 6 B",
  "Grade 7 A",
  "Grade 7 B",
  "Grade 8 A",
  "Grade 8 B",
  "Grade 9 A",
  "Grade 9 B",
  "Grade 10 A",
  "Grade 10 B",
  "Grade 11 Science",
  "Grade 11 Management",
];

const STATUSES = ["Active", "On Leave", "Inactive"] as const;

const AddStudentSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Enter a valid email address"),
  grade: z.string().min(1, "Select a grade"),
  status: z.enum(STATUSES),
  enrolledAt: z.string().min(1, "Enrollment date is required"),
});

export type AddStudentValues = z.infer<typeof AddStudentSchema>;

export function AddStudentForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: AddStudentValues) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentValues>({
    resolver: zodResolver(AddStudentSchema),
    defaultValues: {
      status: "Active",
      enrolledAt: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (values: AddStudentValues) => {
    setApiError(null);
    const ok = await onAdd(values);
    if (!ok) setApiError("Could not add the student. Check the details and try again.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" error={errors.fullName?.message} className="sm:col-span-2">
          <Input
            type="text"
            autoComplete="name"
            placeholder="Aarav Sharma"
            disabled={isSubmitting}
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} className="sm:col-span-2">
          <Input
            type="email"
            autoComplete="email"
            placeholder="student@pathshala.edu.np"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field label="Grade" error={errors.grade?.message}>
          <Select disabled={isSubmitting} {...register("grade")}>
            <option value="">Select grade</option>
            {GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </Select>
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

        <Field label="Enrollment date" error={errors.enrolledAt?.message} className="sm:col-span-2">
          <Input
            type="date"
            disabled={isSubmitting}
            error={errors.enrolledAt?.message}
            {...register("enrolledAt")}
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
          text={isSubmitting ? "Adding…" : "Add Student"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
