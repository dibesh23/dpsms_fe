"use client";

import type { DayOfWeek } from "../api/timetableApi";

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

export interface TimetableCell {
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string | null;
  teacherName: string | null;
  className?: string;
  timetableName?: string;
  isBreak: boolean;
}

export function WeeklyTimetableGrid({ slots }: { slots: TimetableCell[] }) {
  const maxPeriod = slots.reduce((max, s) => Math.max(max, s.periodNumber), 0);
  const periods = Array.from({ length: Math.max(maxPeriod, 1) }, (_, i) => i + 1);

  const cellFor = (day: DayOfWeek, period: number): TimetableCell[] =>
    slots.filter((s) => s.dayOfWeek === day && s.periodNumber === period);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="w-24 px-3 py-2 text-left font-medium text-neutral-600">Period</th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="min-w-[140px] px-3 py-2 text-center font-medium text-neutral-600"
              >
                {DAY_LABELS[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => {
            const periodSlots = slots.filter((s) => s.periodNumber === period);
            const timeRange = periodSlots[0]
              ? `${periodSlots[0].startTime} – ${periodSlots[0].endTime}`
              : null;
            return (
              <tr key={period} className="border-b border-neutral-100 last:border-b-0 align-top">
                <td className="px-3 py-2">
                  <div className="font-medium text-neutral-800">Period {period}</div>
                  {timeRange && <div className="text-xs text-neutral-500">{timeRange}</div>}
                </td>
                {DAYS.map((day) => {
                  const cells = cellFor(day, period);
                  if (cells.length === 0) {
                    return (
                      <td key={`${day}-${period}`} className="px-2 py-2">
                        <div className="h-14 rounded-md border border-dashed border-neutral-200" />
                      </td>
                    );
                  }
                  return (
                    <td key={`${day}-${period}`} className="px-2 py-2">
                      <div className="space-y-1">
                        {cells.map((cell, idx) => (
                          <div
                            key={`${day}-${period}-${idx}`}
                            className={`rounded-md border p-2 ${
                              cell.isBreak
                                ? "border-amber-200 bg-amber-50"
                                : "border-neutral-200 bg-neutral-50"
                            }`}
                          >
                            {cell.isBreak ? (
                              <span className="font-medium text-amber-700">Break</span>
                            ) : (
                              <div>
                                <div className="font-medium text-neutral-800">
                                  {cell.subjectName ?? "—"}
                                </div>
                                {cell.teacherName && (
                                  <div className="text-xs text-neutral-600">{cell.teacherName}</div>
                                )}
                                {cell.className && (
                                  <div className="text-xs text-neutral-500">{cell.className}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
