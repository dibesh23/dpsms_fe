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
  HeartHandshakeIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  TrashIcon,
} from "@/shared/components/ui/icons";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { parentApi, type ParentRecord } from "../api/parentApi";
import {
  EditParentForm,
  editValuesToPayload,
  parentStatusToLabel,
  relationToLabel,
  type EditParentValues,
} from "./EditParentForm";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

export function ParentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const parentId = params?.id;
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.PARENT_UPDATE);
  const canDelete = can(PERMISSIONS.PARENT_DELETE);

  const [parent, setParent] = useState<ParentRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!parentId) return;
    setLoadError(null);
    try {
      const record = await parentApi.get(parentId);
      setParent(record);
    } catch {
      setLoadError("We couldn't find this guardian.");
    }
  }, [parentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (values: EditParentValues): Promise<string | null> => {
    if (!parentId) return "Could not save changes. Try again.";
    try {
      const updated = await parentApi.update(parentId, editValuesToPayload(values));
      setParent(updated);
      setEditOpen(false);
      toast.success("Guardian updated successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(
        err,
        "Could not update the guardian. Check the details and try again.",
      );
    }
  };

  const handleRemove = async () => {
    if (!parentId) return;
    setRemoving(true);
    try {
      await parentApi.remove(parentId);
      toast.success("Guardian removed successfully.");
      router.push("/parents");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the guardian. Try again."));
      setRemoving(false);
      setRemoveOpen(false);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/parents"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to parents
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Guardian not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!parent) {
    return <LoadingState label="Loading guardian…" />;
  }

  const statusLabel = parentStatusToLabel(parent.status);

  return (
    <div className="space-y-4">
      <Link
        href="/parents"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to parents
      </Link>

      <PageHeader
        title={parent.name}
        description={`${relationToLabel(parent.relation)} of ${parent.students.length || "no"} student${
          parent.students.length === 1 ? "" : "s"
        }`}
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
              <Avatar name={parent.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-900">{parent.name}</p>
                <p className="text-sm text-neutral-500">{parent.email ?? "No email on file"}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={statusLabel} />
                  <span className="inline-flex items-center rounded-full border border-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {relationToLabel(parent.relation)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Phone
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <PhoneIcon className="size-4 flex-none text-neutral-400" />
                {parent.phone}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Email
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm break-all text-neutral-700">
                <MailIcon className="size-4 flex-none text-neutral-400" />
                {parent.email ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Occupation
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <BriefcaseIcon className="size-4 flex-none text-neutral-400" />
                {parent.occupation || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <HeartHandshakeIcon className="size-4 text-neutral-400" />
              Linked Students
            </h3>
            {parent.students.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No students linked yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {parent.students.map((student, index) => (
                  <li
                    key={`${student}-${index}`}
                    className="flex items-center justify-between rounded-md bg-bg-subtle px-3 py-2 text-sm"
                  >
                    <span className="truncate text-neutral-800">{student}</span>
                    {index === 0 && parent.students.length > 1 && (
                      <span className="ml-2 flex-none text-xs text-neutral-400">Primary</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {canUpdate && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Guardian"
          description={`Update ${parent.name}'s details.`}
        >
          <EditParentForm
            initial={{
              fullName: parent.name,
              relation:
                parent.relation === "FATHER" || parent.relation === "MOTHER"
                  ? parent.relation
                  : "GUARDIAN",
              phone: parent.phone,
              email: parent.email ?? "",
              occupation: parent.occupation ?? "",
              students: parent.students.join(", "),
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
          title={`Remove ${parent.name}?`}
          description="This action cannot be undone."
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              This permanently deletes the guardian account and unlinks them from all students.
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
