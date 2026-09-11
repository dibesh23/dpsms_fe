"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/shared/components/ui/page-header";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { LoadingState } from "@/shared/components/ui/loading-state";
import { useToast } from "@/shared/components/ui/toast";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PERMISSIONS } from "@/shared/permissions";
import {
  timetableApi,
  type TimetableDetailRecord,
  type TimetableSlotRecord,
  type DayOfWeek,
} from "../api/timetableApi";
import { academicApi, type SubjectRecord } from "@/features/academic/api/academicApi";
import { apiClient } from "@/shared/lib/apiClient";
import { ArrowLeftIcon, PlusIcon, TrashIcon, PencilIcon } from "@/shared/components/ui/icons";
import { SlotForm } from "./SlotForm";

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

interface TeacherRecord {
  id: string;
  name: string;
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object"
  ) {
    const resp = err as { response: { data?: { error?: { message?: string } } } };
    return resp.response.data?.error?.message ?? fallback;
  }
  return fallback;
}

export function TimetableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const timetableId = params.id as string;
  const toast = useToast();
  const { can } = useAuth();
  const canManage = can(PERMISSIONS.TIMETABLE_MANAGE);

  const [timetable, setTimetable] = useState<TimetableDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);

  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlotRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimetableSlotRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [prefillDay, setPrefillDay] = useState<DayOfWeek | null>(null);
  const [prefillPeriod, setPrefillPeriod] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [tt, subs, tchs] = await Promise.all([
        timetableApi.getTimetable(timetableId),
        academicApi.listSubjects(),
        apiClient
          .get<{ data: { items: TeacherRecord[] } }>("/teachers")
          .then((r) => r.data.data.items),
      ]);
      setTimetable(tt);
      setSubjects(subs);
      setTeachers(tchs);
    } catch {
      toast.error("Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }, [timetableId, toast]);

  useEffect(() => {
    const id = setTimeout(() => void load(), 0);
    return () => clearTimeout(id);
  }, [load]);

  const handleSaveSlot = async (values: {
    dayOfWeek: DayOfWeek;
    periodNumber: number;
    startTime: string;
    endTime: string;
    subjectId: string | null;
    teacherId: string | null;
    isBreak: boolean;
  }): Promise<boolean> => {
    try {
      if (editingSlot) {
        await timetableApi.updateSlot(timetableId, editingSlot.id, values);
        toast.success("Slot updated");
      } else {
        await timetableApi.createSlot(timetableId, values);
        toast.success("Slot added");
      }
      setSlotDialogOpen(false);
      setEditingSlot(null);
      setPrefillDay(null);
      setPrefillPeriod(null);
      await load();
      return true;
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to save slot"));
      return false;
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await timetableApi.deleteSlot(timetableId, deleteTarget.id);
      toast.success("Slot removed");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete slot"));
    } finally {
      setDeleteBusy(false);
    }
  };

  const openAddSlot = (day?: DayOfWeek, period?: number) => {
    setEditingSlot(null);
    setPrefillDay(day ?? null);
    setPrefillPeriod(period ?? null);
    setSlotDialogOpen(true);
  };

  const openEditSlot = (slot: TimetableSlotRecord) => {
    setEditingSlot(slot);
    setPrefillDay(null);
    setPrefillPeriod(null);
    setSlotDialogOpen(true);
  };

  const getSlotsForCell = (day: DayOfWeek, period: number): TimetableSlotRecord | undefined => {
    return timetable?.slots.find((s) => s.dayOfWeek === day && s.periodNumber === period);
  };

  const maxPeriod = timetable ? Math.max(0, ...timetable.slots.map((s) => s.periodNumber)) : 0;

  const periods = Array.from({ length: Math.max(maxPeriod + 1, 1) }, (_, i) => i + 1);

  if (loading) return <LoadingState label="Loading timetable..." />;
  if (!timetable) return <LoadingState label="Timetable not found" />;

  return (
    <div className="space-y-4">
      <PageHeader
        title={timetable.name}
        description={`${timetable.className} · ${timetable.academicYearLabel} · ${timetable.slotCount} periods`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeftIcon className="h-4 w-4" />}
              text="Back"
              onClick={() => router.push("/timetable")}
              className="w-auto"
            />
            {canManage && (
              <Button
                icon={<PlusIcon className="h-4 w-4" />}
                text="Add Period"
                onClick={() => openAddSlot()}
                className="w-auto"
              />
            )}
          </div>
        }
      />

      {timetable.slots.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="text-sm text-neutral-500 mb-4">
            No periods added yet. Start building the schedule.
          </p>
          {canManage && (
            <Button
              text="Add First Period"
              onClick={() => openAddSlot()}
              className="w-auto mx-auto"
            />
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-3 py-2 text-left font-medium text-neutral-600 w-20">Period</th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="px-3 py-2 text-center font-medium text-neutral-600 min-w-[140px]"
                  >
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((period) => (
                <tr key={period} className="border-b border-neutral-100 last:border-b-0">
                  <td className="px-3 py-2 font-medium text-neutral-700">{period}</td>
                  {DAYS.map((day) => {
                    const slot = getSlotsForCell(day, period);
                    return (
                      <td key={`${day}-${period}`} className="px-2 py-2">
                        {slot ? (
                          <div
                            className={`rounded-md border p-2 text-xs cursor-pointer hover:shadow-sm transition-shadow ${
                              slot.isBreak
                                ? "border-amber-200 bg-amber-50"
                                : "border-neutral-200 bg-neutral-50"
                            }`}
                            onClick={() => canManage && openEditSlot(slot)}
                          >
                            {slot.isBreak ? (
                              <span className="font-medium text-amber-700">Break</span>
                            ) : (
                              <>
                                <div className="font-medium text-neutral-800 truncate">
                                  {slot.subjectName}
                                </div>
                                <div className="text-neutral-500 truncate">{slot.teacherName}</div>
                              </>
                            )}
                            <div className="text-neutral-400 mt-1">
                              {slot.startTime} – {slot.endTime}
                            </div>
                            {canManage && (
                              <div className="flex gap-1 mt-1">
                                <button
                                  type="button"
                                  className="text-neutral-400 hover:text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditSlot(slot);
                                  }}
                                >
                                  <PencilIcon className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  className="text-neutral-400 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(slot);
                                  }}
                                >
                                  <TrashIcon className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : canManage ? (
                          <button
                            type="button"
                            className="w-full rounded-md border border-dashed border-neutral-200 p-2 text-xs text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 transition-colors"
                            onClick={() => openAddSlot(day, period)}
                          >
                            + Add
                          </button>
                        ) : (
                          <div className="p-2 text-xs text-neutral-300 text-center">—</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canManage && (
        <Dialog
          open={slotDialogOpen}
          onClose={() => {
            setSlotDialogOpen(false);
            setEditingSlot(null);
            setPrefillDay(null);
            setPrefillPeriod(null);
          }}
          title={editingSlot ? "Edit Period" : "Add Period"}
        >
          <SlotForm
            onSave={handleSaveSlot}
            onClose={() => {
              setSlotDialogOpen(false);
              setEditingSlot(null);
              setPrefillDay(null);
              setPrefillPeriod(null);
            }}
            existingSlot={editingSlot}
            prefillDay={prefillDay}
            prefillPeriod={prefillPeriod}
            subjects={subjects}
            teachers={teachers}
            existingSlots={timetable?.slots ?? []}
            currentSlotId={editingSlot?.id}
          />
        </Dialog>
      )}

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Period">
        <p className="text-sm text-neutral-600">
          Remove <strong>{deleteTarget?.isBreak ? "break" : deleteTarget?.subjectName}</strong> from{" "}
          {DAY_LABELS[deleteTarget?.dayOfWeek ?? "MONDAY"]} period {deleteTarget?.periodNumber}?
        </p>
        <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4 mt-4">
          <Button
            variant="secondary"
            text="Cancel"
            onClick={() => setDeleteTarget(null)}
            className="w-auto"
          />
          <Button
            variant="danger"
            text={deleteBusy ? "Removing..." : "Remove"}
            loading={deleteBusy}
            disabled={deleteBusy}
            onClick={handleDeleteSlot}
            className="w-auto"
          />
        </div>
      </Dialog>
    </div>
  );
}
