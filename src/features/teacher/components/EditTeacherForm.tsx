"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import { academicApi } from "@/features/academic/api/academicApi";
import { TEACHER_STATUS_LABELS, teacherLabelToStatus, type TeacherStatusLabel } from "../utils";

const EditTeacherSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.email("Enter a valid email address"),
  phone: z.string().max(20, "Phone number is too long"),
  department: z.string().trim().max(100, "Department name is too long"),
  classesPerWeek: z
    .string()
    .min(1, "Classes per week is required")
    .refine(
      (value) => Number.isInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 40,
      "Enter a whole number between 0 and 40",
    ),
  status: z.enum(TEACHER_STATUS_LABELS),
});

export interface EditTeacherValues {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  classesPerWeek: string;
  status: TeacherStatusLabel;
}

export function EditTeacherForm({
  initial,
  onSave,
  onClose,
}: {
  initial: EditTeacherValues;
  onSave: (values: EditTeacherValues) => Promise<string | null>;
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

  // Keep the teacher's current department in the list even if it was never
  // created through the Departments page, so the value is never lost.
  const departmentOptions = [initial.department, ...departments]
    .filter(Boolean)
    .filter((name, index, arr) => arr.indexOf(name) === index);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditTeacherValues>({
    resolver: zodResolver(EditTeacherSchema),
    defaultValues: initial,
  });

  const onSubmit = async (values: EditTeacherValues) => {
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

        <Field label="Email" error={errors.email?.message} className="sm:col-span-2" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="teacher@pathshala.edu.np"
            disabled={isSubmitting}
            error={errors.email?.message}
            {...register("email")}
          />
        </Field>

        <Field
          label="Department"
          error={errors.department?.message}
          hint={
            departments.length === 0
              ? "No departments exist yet. Create one in Departments first."
              : undefined
          }
        >
          <Select disabled={isSubmitting} {...register("department")}>
            <option value="">No department</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </Select>
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
            {TEACHER_STATUS_LABELS.map((status) => (
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

export function editValuesToPayload(values: EditTeacherValues) {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    // "" clears the phone server-side; never send null (backend rejects it).
    phone: values.phone.trim() || "",
    department: values.department.trim(),
    classesPerWeek: Number(values.classesPerWeek),
    status: teacherLabelToStatus(values.status),
  };
}
