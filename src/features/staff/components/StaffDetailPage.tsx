"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  TrashIcon,
} from "@/shared/components/ui/icons";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { formatDate } from "@/shared/lib/format";
import { staffApi, type StaffDetailRecord } from "../api/staffApi";
import {
  EditStaffForm,
  editValuesToPayload,
  staffStatusToLabel,
  toDateInputValue,
  type EditStaffValues,
} from "./EditStaffForm";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

export function StaffDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const staffId = params?.id;
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.STAFF_UPDATE);
  const canDelete = can(PERMISSIONS.STAFF_DELETE);

  const [staff, setStaff] = useState<StaffDetailRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!staffId) return;
    setLoadError(null);
    try {
      const record = await staffApi.get(staffId);
      setStaff(record);
    } catch {
      setLoadError("We couldn't find this staff member.");
    }
  }, [staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (values: EditStaffValues): Promise<string | null> => {
    if (!staffId) return "Could not save changes. Try again.";
    try {
      const updated = await staffApi.update(staffId, editValuesToPayload(values));
      setStaff(updated);
      setEditOpen(false);
      toast.success("Staff member updated successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(
        err,
        "Could not update the staff member. Check the details and try again.",
      );
    }
  };

  const handleRemove = async () => {
    if (!staffId) return;
    setRemoving(true);
    try {
      await staffApi.remove(staffId);
      toast.success("Staff member removed successfully.");
      router.push("/staff");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the staff member. Try again."));
      setRemoving(false);
      setRemoveOpen(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to staff
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Staff member not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!staff) {
    return <LoadingState label="Loading staff member…" />;
  }

  const statusLabel = staffStatusToLabel(staff.status);

  return (
    <div className="space-y-4">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to staff
      </Link>

      <PageHeader
        title={staff.fullName}
        description={[staff.role, staff.department?.name].filter(Boolean).join(" · ")}
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
            {canDelete && (
              <Button
                variant="danger-outline"
                text="Remove"
                icon={<TrashIcon className="size-4" />}
                className="w-auto"
                onClick={() => setRemoveOpen(true)}
              />
            )}
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-bg-default p-5 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={staff.fullName} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-900">{staff.fullName}</p>
                <p className="text-sm text-neutral-500">{staff.role}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={statusLabel} />
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Email
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm break-all text-neutral-700">
                <MailIcon className="size-4 flex-none text-neutral-400" />
                {staff.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Phone
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <PhoneIcon className="size-4 flex-none text-neutral-400" />
                {staff.phone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Department
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <BriefcaseIcon className="size-4 flex-none text-neutral-400" />
                {staff.department?.name || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">Role</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <CalendarDaysIcon className="size-4 flex-none text-neutral-400" />
                {staff.role}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <h3 className="text-sm font-semibold text-neutral-900">Record</h3>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Joined</dt>
                <dd className="text-neutral-700">{formatDate(staff.joinedAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Added</dt>
                <dd className="text-neutral-700">{formatDate(staff.createdAt)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {canUpdate && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Staff Member"
          description={`Update ${staff.fullName}'s details.`}
        >
          <EditStaffForm
            initial={{
              fullName: staff.fullName,
              email: staff.email,
              role: staff.role,
              department: staff.department?.name ?? "",
              phone: staff.phone ?? "",
              joinedAt: toDateInputValue(staff.joinedAt),
              status: statusLabel,
            }}
            onSave={handleSave}
            onClose={() => setEditOpen(false)}
          />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={removeOpen}
          onClose={() => setRemoveOpen(false)}
          title={`Remove ${staff.fullName}?`}
          description="This action cannot be undone."
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              This will remove them from the staff directory. Their past records stay intact.
            </p>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button
                variant="secondary"
                text="Cancel"
                onClick={() => setRemoveOpen(false)}
                className="w-auto"
              />
              <Button
                variant="danger"
                text={removing ? "Removing…" : "Remove"}
                loading={removing}
                disabled={removing}
                className="w-auto"
                onClick={() => void handleRemove()}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
