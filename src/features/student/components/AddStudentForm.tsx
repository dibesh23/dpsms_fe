"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import { academicApi, type ClassRecord } from "@/features/academic/api/academicApi";

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const STATUSES = ["Active", "On Leave", "Inactive"] as const;

const AddStudentSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(255),
  email: z.email("Enter a valid email address"),
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
  grade: z.string().min(1, "Select a grade"),
  section: z
    .string()
    .trim()
    .max(20, "Section must be at most 20 characters")
    .optional()
    .or(z.literal("")),
  status: z.enum(STATUSES),
  enrolledAt: z.string().min(1, "Enrollment date is required"),
});

export type AddStudentValues = z.infer<typeof AddStudentSchema>;

export function AddStudentForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: AddStudentValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    academicApi
      .listClasses()
      .then((records) => {
        if (!cancelled) setClasses(records);
      })
      .catch(() => {
        if (!cancelled) setClasses([]);
      })
      .finally(() => {
        if (!cancelled) setClassesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddStudentValues>({
    resolver: zodResolver(AddStudentSchema),
    defaultValues: {
      status: "Active",
      enrolledAt: new Date().toISOString().slice(0, 10),
    },
  });

  const selectedGrade = watch("grade");
  const availableSections =
    classes.find((cls) => cls.name === selectedGrade)?.sections ?? [];

  const onSubmit = async (values: AddStudentValues) => {
    setApiError(null);
    const error = await onAdd(values);
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
            required
            error={errors.fullName?.message}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} className="sm:col-span-2" required>
          <Input
            type="email"
            autoComplete="email"
            placeholder="student@pathshala.edu.np"
            disabled={isSubmitting}
            required
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

        <Field label="Grade" error={errors.grade?.message} required>
          <Select
            disabled={isSubmitting || classesLoading}
            required
            {...register("grade", {
              onChange: () => setValue("section", ""),
            })}
          >
            <option value="">
              {classesLoading ? "Loading grades…" : "Select grade"}
            </option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                {cls.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Section"
          error={errors.section?.message}
          hint={
            selectedGrade && availableSections.length === 0
              ? "No sections created for this grade"
              : undefined
          }
        >
          <Select disabled={isSubmitting} {...register("section")}>
            <option value="">
              {selectedGrade && availableSections.length === 0
                ? "No sections available"
                : "Select section"}
            </option>
            {availableSections.map((section) => (
              <option key={section} value={section}>
                {section}
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

        <Field label="Enrollment date" error={errors.enrolledAt?.message} required>
          <Input
            type="date"
            disabled={isSubmitting}
            required
            error={errors.enrolledAt?.message}
            {...register("enrolledAt")}
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
          text={isSubmitting ? "Adding…" : "Add Student"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
