"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Avatar } from "@/shared/components/ui/avatar";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import {
  ArrowLeftIcon,
  FileTextIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
} from "@/shared/components/ui/icons";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { formatDate } from "@/shared/lib/format";
import {
  studentApi,
  type GuardianRecord,
  type StudentDetailRecord,
  type StudentDocumentRecord,
} from "../api/studentApi";
import {
  EditStudentForm,
  apiStatusToLabel,
  editValuesToPayload,
  toDateInputValue,
  type EditStudentValues,
} from "./EditStudentForm";
import { TransferStudentForm, type TransferValues } from "./TransferStudentForm";
import { GuardianForm, type GuardianFormValues } from "./GuardianForm";

const API_ORIGIN = (process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

const RELATION_LABELS: Record<string, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StudentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const studentId = params?.id;
  const shouldOpenTransfer = searchParams.get("transfer") === "1";
  const toast = useToast();
  const { can } = useAuth();
  const canRead = can(PERMISSIONS.STUDENT_READ);
  const canUpdate = can(PERMISSIONS.STUDENT_UPDATE);
  const canDelete = can(PERMISSIONS.STUDENT_DELETE);
  const canTransfer = can(PERMISSIONS.STUDENT_TRANSFER);
  const canManageGuardians = can(PERMISSIONS.STUDENT_GUARDIAN_MANAGE);
  const canManageDocuments = can(PERMISSIONS.STUDENT_DOCUMENT_MANAGE);

  const [student, setStudent] = useState<StudentDetailRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [guardians, setGuardians] = useState<GuardianRecord[]>([]);
  const [documents, setDocuments] = useState<StudentDocumentRecord[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [guardianTarget, setGuardianTarget] = useState<
    { mode: "add" } | { mode: "edit"; guardian: GuardianRecord } | null
  >(null);
  const [guardianRemovingId, setGuardianRemovingId] = useState<string | null>(null);

  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentDeletingId, setDocumentDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoadError(null);
    try {
      const record = await studentApi.get(studentId);
      setStudent(record);
    } catch {
      setLoadError("We couldn't find this student.");
    }
  }, [studentId]);

  const loadGuardians = useCallback(async () => {
    if (!studentId) return;
    try {
      setGuardians(await studentApi.listGuardians(studentId));
    } catch {
      setGuardians([]);
    }
  }, [studentId]);

  const loadDocuments = useCallback(async () => {
    if (!studentId) return;
    try {
      setDocuments(await studentApi.listDocuments(studentId));
    } catch {
      setDocuments([]);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
    void loadGuardians();
    void loadDocuments();
  }, [load, loadGuardians, loadDocuments]);

  // Deep-link support: /students/{id}?transfer=1 opens the transfer dialog
  // directly, then cleans the query param from the URL.
  useEffect(() => {
    if (shouldOpenTransfer && canTransfer && student) {
      setTransferOpen(true);
      router.replace(`/students/${studentId}`);
    }
  }, [shouldOpenTransfer, canTransfer, student, router, studentId]);

  // ---------- Profile ----------
  const handleSave = async (values: EditStudentValues): Promise<string | null> => {
    if (!studentId) return "Could not save changes. Try again.";
    try {
      const updated = await studentApi.update(studentId, editValuesToPayload(values));
      setStudent(updated);
      setEditOpen(false);
      toast.success("Student updated successfully.");
      return null;
    } catch (err) {
      return getApiErrorMessage(
        err,
        "Could not update the student. Check the details and try again.",
      );
    }
  };

  const handleTransfer = async (values: TransferValues): Promise<string | null> => {
    if (!studentId) return "Could not transfer the student. Try again.";
    try {
      const result = await studentApi.transfer(studentId, values);
      setTransferOpen(false);
      toast.success(
        `Transferred from ${result.fromClassName} ${result.fromSectionName} to ${result.toClassName} ${result.toSectionName}.`,
      );
      await load();
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not transfer the student. Try again.");
    }
  };

  const handleRemove = async () => {
    if (!studentId) return;
    setBusy(true);
    try {
      await studentApi.remove(studentId);
      toast.success("Student removed successfully.");
      router.push("/students");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the student. Try again."));
      setRemoveOpen(false);
    } finally {
      setBusy(false);
    }
  };

  // ---------- Guardians ----------
  const handleGuardianSave = async (
    values: GuardianFormValues,
    isPrimary: boolean,
  ): Promise<string | null> => {
    if (!studentId) return "Could not save the guardian. Try again.";
    try {
      if (guardianTarget?.mode === "edit") {
        await studentApi.updateGuardian(guardianTarget.guardian.id, {
          fullName: values.fullName.trim(),
          relation: values.relation,
          phone: values.phone.trim(),
          ...(values.email !== undefined ? { email: values.email } : {}),
          ...(values.occupation !== undefined ? { occupation: values.occupation } : {}),
        });
        toast.success("Guardian updated successfully.");
      } else {
        await studentApi.createGuardian(studentId, {
          fullName: values.fullName.trim(),
          relation: values.relation,
          phone: values.phone.trim(),
          ...(values.email ? { email: values.email } : {}),
          ...(values.occupation ? { occupation: values.occupation } : {}),
          isPrimary,
        });
        toast.success("Guardian added successfully.");
      }
      setGuardianTarget(null);
      await loadGuardians();
      return null;
    } catch (err) {
      return getApiErrorMessage(err, "Could not save the guardian. Try again.");
    }
  };

  const handleGuardianRemove = async (guardian: GuardianRecord) => {
    if (!studentId) return;
    setGuardianRemovingId(guardian.id);
    try {
      await studentApi.removeGuardian(studentId, guardian.id);
      toast.success("Guardian removed successfully.");
      await loadGuardians();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not remove the guardian. Try again."));
    } finally {
      setGuardianRemovingId(null);
    }
  };

  // ---------- Documents ----------
  const handleUpload = async () => {
    if (!studentId || !documentFile || !documentType.trim()) return;
    setUploading(true);
    try {
      await studentApi.uploadDocument(studentId, documentFile, documentType.trim());
      toast.success("Document uploaded successfully.");
      setDocumentFile(null);
      setDocumentType("");
      await loadDocuments();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not upload the document. Try again."));
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentDelete = async (document: StudentDocumentRecord) => {
    if (!studentId) return;
    setDocumentDeletingId(document.id);
    try {
      await studentApi.deleteDocument(studentId, document.id);
      toast.success("Document deleted successfully.");
      await loadDocuments();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not delete the document. Try again."));
    } finally {
      setDocumentDeletingId(null);
    }
  };

  if (loadError) {
    return (
      <div className="space-y-4">
        <Link
          href="/students"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeftIcon className="size-4" />
          Back to students
        </Link>
        <div className="rounded-lg border border-neutral-200 bg-bg-default">
          <EmptyState title="Student not found" description={loadError} />
        </div>
      </div>
    );
  }

  if (!student) {
    return <LoadingState label="Loading student…" />;
  }

  const enrollment =
    student.enrollments.find((item) => item.status === "ENROLLED") ?? student.enrollments[0];
  const statusLabel = apiStatusToLabel(student.status);
  const guardianDialogOpen = guardianTarget !== null;

  return (
    <div className="space-y-4">
      <Link
        href="/students"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeftIcon className="size-4" />
        Back to students
      </Link>

      <PageHeader
        title={student.fullName}
        description={`Adm. No. ${student.admissionNumber}${
          enrollment
            ? ` · ${enrollment.class.name}${enrollment.section ? ` "${enrollment.section.name}"` : ""}`
            : ""
        }`}
        actions={
          <>
            {canRead && (
              <Link
                href={`/students/${studentId}/report-card`}
                className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-border-subtle bg-bg-default px-3 text-sm text-content-emphasis transition-all hover:bg-bg-muted"
              >
                <FileTextIcon className="size-4" />
                Report Card
              </Link>
            )}
            {canTransfer && (
              <Button
                variant="secondary"
                text="Transfer Section"
                className="w-auto"
                onClick={() => setTransferOpen(true)}
              />
            )}
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={student.fullName} size="lg" />
              <div>
                <p className="font-medium text-neutral-900">{student.fullName}</p>
                <p className="text-sm text-neutral-500">{student.admissionNumber}</p>
                <div className="mt-2 flex gap-1.5">
                  <StatusBadge status={statusLabel} />
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 border-t border-neutral-100 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Email
              </dt>
              <dd className="mt-1 flex items-center gap-2 break-all text-sm text-neutral-700">
                <MailIcon className="size-4 flex-none text-neutral-400" />
                {student.email || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Phone
              </dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                <PhoneIcon className="size-4 flex-none text-neutral-400" />
                {student.phone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Class · Section · Roll
              </dt>
              <dd className="mt-1 text-sm text-neutral-700">
                {enrollment
                  ? `${enrollment.class.name}${enrollment.section ? ` · ${enrollment.section.name}` : ""} · Roll ${enrollment.rollNumber}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Academic Year
              </dt>
              <dd className="mt-1 text-sm text-neutral-700">
                {enrollment?.academicYear?.label ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Date of Birth
              </dt>
              <dd className="mt-1 text-sm text-neutral-700">
                {student.dateOfBirth ? formatDate(student.dateOfBirth) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Gender
              </dt>
              <dd className="mt-1 text-sm text-neutral-700">
                {student.gender
                  ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Blood Group
              </dt>
              <dd className="mt-1 text-sm text-neutral-700">{student.bloodGroup || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Admitted On
              </dt>
              <dd className="mt-1 text-sm text-neutral-700">{formatDate(student.admissionDate)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                Address
              </dt>
              <dd className="mt-1 text-sm text-neutral-700">{student.address || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4">
          {/* Guardians */}
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-neutral-900">Guardians</h3>
              {canManageGuardians && (
                <button
                  type="button"
                  onClick={() => setGuardianTarget({ mode: "add" })}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-bg-subtle hover:text-neutral-900"
                >
                  <PlusIcon className="size-3.5" />
                  Add
                </button>
              )}
            </div>
            {guardians.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No guardians linked yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {guardians.map((guardian) => (
                  <li key={guardian.id} className="rounded-md bg-bg-subtle p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {guardian.fullName}
                          {guardian.isPrimary && (
                            <span className="type-micro-label ml-2 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-blue-700">
                              Primary
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {RELATION_LABELS[guardian.relation] ?? guardian.relation}
                          {guardian.phone ? ` · ${guardian.phone}` : ""}
                        </p>
                        {(guardian.email || guardian.occupation) && (
                          <p className="mt-0.5 truncate text-xs text-neutral-400">
                            {[guardian.email, guardian.occupation].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {canManageGuardians && (
                        <span className="flex flex-none items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Edit ${guardian.fullName}`}
                            onClick={() => setGuardianTarget({ mode: "edit", guardian })}
                            className="flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-bg-default hover:text-neutral-700"
                          >
                            <PencilIcon className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${guardian.fullName}`}
                            disabled={guardianRemovingId === guardian.id}
                            onClick={() => void handleGuardianRemove(guardian)}
                            className="flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-bg-default hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <TrashIcon className="size-3.5" />
                          </button>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Documents */}
          <div className="rounded-lg border border-neutral-200 bg-bg-default p-5">
            <h3 className="text-sm font-semibold text-neutral-900">Documents</h3>
            {documents.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No documents uploaded yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {documents.map((document) => (
                  <li
                    key={document.id}
                    className="flex items-center justify-between gap-2 rounded-md bg-bg-subtle px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-neutral-800">{document.documentType}</p>
                      <p className="text-xs text-neutral-400">
                        {formatSize(document.sizeBytes)} · {formatDate(document.createdAt)}
                      </p>
                    </div>
                    <span className="flex flex-none items-center gap-1">
                      <a
                        href={`${API_ORIGIN}${document.url}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${document.documentType}`}
                        className="flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-bg-default hover:text-neutral-700"
                      >
                        <FileTextIcon className="size-3.5" />
                      </a>
                      {canManageDocuments && (
                        <button
                          type="button"
                          aria-label={`Delete ${document.documentType}`}
                          disabled={documentDeletingId === document.id}
                          onClick={() => void handleDocumentDelete(document)}
                          className="flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-bg-default hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <TrashIcon className="size-3.5" />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {canManageDocuments && (
              <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
                <Input
                  type="text"
                  placeholder="Document type (e.g. Birth Certificate)"
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  maxLength={50}
                />
                <input
                  type="file"
                  onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-md border border-neutral-300 bg-bg-default px-3 py-2 text-sm text-neutral-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-neutral-700"
                />
                <Button
                  text={uploading ? "Uploading…" : "Upload Document"}
                  loading={uploading}
                  disabled={uploading || !documentFile || !documentType.trim()}
                  className="w-full"
                  onClick={() => void handleUpload()}
                />
                <p className="text-xs text-neutral-400">Maximum file size is 10 MB.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {canUpdate && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title="Edit Student"
          description={`Update ${student.fullName}'s details.`}
          maxWidth="max-w-2xl"
        >
          <EditStudentForm
            initial={{
              fullName: student.fullName,
              email: student.email ?? "",
              phone: student.phone ?? "",
              gender: student.gender ?? "",
              dateOfBirth: toDateInputValue(student.dateOfBirth),
              bloodGroup: student.bloodGroup ?? "",
              address: student.address ?? "",
              status: statusLabel,
              admissionDate: toDateInputValue(student.admissionDate),
            }}
            onSave={handleSave}
            onClose={() => setEditOpen(false)}
          />
        </Dialog>
      )}

      {canTransfer && (
        <Dialog
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          title="Transfer Student"
          description="Move the student to another class section."
        >
          <TransferStudentForm
            currentClassId={enrollment?.class.id ?? null}
            currentClassName={enrollment?.class.name ?? "—"}
            currentSectionName={enrollment?.section?.name ?? ""}
            onSave={handleTransfer}
            onClose={() => setTransferOpen(false)}
          />
        </Dialog>
      )}

      {canManageGuardians && guardianDialogOpen && (
        <Dialog
          open={guardianDialogOpen}
          onClose={() => setGuardianTarget(null)}
          title={
            guardianTarget.mode === "add"
              ? "Add Guardian"
              : `Edit ${guardianTarget.guardian.fullName}`
          }
          description={
            guardianTarget.mode === "edit"
              ? "The primary-guardian flag can only be changed by re-adding the guardian."
              : undefined
          }
        >
          <GuardianForm
            showPrimary={guardianTarget.mode === "add"}
            initial={
              guardianTarget.mode === "edit"
                ? {
                    fullName: guardianTarget.guardian.fullName,
                    relation: guardianTarget.guardian.relation as GuardianFormValues["relation"],
                    phone: guardianTarget.guardian.phone,
                    email: guardianTarget.guardian.email ?? "",
                    occupation: guardianTarget.guardian.occupation ?? "",
                  }
                : undefined
            }
            onSave={handleGuardianSave}
            onClose={() => setGuardianTarget(null)}
          />
        </Dialog>
      )}

      {canDelete && (
        <Dialog
          open={removeOpen}
          onClose={() => setRemoveOpen(false)}
          title={`Remove ${student.fullName}?`}
          description="This action cannot be undone."
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">
              This will deactivate the student record ({student.admissionNumber}) and revoke their
              login access. Their past records stay intact.
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
                text={busy ? "Removing…" : "Remove"}
                loading={busy}
                disabled={busy}
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
