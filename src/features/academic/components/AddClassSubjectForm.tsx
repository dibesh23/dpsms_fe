"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Field, Select } from "@/shared/components/ui/form-field";

const AddClassSubjectSchema = z.object({
  subjectId: z.string().min(1, "Choose a subject to add"),
});

export type AddClassSubjectValues = z.infer<typeof AddClassSubjectSchema>;

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export function AddClassSubjectForm({
  subjects,
  onCreate,
  onClose,
}: {
  subjects: SubjectOption[];
  onCreate: (values: { subjectId: string; isElectiveGroup: boolean }) => Promise<string | null>;
  onClose: () => void;
}) {
  const [isElectiveGroup, setIsElectiveGroup] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddClassSubjectValues>({
    resolver: zodResolver(AddClassSubjectSchema),
    defaultValues: { subjectId: "" },
  });

  const onSubmit = async (values: AddClassSubjectValues) => {
    setApiError(null);
    const error = await onCreate({
      subjectId: values.subjectId,
      isElectiveGroup,
    });
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field
        label="Subject"
        error={errors.subjectId?.message}
        hint={subjects.length === 0 ? "Every subject is already mapped to this class." : undefined}
        required
      >
        <Select disabled={isSubmitting} {...register("subjectId")}>
          <option value="">Select a subject…</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
              {subject.code ? ` (${subject.code})` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={isElectiveGroup}
          onChange={(event) => setIsElectiveGroup(event.target.checked)}
          disabled={isSubmitting}
          className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
        />
        Mark as elective group
      </label>

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
