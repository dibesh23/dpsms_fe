"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import type { DayOfWeek, TimetableSlotRecord } from "../api/timetableApi";
import type { SubjectRecord } from "@/features/academic/api/academicApi";

interface TeacherRecord {
  id: string;
  name: string;
}

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

const SlotSchema = z
  .object({
    dayOfWeek: z.string().min(1, "Day is required"),
    periodNumber: z.preprocess(
      (val) => (val === "" || val === undefined ? undefined : Number(val)),
      z.number().int().min(1, "Period must be at least 1"),
    ),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    isBreak: z.boolean().default(false),
    subjectId: z.string().optional(),
    teacherId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.isBreak) return data.subjectId && data.teacherId;
      return true;
    },
    { message: "Subject and teacher are required for non-break periods", path: ["subjectId"] },
  )
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.endTime > data.startTime;
    },
    { message: "End time must be after start time", path: ["endTime"] },
  );

type SlotFormValues = z.input<typeof SlotSchema>;
type SlotFormOutput = z.output<typeof SlotSchema>;

function toISOTime(hhmm: string): string {
  return `2000-01-01T${hhmm}:00.000Z`;
}

function fromISOTime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function SlotForm({
  onSave,
  onClose,
  existingSlot,
  prefillDay,
  prefillPeriod,
  subjects,
  teachers,
  existingSlots,
  currentSlotId,
}: {
  onSave: (values: {
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
    subjectId: string | null;
    teacherId: string | null;
    isBreak: boolean;
  }) => Promise<boolean>;
  onClose: () => void;
  existingSlot: TimetableSlotRecord | null;
  prefillDay: DayOfWeek | null;
  prefillPeriod: number | null;
  subjects: SubjectRecord[];
  teachers: TeacherRecord[];
  existingSlots: TimetableSlotRecord[];
  currentSlotId?: string;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const isEdit = !!existingSlot;

  const defaultDay = existingSlot?.dayOfWeek ?? prefillDay ?? "MONDAY";
  const defaultPeriod = existingSlot?.periodNumber ?? prefillPeriod ?? 1;
  const defaultStart = existingSlot ? fromISOTime(existingSlot.startTime) : "09:00";
  const defaultEnd = existingSlot ? fromISOTime(existingSlot.endTime) : "09:45";
  const defaultIsBreak = existingSlot?.isBreak ?? false;
  const defaultSubject = existingSlot?.subjectId ?? "";
  const defaultTeacher = existingSlot?.teacherId ?? "";

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SlotFormValues>({
    resolver: zodResolver(SlotSchema),
    defaultValues: {
      dayOfWeek: defaultDay,
      periodNumber: defaultPeriod,
      startTime: defaultStart,
      endTime: defaultEnd,
      isBreak: defaultIsBreak,
      subjectId: defaultSubject,
      teacherId: defaultTeacher,
    },
  });

  const isBreak = watch("isBreak");

  const getConflictError = (day: string, period: number): string | null => {
    const conflict = existingSlots.find(
      (s) => s.dayOfWeek === day && s.periodNumber === period && s.id !== currentSlotId,
    );
    if (conflict) {
      return `A period already exists for ${day} period ${period}${conflict.isBreak ? " (break)" : ` (${conflict.subjectName})`}`;
    }
    return null;
  };

  const onSubmit = async (values: SlotFormOutput) => {
    setApiError(null);

    const conflict = getConflictError(values.dayOfWeek, values.periodNumber);
    if (conflict) {
      setApiError(conflict);
      return;
    }

    const ok = await onSave({
      dayOfWeek: values.dayOfWeek as DayOfWeek,
      periodNumber: values.periodNumber,
      startTime: toISOTime(values.startTime),
      endTime: toISOTime(values.endTime),
      subjectId: values.isBreak ? null : (values.subjectId ?? null),
      teacherId: values.isBreak ? null : (values.teacherId ?? null),
      isBreak: values.isBreak,
    });
    if (!ok) setApiError("Failed to save. Check the details and try again.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Day" error={errors.dayOfWeek?.message}>
        <Select disabled={isSubmitting} {...register("dayOfWeek")}>
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </Select>
      </Field>

      <Field label="Period number" error={errors.periodNumber?.message}>
        <Input
          type="number"
          min={1}
          disabled={isSubmitting}
          error={errors.periodNumber?.message}
          {...register("periodNumber")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time" error={errors.startTime?.message}>
          <Input
            type="time"
            disabled={isSubmitting}
            error={errors.startTime?.message}
            {...register("startTime")}
          />
        </Field>
        <Field label="End time" error={errors.endTime?.message}>
          <Input
            type="time"
            disabled={isSubmitting}
            error={errors.endTime?.message}
            {...register("endTime")}
          />
        </Field>
      </div>

      <Field label="Type">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-neutral-300"
            disabled={isSubmitting}
            {...register("isBreak")}
          />
          <span>Break period (no subject/teacher)</span>
        </label>
      </Field>

      {!isBreak && (
        <>
          <Field label="Subject" error={errors.subjectId?.message}>
            <Select disabled={isSubmitting} {...register("subjectId")}>
              <option value="">Select a subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="Teacher" error={errors.teacherId?.message}>
            <Select disabled={isSubmitting} {...register("teacherId")}>
              <option value="">Select a teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </Field>
        </>
      )}

      {apiError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {apiError}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
        <Button
          text={isSubmitting ? "Saving..." : isEdit ? "Update Period" : "Add Period"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
