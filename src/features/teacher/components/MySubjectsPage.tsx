"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/shared/components/ui/page-header";
import { SearchBar } from "@/shared/components/ui/search-bar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { BookOpenIcon } from "@/shared/components/ui/icons";
import { teacherAssignmentApi, type SubjectAssignmentRecord } from "../api/teacherAssignmentApi";

export default function MySubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectAssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      const data = await teacherAssignmentApi.listMySubjects();
      setSubjects(data);
    } catch {
      setLoadError("We couldn't load your subjects. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = new Map<string, SubjectAssignmentRecord[]>();
    for (const s of subjects) {
      const key = `${s.className} - ${s.sectionName}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [subjects]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const result = new Map<string, SubjectAssignmentRecord[]>();
    for (const [section, items] of grouped) {
      const match = items.filter(
        (s) =>
          s.subjectName.toLowerCase().includes(q) ||
          s.subjectCode?.toLowerCase().includes(q) ||
          section.toLowerCase().includes(q),
      );
      if (match.length > 0) result.set(section, match);
    }
    return result;
  }, [grouped, search]);

  if (loading) return <LoadingState label="Loading your subjects…" />;

  if (loadError) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Subjects" description="Subjects you are assigned to teach" />
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="text-sm font-medium text-neutral-600 underline-offset-4 hover:text-neutral-900 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="My Subjects"
        description="Subjects you are assigned to teach"
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon className="size-5" />}
          title="No subjects assigned"
          description="You don't have any subject assignments yet. Ask your admin to assign subjects to you."
        />
      ) : (
        <>
          <div className="flex items-center justify-end">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search subjects…"
            />
          </div>

          <div className="space-y-6">
            {[...filtered.entries()].map(([section, items]) => (
              <div key={section}>
                <h2 className="mb-3 text-sm font-semibold text-neutral-700">{section}</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-bg-default p-4"
                    >
                      <span className="flex size-9 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-500">
                        <BookOpenIcon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {subject.subjectName}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {subject.subjectCode || "No code"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
