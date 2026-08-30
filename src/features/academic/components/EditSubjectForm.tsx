"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";

const EditSubjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(100),
  code: z.string().trim().max(20).optional(),
  type: z.enum(["COMPULSORY", "ELECTIVE"]),
  department: z.string().trim().max(100).optional(),
});

export type EditSubjectValues = z.infer<typeof EditSubjectSchema>;

export interface EditableSubject {
  id: string;
  name: string;
  code: string;
  type: "COMPULSORY" | "ELECTIVE";
  department: string;
}

export function EditSubjectForm({
  subject,
  departments,
  onUpdate,
  onClose,
}: {
  subject: EditableSubject;
  departments: string[];
  onUpdate: (values: EditSubjectValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditSubjectValues>({
    resolver: zodResolver(EditSubjectSchema),
    defaultValues: {
      name: subject.name,
      code: subject.code,
      type: subject.type,
      department: subject.department,
    },
  });

  const onSubmit = async (values: EditSubjectValues) => {
    setApiError(null);
    const error = await onUpdate({
      ...values,
      // "" clears the department on the backend; undefined would keep it.
      department: values.department ?? "",
    });
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Subject name" error={errors.name?.message} required>
        <Input
          type="text"
          placeholder="Mathematics"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
        />
      </Field>

      <Field label="Code" error={errors.code?.message} hint="Optional short code, e.g. MATH">
        <Input
          type="text"
          placeholder="MATH"
          disabled={isSubmitting}
          error={errors.code?.message}
          {...register("code")}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type" error={errors.type?.message} required>
          <Select disabled={isSubmitting} {...register("type")}>
            <option value="COMPULSORY">Compulsory</option>
            <option value="ELECTIVE">Elective</option>
          </Select>
        </Field>

        <Field
          label="Department"
          error={errors.department?.message}
          hint="Select an existing department or leave as “None” to clear it"
        >
          <Select
            disabled={isSubmitting}
            {...register("department")}
            defaultValue={subject.department ?? ""}
          >
            <option value="">— None —</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
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
          text={isSubmitting ? "Saving…" : "Save Changes"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
