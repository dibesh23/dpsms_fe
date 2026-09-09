"use client";

import { useEffect, useState } from "react";
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
} from "@/features/academic/api/academicApi";

const TransferSchema = z.object({
  classId: z.string().min(1, "Select a class"),
  sectionId: z.string().min(1, "Select a section"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  reason: z.string().trim().max(255, "Reason must be at most 255 characters").optional(),
});

export type TransferValues = z.infer<typeof TransferSchema>;

export function TransferStudentForm({
  currentClassId,
  currentClassName,
  currentSectionName,
  onSave,
  onClose,
}: {
  currentClassId: string | null;
  currentClassName: string;
  currentSectionName: string;
  onSave: (values: TransferValues) => Promise<string | null>;
  onClose: () => void;
}) {
  const [apiError, setApiError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransferValues>({
    resolver: zodResolver(TransferSchema),
    defaultValues: {
      classId: currentClassId ?? "",
      effectiveDate: new Date().toISOString().slice(0, 10),
    },
  });

  useEffect(() => {
    let cancelled = false;
    academicApi
      .listClasses()
      .then((records) => {
        if (!cancelled) setClasses(records);
      })
      .catch(() => {
        if (!cancelled) setClasses([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedClassId = watch("classId");

  useEffect(() => {
    if (!selectedClassId) {
      setSections([]);
      return;
    }
    let cancelled = false;
    setSectionsLoading(true);
    academicApi
      .listSections(selectedClassId)
      .then((records) => {
        if (!cancelled) setSections(records);
      })
      .catch(() => {
        if (!cancelled) setSections([]);
      })
      .finally(() => {
        if (!cancelled) setSectionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedClassId]);

  const onSubmit = async (values: TransferValues) => {
    setApiError(null);
    const error = await onSave(values);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="rounded-md bg-bg-subtle px-3 py-2 text-sm text-neutral-600">
        Currently in <span className="font-medium text-neutral-900">{currentClassName}</span>
        {currentSectionName && (
          <>
            {" · Section "}
            <span className="font-medium text-neutral-900">{currentSectionName}</span>
          </>
        )}
        . Transfers are only possible within the same academic year.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Target class" error={errors.classId?.message} required>
          <Select
            disabled={isSubmitting}
            required
            {...register("classId", {
              onChange: () => setValue("sectionId", ""),
            })}
          >
            <option value="">Select class</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Target section"
          error={errors.sectionId?.message}
          hint={
            !selectedClassId
              ? "Select a class to see its sections"
              : sectionsLoading
                ? "Loading sections…"
                : sections.length === 0
                  ? "No sections created for this class"
                  : `${sections.length} section${sections.length === 1 ? "" : "s"} available`
          }
          required
        >
          <Select
            disabled={isSubmitting || !selectedClassId || sectionsLoading}
            required
            {...register("sectionId")}
          >
            <option value="">{sectionsLoading ? "Loading sections…" : "Select section"}</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Effective date" error={errors.effectiveDate?.message} required>
          <Input
            type="date"
            disabled={isSubmitting}
            required
            error={errors.effectiveDate?.message}
            {...register("effectiveDate")}
          />
        </Field>

        <Field label="Reason" error={errors.reason?.message}>
          <Input
            type="text"
            placeholder="Section balancing, request by guardian…"
            disabled={isSubmitting}
            error={errors.reason?.message}
            {...register("reason")}
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
          text={isSubmitting ? "Transferring…" : "Transfer Student"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}
