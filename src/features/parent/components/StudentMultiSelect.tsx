"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Field, Select } from "@/shared/components/ui/form-field";
import { CheckIcon, PlusIcon, XIcon } from "@/shared/components/ui/icons";
import { studentApi, type StudentRecord } from "@/features/student/api/studentApi";

function compareNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true });
}

export function StudentMultiSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
}) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

  useEffect(() => {
    let active = true;
    studentApi
      .list()
      .then((records) => {
        if (active) setStudents(records.sort((a, b) => compareNames(a.name, b.name)));
      })
      .catch(() => {
        if (active) setStudents([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const classes = useMemo(
    () => [...new Set(students.map((s) => s.grade))].sort((a, b) => compareNames(a, b)),
    [students],
  );

  const sections = useMemo(() => {
    const inClass = classFilter ? students.filter((s) => s.grade === classFilter) : students;
    return [...new Set(inClass.map((s) => s.section).filter(Boolean))].sort((a, b) =>
      compareNames(a, b),
    );
  }, [students, classFilter]);

  const visible = useMemo(() => {
    let list = students;
    if (classFilter) list = list.filter((s) => s.grade === classFilter);
    if (sectionFilter) list = list.filter((s) => s.section === sectionFilter);
    return list;
  }, [students, classFilter, sectionFilter]);

  const toggle = (name: string) => {
    const next = value.includes(name) ? value.filter((n) => n !== name) : [...value, name];
    onChange(next);
  };

  const handleClassChange = (next: string) => {
    setClassFilter(next);
    setSectionFilter("");
  };

  return (
    <div className="space-y-3">
      {students.length === 0 ? (
        <p className="text-sm text-neutral-400">
          No students found yet. Add students to link a guardian to them.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Class">
              <Select
                value={classFilter}
                disabled={disabled}
                onChange={(event) => handleClassChange(event.target.value)}
              >
                <option value="">All classes</option>
                {classes.map((grade) => (
                  <option key={grade} value={grade}>
                    Class {grade}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Section">
              <Select
                value={sectionFilter}
                disabled={disabled || sections.length === 0}
                onChange={(event) => setSectionFilter(event.target.value)}
              >
                <option value="">All sections</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="flex max-h-56 flex-col overflow-y-auto rounded-md border border-neutral-200">
            {visible.length === 0 ? (
              <p className="px-3 py-2 text-sm text-neutral-400">No students in this filter.</p>
            ) : (
              visible.map((student) => {
                const isSelected = value.includes(student.name);
                return (
                  <button
                    key={student.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(student.name)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-bg-subtle",
                      isSelected && "bg-bg-subtle",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-neutral-800">
                        {student.name}
                      </span>
                      <span className="block text-xs text-neutral-400">
                        Adm. {student.admissionNumber} · Class {student.grade}
                        {student.section ? `-${student.section}` : ""}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex size-5 flex-none items-center justify-center rounded-full border",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-neutral-300 text-neutral-300",
                      )}
                    >
                      {isSelected ? (
                        <CheckIcon className="size-3" />
                      ) : (
                        <PlusIcon className="size-3" />
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-neutral-500">{value.length} selected</span>
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-bg-subtle px-2 py-1 text-sm text-neutral-700"
            >
              {name}
              <button
                type="button"
                onClick={() => onChange(value.filter((n) => n !== name))}
                aria-label={`Remove ${name}`}
                className="text-neutral-400 transition-colors hover:text-neutral-800"
              >
                <XIcon className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentMultiSelect;
