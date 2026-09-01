"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";

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
  onCreate: (values: { subjectIds: string[]; isElectiveGroup: boolean }) => Promise<string | null>;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isElectiveGroup, setIsElectiveGroup] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allSelected = subjects.length > 0 && selectedIds.length === subjects.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggle = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds((current) => (current.length === subjects.length ? [] : subjects.map((s) => s.id)));
  };

  const onSubmit = async () => {
    if (selectedIds.length === 0) return;
    setApiError(null);
    setSubmitting(true);
    const error = await onCreate({ subjectIds: selectedIds, isElectiveGroup });
    setSubmitting(false);
    if (error) setApiError(error);
  };

  return (
    <div className="space-y-4">
      {subjects.length === 0 ? (
        <p className="text-sm text-neutral-500">Every subject is already mapped to this class.</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-700">Subjects</span>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-medium text-neutral-600 underline-offset-2 hover:underline"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-neutral-200 p-2">
            {subjects.map((subject) => {
              const checked = selectedIds.includes(subject.id);
              return (
                <label
                  key={subject.id}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 transition-colors ${
                    checked ? "bg-bg-subtle" : "hover:bg-bg-subtle/60"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(subject.id)}
                    className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-800">
                    {subject.name}
                  </span>
                  {subject.code && (
                    <span className="flex-none text-xs text-neutral-400">{subject.code}</span>
                  )}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-neutral-500">
            {selectedIds.length === 0
              ? "Select one or more subjects to map."
              : `${selectedIds.length} subject${selectedIds.length === 1 ? "" : "s"} selected.`}
          </p>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={isElectiveGroup}
              onChange={(event) => setIsElectiveGroup(event.target.checked)}
              className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
            />
            Mark selected as elective group
          </label>
        </>
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
          text={submitting ? "Adding…" : "Add Selected"}
          loading={submitting}
          disabled={submitting || selectedIds.length === 0}
          className="w-auto"
          onClick={() => void onSubmit()}
        />
      </div>
    </div>
  );
}
