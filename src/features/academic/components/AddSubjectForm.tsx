"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import { academicApi } from "../api/academicApi";

const TYPES = ["COMPULSORY", "ELECTIVE"] as const;

const AddSubjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),
  code: z.string().max(20).optional(),
  type: z.enum(TYPES),
  department: z.string().max(100).optional(),
});

export type AddSubjectValues = z.infer<typeof AddSubjectSchema>;

export function AddSubjectForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: AddSubjectValues) => Promise<boolean>;
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
  } = useForm<AddSubjectValues>({
    resolver: zodResolver(AddSubjectSchema),
    defaultValues: { type: "COMPULSORY" },
  });

  const onSubmit = async (values: AddSubjectValues) => {
    setApiError(null);
    const ok = await onAdd(values);
    if (!ok) setApiError("Could not add the subject. Check the details and try again.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Subject name" error={errors.name?.message}>
        <Input
          type="text"
          placeholder="Mathematics"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
        />
      </Field>

      <Field label="Code" error={errors.code?.message} hint="e.g. MATH-101">
        <Input
          type="text"
          placeholder="MATH-101"
          disabled={isSubmitting}
          error={errors.code?.message}
          {...register("code")}
        />
      </Field>

      <Field
        label="Department"
        error={errors.department?.message}
        hint={
          departments.length === 0
            ? "No departments exist yet. Create one in Departments first."
            : "Select an existing department"
        }
      >
        <Select
          disabled={isSubmitting || departments.length === 0}
          {...register("department")}
          defaultValue=""
        >
          <option value="">— None —</option>
          {departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Type" error={errors.type?.message}>
        <Select disabled={isSubmitting} {...register("type")}>
          {TYPES.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
      </Field>

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
          text={isSubmitting ? "Adding…" : "Add Subject"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
