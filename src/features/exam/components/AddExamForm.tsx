"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import { examApi, type ExamTypeRecord } from "../api/examApi";
import { academicApi, type ClassRecord, type SubjectRecord } from "../../academic/api/academicApi";
import { PlusIcon, TrashIcon } from "@/shared/components/ui/icons";

export interface ExamSubjectRow {
  subjectId: string;
  fullMarksTheory: string;
  fullMarksPractical: string;
  passMarks: string;
}

export interface ExamSubjectPayload {
  subjectId: string;
  fullMarksTheory: number;
  fullMarksPractical: number;
  passMarks: number;
}

interface ExamFormValues {
  name: string;
  examTypeId: string;
  classId: string;
}

const ExamFormSchema = z.object({
  name: z.string().trim().min(1, "Exam name is required").max(100),
  examTypeId: z.string().min(1, "Choose an exam type"),
  classId: z.string().min(1, "Choose a class"),
});

export function AddExamForm({
  onAdd,
  onClose,
}: {
  onAdd: (values: ExamFormValues, subjects: ExamSubjectPayload[]) => Promise<string | null>;
  onClose: () => void;
}) {
  const [types, setTypes] = useState<ExamTypeRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [rows, setRows] = useState<ExamSubjectRow[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(ExamFormSchema),
  });

  const loadOptions = useCallback(async () => {
    const [t, c, s] = await Promise.all([
      examApi.listExamTypes(),
      academicApi.listClasses(),
      academicApi.listSubjects(),
    ]);
    setTypes(t);
    setClasses(c);
    setSubjects(s);
  }, []);

  useEffect(() => {
    loadOptions().catch(() => undefined);
  }, [loadOptions]);

  const addRow = () =>
    setRows((current) => [
      ...current,
      { subjectId: "", fullMarksTheory: "", fullMarksPractical: "0", passMarks: "" },
    ]);

  const updateRow = (index: number, patch: Partial<ExamSubjectRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const removeRow = (index: number) => setRows((current) => current.filter((_, i) => i !== index));

  const onSubmit = async (values: ExamFormValues) => {
    setApiError(null);

    const validRows = rows
      .filter((row) => row.subjectId && row.fullMarksTheory !== "")
      .map((row) => ({
        subjectId: row.subjectId,
        fullMarksTheory: Number(row.fullMarksTheory),
        fullMarksPractical: Number(row.fullMarksPractical || 0),
        passMarks: Number(row.passMarks === "" ? 0 : row.passMarks),
      }));

    if (
      validRows.some((row) => !Number.isFinite(row.fullMarksTheory) || row.fullMarksTheory <= 0)
    ) {
      setApiError("Full theory marks must be a positive number.");
      return;
    }
    if (validRows.some((row) => !Number.isFinite(row.passMarks) || row.passMarks < 0)) {
      setApiError("Pass marks must be zero or more.");
      return;
    }

    const error = await onAdd(values, validRows);
    if (error) setApiError(error);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <Field label="Exam name" error={errors.name?.message}>
        <Input
          type="text"
          placeholder="Term Test I - Grade 5"
          disabled={isSubmitting}
          error={errors.name?.message}
          {...register("name")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Exam type" error={errors.examTypeId?.message}>
          <Select disabled={isSubmitting} {...register("examTypeId")}>
            <option value="">Select a type…</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Class" error={errors.classId?.message}>
          <Select disabled={isSubmitting} {...register("classId")}>
            <option value="">Select a class…</option>
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-800">Subjects</span>
          <Button
            variant="secondary"
            text="Add subject"
            icon={<PlusIcon className="size-3.5" />}
            className="h-8 w-auto px-2 text-xs"
            onClick={addRow}
          />
        </div>

        <div className="h-[22rem] overflow-y-auto overscroll-contain pr-1">
          {rows.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-neutral-200 bg-bg-subtle px-6 text-center text-sm text-neutral-400">
              No subjects attached yet. You can add them later while the exam is a draft.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={index} className="rounded-md border border-neutral-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-500">
                      Subject {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      aria-label="Remove subject"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Subject">
                      <Select
                        value={row.subjectId}
                        onChange={(e) => updateRow(index, { subjectId: e.target.value })}
                      >
                        <option value="">Select a subject…</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Full theory marks">
                      <Input
                        type="number"
                        min={1}
                        placeholder="75"
                        value={row.fullMarksTheory}
                        onChange={(e) => updateRow(index, { fullMarksTheory: e.target.value })}
                      />
                    </Field>
                    <Field label="Full practical marks">
                      <Input
                        type="number"
                        min={0}
                        placeholder="25"
                        value={row.fullMarksPractical}
                        onChange={(e) => updateRow(index, { fullMarksPractical: e.target.value })}
                      />
                    </Field>
                    <Field label="Pass marks" hint="Of the full marks">
                      <Input
                        type="number"
                        min={0}
                        placeholder="32"
                        value={row.passMarks}
                        onChange={(e) => updateRow(index, { passMarks: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
          text={isSubmitting ? "Creating…" : "Create Exam"}
          loading={isSubmitting}
          disabled={isSubmitting}
          className="w-auto"
        />
      </div>
    </form>
  );
}

export default AddExamForm;
