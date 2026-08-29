"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SectionCard } from "@/shared/components/ui/section-card";
import { Button } from "@/shared/components/ui/button";
import { StatusBadge } from "@/shared/components/ui/status-badge";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Field, Select } from "@/shared/components/ui/form-field";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import { examApi, type ExamDetail, type ExamDetailSubject } from "../api/examApi";
import { academicApi, type SubjectRecord } from "../../academic/api/academicApi";
import { MarksRegisterPanel } from "./MarksRegisterPanel";
import { EXAM_STATUS_LABEL, EXAM_STATUS_VARIANT, SUBJECT_STATUS_LABEL, SUBJECT_STATUS_VARIANT } from "./labels";
import {
  ArrowLeftIcon,
  BanIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "@/shared/components/ui/icons";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && "response" in err) {
    const response = (err as { response?: { data?: { error?: { message?: string } } } }).response;
    const message = response?.data?.error?.message;
    if (message) return message;
  }
  return fallback;
}

function AddSubjectDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (payload: { subjectId: string; fullMarksTheory: number; fullMarksPractical: number; passMarks: number }) => Promise<string | null>;
}) {
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [fullMarksTheory, setFullMarksTheory] = useState("");
  const [fullMarksPractical, setFullMarksPractical] = useState("0");
  const [passMarks, setPassMarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setSubjectId("");
      setFullMarksTheory("");
      setFullMarksPractical("0");
      setPassMarks("");
      academicApi
        .listSubjects()
        .then(setSubjects)
        .catch(() => setSubjects([]));
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!subjectId) {
      setError("Choose a subject.");
      return;
    }
    if (!fullMarksTheory || Number(fullMarksTheory) <= 0) {
      setError("Full theory marks must be a positive number.");
      return;
    }
    setBusy(true);
    const errorMessage = await onAdd({
      subjectId,
      fullMarksTheory: Number(fullMarksTheory),
      fullMarksPractical: Number(fullMarksPractical || 0),
      passMarks: Number(passMarks === "" ? 0 : passMarks),
    });
    setBusy(false);
    if (errorMessage) setError(errorMessage);
  };

  return (
    <Dialog open={open} onClose={onClose} title="Attach Subject" description="Attach a subject with its marking scheme.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Subject" required>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={busy}>
            <option value="">Select a subject…</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Full theory" required>
            <Input type="number" min={1} placeholder="75" value={fullMarksTheory} onChange={(e) => setFullMarksTheory(e.target.value)} disabled={busy} />
          </Field>
          <Field label="Full practical">
            <Input type="number" min={0} placeholder="25" value={fullMarksPractical} onChange={(e) => setFullMarksPractical(e.target.value)} disabled={busy} />
          </Field>
          <Field label="Pass marks">
            <Input type="number" min={0} placeholder="32" value={passMarks} onChange={(e) => setPassMarks(e.target.value)} disabled={busy} />
          </Field>
        </div>
        {error && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
          <Button variant="secondary" text="Cancel" onClick={onClose} className="w-auto" />
          <Button text={busy ? "Attaching…" : "Attach subject"} loading={busy} disabled={busy} className="w-auto" />
        </div>
      </form>
    </Dialog>
  );
}

function SubjectWorkflowActions({
  exam,
  subject,
  canEnterMarks,
  canApprove,
  canUpdate,
  onAction,
}: {
  exam: ExamDetail;
  subject: ExamDetailSubject;
  canEnterMarks: boolean;
  canApprove: boolean;
  canUpdate: boolean;
  onAction: (type: "submit" | "approve" | "reject" | "remove", reason?: string) => void;
}) {
  if (canEnterMarks && exam.status === "MARKS_ENTRY" && subject.status === "ENTERED") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="secondary" text="Submit" icon={<CheckIcon className="size-3.5" />} className="h-8 w-auto px-2.5 text-xs" onClick={() => onAction("submit")} />
      </div>
    );
  }
  if (canApprove && exam.status === "SUBMITTED" && subject.status === "SUBMITTED") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="success" text="Approve" icon={<CheckIcon className="size-3.5" />} className="h-8 w-auto px-2.5 text-xs" onClick={() => onAction("approve")} />
        <Button variant="danger-outline" text="Reject" className="h-8 w-auto px-2.5 text-xs" onClick={() => onAction("reject")} />
      </div>
    );
  }
  if (canUpdate && exam.status === "DRAFT") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="danger-outline" text="Remove" icon={<TrashIcon className="size-3.5" />} className="h-8 w-auto px-2.5 text-xs" onClick={() => onAction("remove")} />
      </div>
    );
  }
  return <span className="text-xs text-neutral-300">—</span>;
}

export function ExamDetailPage() {
  const params = useParams<{ id: string }>();
  const examId = params?.id;
  const toast = useToast();
  const { can } = useAuth();
  const canUpdate = can(PERMISSIONS.EXAM_UPDATE);
  const canDelete = can(PERMISSIONS.EXAM_DELETE);
  const canApprove = can(PERMISSIONS.EXAM_RESULTS_APPROVE);
  const canEnterMarks = can(PERMISSIONS.EXAM_RESULTS_ENTER);

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ExamDetailSubject | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectBusy, setRejectBusy] = useState(false);

  const load = useCallback(async () => {
    if (!examId) return;
    try {
      setExam(await examApi.getExam(examId));
    } catch {
      setExam(null);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingState label="Loading exam…" />;

  if (!exam) {
    return (
      <EmptyState
        icon={<BanIcon className="size-5" />}
        title="Exam not found"
        description="It may have been deleted or you don't have access."
        action={
          <Link href="/exams" className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-neutral-700">
            Back to exams
          </Link>
        }
      />
    );
  }

  const runAction = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    try {
      await fn();
      await load();
      toast.success("Done.");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Action could not be completed."));
    } finally {
      setBusy(null);
    }
  };

  const handleSubjectAction = (type: "submit" | "approve" | "remove", subject: ExamDetailSubject) => {
    void runAction(`subject-${type}`, async () => {
      if (type === "submit") await examApi.submitSubject(exam.id, subject.subjectId);
      if (type === "approve") await examApi.approveSubject(exam.id, subject.subjectId);
      if (type === "remove") await examApi.removeSubject(exam.id, subject.subjectId);
    });
  };

  const handleReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    void runAction("subject-reject", async () => {
      await examApi.rejectSubject(exam.id, rejectTarget.subjectId, rejectReason.trim());
    });
    setRejectBusy(false);
    setRejectTarget(null);
    setRejectReason("");
  };

  const lifecycle = (() => {
    switch (exam.status) {
      case "DRAFT":
        return [
          { key: "start", label: "Start Exam", icon: <CheckIcon className="size-4" />, variant: "primary" as const, show: canUpdate, onClick: () => runAction("start", () => examApi.startExam(exam.id)), confirm: false },
          { key: "delete", label: "Delete", icon: <TrashIcon className="size-4" />, variant: "danger-outline" as const, show: canDelete, onClick: () => setDeleteOpen(true), confirm: false },
        ];
      case "MARKS_ENTRY":
      case "SUBMITTED":
        return [
          { key: "cancel", label: "Cancel Exam", icon: <XIcon className="size-4" />, variant: "danger-outline" as const, show: canUpdate, onClick: () => runAction("cancel", () => examApi.cancelExam(exam.id)), confirm: false },
          ...(exam.status === "SUBMITTED" && canApprove
            ? [{ key: "publish", label: "Publish Results", icon: <CheckIcon className="size-4" />, variant: "success" as const, show: true, onClick: () => runAction("publish", () => examApi.publishExam(exam.id)), confirm: false }]
            : []),
        ];
      case "PUBLISHED":
        return [
          { key: "reopen", label: "Reopen", icon: <PencilIcon className="size-4" />, variant: "secondary" as const, show: canApprove, onClick: () => runAction("reopen", () => examApi.reopenExam(exam.id)), confirm: false },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="space-y-4">
      <Link href="/exams" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-900">
        <ArrowLeftIcon className="size-4" /> Back to exams
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{exam.name}</h1>
            <StatusBadge status={EXAM_STATUS_LABEL[exam.status]} variant={EXAM_STATUS_VARIANT[exam.status]} />
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {exam.examTypeName} · {exam.className} · {exam.academicYearLabel}
            {exam.termName ? ` · ${exam.termName}` : ""}
          </p>
        </div>
        {lifecycle.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {lifecycle
              .filter((action) => action.show)
              .map((action) => (
                <Button
                  key={action.key}
                  variant={action.variant}
                  text={action.label}
                  icon={action.icon}
                  loading={busy === action.key}
                  disabled={busy !== null}
                  className="w-auto"
                  onClick={action.onClick}
                />
              ))}
          </div>
        )}
      </div>

      <SectionCard title="Exam details" description="Core information for this exam">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-neutral-400">Exam type</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">{exam.examTypeName}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Class</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">{exam.className}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Academic year</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">{exam.academicYearLabel}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Term</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">{exam.termName || "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-400">Subjects</dt>
            <dd className="mt-0.5 font-medium text-neutral-900">{exam.subjects.length}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard
        title="Subjects & marks workflow"
        description="Attach subjects in DRAFT, then teachers enter and submit marks for review"
        action={
          canUpdate && exam.status === "DRAFT" ? (
            <Button variant="secondary" text="Attach subject" icon={<PlusIcon className="size-3.5" />} className="h-8 w-auto px-2.5 text-xs" onClick={() => setAddSubjectOpen(true)} />
          ) : undefined
        }
        bodyClassName="p-0"
      >
        {exam.subjects.length === 0 ? (
          <div className="px-5 py-8">
            <EmptyState
              title="No subjects attached"
              description="Attach at least one subject before starting the exam."
            />
          </div>
        ) : (
          <div className="overflow-x-auto px-5 py-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 text-left text-xs text-neutral-400">
                  <th className="pb-2 pr-3 font-medium">Subject</th>
                  <th className="pb-2 pr-3 font-medium">Full marks</th>
                  <th className="pb-2 pr-3 font-medium">Pass marks</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {exam.subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-neutral-900">{subject.subjectName}</p>
                      <p className="text-xs text-neutral-400">{subject.subjectCode}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-neutral-600">
                      {subject.fullMarksTheory + subject.fullMarksPractical}
                      {subject.fullMarksTheory > 0 && <span className="text-xs text-neutral-400"> (theory {subject.fullMarksTheory})</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-neutral-600">{subject.passMarks}</td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={SUBJECT_STATUS_LABEL[subject.status]} variant={SUBJECT_STATUS_VARIANT[subject.status]} />
                      {subject.rejectedReason && (
                        <p className="mt-1 max-w-[220px] truncate text-xs text-red-600" title={subject.rejectedReason}>
                          {subject.rejectedReason}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5">
                      <SubjectWorkflowActions
                        exam={exam}
                        subject={subject}
                        canEnterMarks={canEnterMarks}
                        canApprove={canApprove}
                        canUpdate={canUpdate}
                        onAction={(type) => {
                          if (type === "reject") {
                            setRejectTarget(subject);
                            setRejectReason("");
                          } else {
                            handleSubjectAction(type, subject);
                          }
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {canEnterMarks && ["MARKS_ENTRY", "SUBMITTED"].includes(exam.status) && exam.subjects.length > 0 && (
        <MarksRegisterPanel exam={exam} onChanged={load} />
      )}

      <AddSubjectDialog
        open={addSubjectOpen}
        onClose={() => setAddSubjectOpen(false)}
        onAdd={async (payload) => {
          try {
            await examApi.addSubject(exam.id, payload);
            await load();
            setAddSubjectOpen(false);
            toast.success("Subject attached.");
            return null;
          } catch (err) {
            return getApiErrorMessage(err, "Could not attach the subject.");
          }
        }}
      />

      {rejectTarget && (
        <Dialog open onClose={() => setRejectTarget(null)} title="Reject marks" description={`Reject "${rejectTarget.subjectName}"?`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setRejectBusy(true);
              handleReject();
            }}
            noValidate
            className="space-y-4"
          >
            <Field label="Reason" required>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Marks inconsistent with the answer scripts"
                className="min-h-24 w-full rounded-md border border-neutral-300 bg-bg-default px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
              />
            </Field>
            <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
              <Button variant="secondary" text="Cancel" onClick={() => setRejectTarget(null)} className="w-auto" />
              <Button variant="danger" text={rejectBusy ? "Rejecting…" : "Reject marks"} loading={rejectBusy} disabled={rejectBusy || !rejectReason.trim()} className="w-auto" />
            </div>
          </form>
        </Dialog>
      )}

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Exam" description={`Delete "${exam.name}"?`}>
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Only draft exams can be deleted. Cancel a started exam instead.</p>
          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
            <Button variant="secondary" text="Cancel" onClick={() => setDeleteOpen(false)} className="w-auto" />
            <Button
              variant="danger"
              text={busy === "delete" ? "Deleting…" : "Delete Exam"}
              loading={busy === "delete"}
              disabled={busy !== null}
              className="w-auto"
              onClick={() => {
                setDeleteOpen(false);
                void runAction("delete", () => examApi.deleteExam(exam.id));
              }}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

export default ExamDetailPage;