"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Field, Select } from "@/shared/components/ui/form-field";

const SetDepartmentHeadSchema = z.object({
  head: z.string(),
});

export type SetDepartmentHeadValues = z.infer<typeof SetDepartmentHeadSchema>;

export interface DepartmentHeadOption {
  id: string;
  name: string;
  kind: "teacher" | "staff";
}

const TEACHER_PREFIX = "teacher:";
const STAFF_PREFIX = "staff:";

export function headValueToPayload(head: string): {
  headTeacherId: string | null;
  headStaffId: string | null;
} {
  if (head.startsWith(TEACHER_PREFIX)) {
    return { headTeacherId: head.slice(TEACHER_PREFIX.length), headStaffId: null };
  }
  if (head.startsWith(STAFF_PREFIX)) {
    return { headTeacherId: null, headStaffId: head.slice(STAFF_PREFIX.length) };
  }
  return { headTeacherId: null, headStaffId: null };
}

export function SetDepartmentHeadForm({
  department,
  options,
  onUpdate,
  onClose,
}: {
  department: {
    id: string;
    name: string;
    headTeacherId: string | null;
    headStaffId: string | null;
  };
  options: DepartmentHeadOption[];
  onUpdate: (values: SetDepartmentHeadValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);

  const currentHead = department.headTeacherId
    ? `${TEACHER_PREFIX}${department.headTeacherId}`
    : department.headStaffId
      ? `${STAFF_PREFIX}${department.headStaffId}`
      : "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SetDepartmentHeadValues>({
    resolver: zodResolver(SetDepartmentHeadSchema),
    defaultValues: { head: currentHead },
  });

  const teachers = options.filter((option) => option.kind === "teacher");
  const staff = options.filter((option) => option.kind === "staff");

  const onSubmit = async (values: SetDepartmentHeadValues) => {
    setApiError(null);
    const error = await onUpdate(values);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-sm text-neutral-500">
        Head of <span className="font-medium text-neutral-800">{department.name}</span>
      </p>

      <Field
        label="Department Head"
        error={errors.head?.message}
        hint="Assign a teacher or staff member who belongs to this department as its head"
      >
        <Select disabled={isSubmitting} {...register("head")}>
          <option value="">No head assigned</option>
          {teachers.length > 0 && (
            <optgroup label="Teachers">
              {teachers.map((teacher) => (
                <option key={teacher.id} value={`${TEACHER_PREFIX}${teacher.id}`}>
                  {teacher.name}
                </option>
              ))}
            </optgroup>
          )}
          {staff.length > 0 && (
            <optgroup label="Staff">
              {staff.map((member) => (
                <option key={member.id} value={`${STAFF_PREFIX}${member.id}`}>
                  {member.name}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
      </Field>

      {!isSubmitting && options.length === 0 && (
        <p className="text-sm text-neutral-500">
          No teachers or staff in this department yet. Assign members to it first.
        </p>
      )}

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
          text={isSubmitting ? "Saving…" : "Save Department Head"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
