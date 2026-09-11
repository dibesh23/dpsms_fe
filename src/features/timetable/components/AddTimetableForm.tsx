"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import {
  academicApi,
  type ClassRecord,
  type SectionRecord,
  type SessionRecord,
} from "@/features/academic/api/academicApi";

const AddTimetableSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  academicYearId: z.string().min(1, "Academic year is required"),
});

type AddTimetableValues = z.infer<typeof AddTimetableSchema>;

export function AddTimetableForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: { classId: string; academicYearId: string; name: string }) => Promise<boolean>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<AddTimetableValues>({
    resolver: zodResolver(AddTimetableSchema),
  });

  const selectedClassId = watch("classId");

  useEffect(() => {
    void Promise.all([academicApi.listClasses(), academicApi.listSessions()]).then(([c, s]) => {
      setClasses(c);
      setSessions(s);
    });
  }, []);

  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      return;
    }
    setSections([]);
    resetField("sectionId");
    void academicApi.listSections(selectedClassId).then(setSections);
  }, [selectedClassId, resetField]);

  const onSubmit = async (values: AddTimetableValues) => {
    setApiError(null);
    const ok = await onAdd({
      name: values.name,
      classId: values.sectionId,
      academicYearId: values.academicYearId,
    });
    if (!ok) setApiError("Could not create the timetable. Check the details and try again.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Timetable name" error={errors.name?.message}>
        <Input
          type="text"
          placeholder="e.g. Grade 10 Section A - 2026"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
        />
      </Field>

      <Field label="Class" error={errors.classId?.message}>
        <Select disabled={isSubmitting} {...register("classId")}>
          <option value="">Select a class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.academicYearLabel})
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Section" error={errors.sectionId?.message}>
        <Select disabled={isSubmitting || !selectedClassId} {...register("sectionId")}>
          <option value="">{selectedClassId ? "Select a section" : "Select a class first"}</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Academic Year" error={errors.academicYearId?.message}>
        <Select disabled={isSubmitting} {...register("academicYearId")}>
          <option value="">Select academic year</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} {s.isActive ? "(Active)" : ""}
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
          text={isSubmitting ? "Creating..." : "Create Timetable"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
