"use client";

import { useEffect, useState } from "react";
import {
  academicApi,
  type ClassRecord,
  type SectionRecord,
} from "@/features/academic/api/academicApi";
import type { NoticeRecipientScope } from "../api/noticeApi";
import { audienceLabel } from "../api/noticeApi";

export function RecipientScopeEditor({
  value,
  onChange,
}: {
  value: NoticeRecipientScope[];
  onChange: (scopes: NoticeRecipientScope[]) => void;
}) {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);

  const roleTargets = value.map((s) => s.roleTarget).filter(Boolean);
  const hasAll = roleTargets.includes("ALL");
  const hasTeacher = roleTargets.includes("TEACHER");
  const hasStudent = roleTargets.includes("STUDENT");

  const selectedClassId = value.find((s) => s.classId)?.classId ?? "";
  const selectedSectionId = value.find((s) => s.sectionId)?.sectionId ?? "";

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      setLoadingClasses(true);
      academicApi
        .listClasses()
        .then((items) => {
          if (!cancelled) {
            setClasses(items);
            setLoadingClasses(false);
          }
        })
        .catch(() => {
          if (!cancelled) setLoadingClasses(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!selectedClassId) {
        setSections([]);
        return;
      }
      academicApi
        .listSections(selectedClassId)
        .then((items) => {
          if (!cancelled) setSections(items);
        })
        .catch(() => {
          if (!cancelled) setSections([]);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [selectedClassId]);

  const updateRole = (role: string, checked: boolean) => {
    let next: NoticeRecipientScope[];
    if (role === "ALL" && checked) {
      next = [{ id: "", roleTarget: "ALL", classId: "", sectionId: "" }];
    } else if (checked) {
      next = [
        ...value.filter((s) => s.roleTarget !== "ALL"),
        { id: "", roleTarget: role, classId: "", sectionId: "" },
      ];
    } else {
      next = value.filter((s) => s.roleTarget !== role);
    }
    onChange(next);
  };

  const updateClass = (classId: string) => {
    if (!classId) {
      onChange(value.map((s) => ({ ...s, classId: "", sectionId: "" })));
    } else {
      onChange(value.map((s) => ({ ...s, classId, sectionId: "" })));
    }
  };

  const updateSection = (sectionId: string) => {
    onChange(value.map((s) => ({ ...s, sectionId: sectionId })));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-neutral-700">Visible to</p>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={hasAll}
            onChange={(e) => updateRole("ALL", e.target.checked)}
            className="size-4 rounded border-neutral-300 accent-neutral-900"
          />
          Everyone
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={hasTeacher}
            onChange={(e) => updateRole("TEACHER", e.target.checked)}
            disabled={hasAll}
            className="size-4 rounded border-neutral-300 accent-neutral-900"
          />
          Teachers
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={hasStudent}
            onChange={(e) => updateRole("STUDENT", e.target.checked)}
            disabled={hasAll}
            className="size-4 rounded border-neutral-300 accent-neutral-900"
          />
          Students
        </label>
      </div>

      {hasStudent && !hasAll && (
        <div className="flex flex-wrap gap-3">
          <div className="min-w-0 sm:min-w-[160px]">
            <label className="mb-1 block text-xs text-neutral-500">Class (optional)</label>
            <select
              value={selectedClassId}
              onChange={(e) => updateClass(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 sm:min-h-9 sm:py-1.5"
            >
              <option value="">{loadingClasses ? "Loading…" : "All classes"}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {selectedClassId && sections.length > 0 && (
            <div className="min-w-0 sm:min-w-[160px]">
              <label className="mb-1 block text-xs text-neutral-500">Section (optional)</label>
              <select
                value={selectedSectionId}
                onChange={(e) => updateSection(e.target.value)}
                className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 sm:min-h-9 sm:py-1.5"
              >
                <option value="">All sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AudienceBadge({ scopes }: { scopes: NoticeRecipientScope[] }) {
  const label = audienceLabel(scopes);
  if (label === "Everyone") return null;
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      {label}
    </span>
  );
}
