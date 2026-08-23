"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { formatDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import {
  academicApi,
  type SessionRecord as SessionRecordDto,
  type ClassRecord as ClassRecordDto,
} from "../api/academicApi";
import { LayoutGridIcon, PencilIcon } from "@/shared/components/ui/icons";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  TrashIcon,
} from "@/shared/components/ui/icons";
import { EditSessionForm, type EditSessionValues } from "./EditSessionForm";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

export function SessionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.ACADEMIC_SESSION_UPDATE);
  const canDelete = can(PERMISSIONS.ACADEMIC_SESSION_DELETE);

  const [session, setSession] = useState<SessionRecordDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [yearClasses, setYearClasses] = useState<ClassRecordDto[]>([]);
  const [activating, setActivating] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoadError(null);
    try {
      const [record, classes] = await Promise.all([
        academicApi.getSession(sessionId),
        academicApi.listClasses(sessionId).catch(() => [] as ClassRecordDto[]),
      ]);
      setSession(record);
      setYearClasses(classes);
    } catch (err) {
      setLoadError(getApiErrorMessage(err, "Could not load this academic session."));
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSetActive = async () => {
    if (!session || session.isActive) return;
    setActivating(true);
    try {
      const record = await academicApi.updateSession(session.id, { isActive: true });
      setSession(record);
      toast.success(`"${record.label}" is now the active academic year.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not set the academic year active."));
    } finally {
      setActivating(false);
    }
  };

  const handleSaveEdit = async (values: EditSessionValues): Promise<string | null> => {
    if (!sessionId) return "Could not save changes. Try again.";
    try {
      const record = await academicApi.updateSession(sessionId, {
        label: values.label,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      setSession(record);
      setEditOpen(false);
      toast.success("Academic year updated successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not update the academic year. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    setDeleteBusy(true);
    try {
      await academicApi.deleteSession(session.id);
      toast.success(`Academic year "${session.label}" removed.`);
      router.push("/academic-sessions");
    } catch (err) {
      toast.error(
        getApiErrorMessage(
          err,
          "Could not remove the academic year. It may be active or still have classes, enrollments, or exams.",
        ),
      );
      setDeleteBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/academic-sessions"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to sessions
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Academic session not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoadingState label="Loading session…" />;
  }

  const start = new Date(session.startDate);
  const end = new Date(session.endDate);
  const durationDays = Math.max(
    0,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  return (
    <div className="space-y-4">
      <Link
        href="/academic-sessions"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to sessions
      </Link>

      <PageHeader
        title={session.label}
        description={`Created ${formatDate(session.createdAt)}`}
        actions={
          <>
            {canUpdate && (
              <Button
                variant="secondary"
                text="Edit"
                icon={<PencilIcon className="size-4" />}
                className="w-auto"
                onClick={() => setEditOpen(true)}
              />
            )}
            {canUpdate && !session.isActive && (
              <Button
                variant="secondary"
                text={activating ? "Setting active…" : "Set Active"}
                icon={<CheckCircle2Icon className="size-4" />}
                className="w-auto"
                disabled={activating}
                onClick={() => void handleSetActive()}
              />
            )}
            {canDelete && !session.isActive && (
              <Button
                variant="danger-outline"
                text="Remove"
                icon={<TrashIcon className="size-4" />}
                className="w-auto"
                onClick={() => setDeleteOpen(true)}
              />
            )}
          </>
        }
      />

      <section className="rounded-lg border border-neutral-200 bg-bg-default p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 flex-none items-center justify-center rounded-lg border border-neutral-200 bg-bg-subtle text-neutral-600">
              <CalendarDaysIcon className="size-5" />
            </span>
            <div>
              <h2 className="font-medium text-neutral-900">{session.label}</h2>
              <p className="text-xs text-neutral-400">Academic year</p>
            </div>
          </div>
          <StatusBadge status={session.isActive ? "Active" : "Upcoming"} />
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-neutral-100 pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-neutral-400">Start date</dt>
            <dd className="mt-0.5 font-medium text-neutral-800">{formatDate(session.startDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">End date</dt>
            <dd className="mt-0.5 font-medium text-neutral-800">{formatDate(session.endDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-neutral-400">Duration</dt>
            <dd className="mt-0.5 font-medium text-neutral-800">
              {durationDays.toLocaleString()} days
            </dd>
          </div>
        </dl>
      </section>

      {/* Classes in this academic year */}
      <section className="rounded-lg border border-neutral-200 bg-bg-default">
        <header className="border-b border-neutral-100 px-5 py-4">
          <h2 className="font-medium text-neutral-900">Classes</h2>
          <p className="text-xs text-neutral-400">{yearClasses.length} in this academic year</p>
        </header>
        {yearClasses.length === 0 ? (
          <EmptyState
            title="No classes yet"
            description="Classes created for this academic year will appear here."
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {yearClasses.map((yearClass) => (
              <li key={yearClass.id}>
                <Link
                  href={`/classes/${yearClass.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-bg-subtle"
                >
                  <span className="flex size-8 flex-none items-center justify-center rounded-md border border-neutral-200 bg-bg-subtle text-neutral-500">
                    <LayoutGridIcon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {yearClass.name}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {yearClass.sections.map((s) => `Sec ${s}`).join(" · ") || "No sections"}
                    </p>
                  </div>
                  <span className="flex-none text-sm font-medium text-neutral-700">
                    {yearClass.students} student{yearClass.students === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!session.isActive && (
        <p
          className={cn(
            "rounded-md border border-neutral-200 bg-bg-subtle px-3 py-2 text-xs text-neutral-500",
          )}
        >
          Only the active academic year can receive enrollments and exams. Sessions that are active
          or already contain classes, enrollments, or exams cannot be removed.
        </p>
      )}

      {canUpdate && editOpen && (
        <Dialog
          open
          onClose={() => setEditOpen(false)}
          title="Edit Academic Year"
          description={`Update "${session.label}".`}
        >
          <EditSessionForm
            initial={{
              label: session.label,
              startDate: session.startDate.slice(0, 10),
              endDate: session.endDate.slice(0, 10),
            }}
            onSave={handleSaveEdit}
            onClose={() => setEditOpen(false)}
          />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title="Remove Academic Year"
          description={`This will remove "${session.label}". This action cannot be undone.`}
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              The backend rejects removal while this year is active or has classes, enrollments, or
              exams attached.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setDeleteOpen(false)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={deleteBusy ? "Removing…" : "Remove Session"}
                loading={deleteBusy}
                disabled={deleteBusy}
                className="w-auto"
                onClick={() => void handleDelete()}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
