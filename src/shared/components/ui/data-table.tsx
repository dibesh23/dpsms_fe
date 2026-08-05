"use client";

import { cn } from "@/shared/lib/cn";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";
import { EmptyState } from "./empty-state";
import type { SortDir } from "@/shared/hooks/useTable";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  sortValue?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right";
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  sortKey,
  sortDir,
  onSort,
  minWidth = "min-w-[720px]",
  empty,
  footer,
}: {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  sortKey: string | null;
  sortDir: SortDir;
  onSort: (key: string) => void;
  minWidth?: string;
  empty?: { title: string; description?: string; action?: ReactNode };
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-default">
      <div className="overflow-x-auto">
        {data.length === 0 ? (
          <EmptyState
            title={empty?.title ?? "Nothing here yet"}
            description={empty?.description}
            action={empty?.action}
          />
        ) : (
          <table className={cn("w-full text-left text-sm", minWidth)}>
            <thead>
              <tr className="border-b border-neutral-100">
                {columns.map((column) => {
                  const isActive = sortKey === column.key;
                  return (
                    <th
                      key={column.key}
                      className={cn(
                        "px-5 py-3 text-xs font-medium tracking-wide text-neutral-400",
                        column.align === "right" && "text-right",
                        column.headerClassName,
                      )}
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          onClick={() => onSort(column.key)}
                          className={cn(
                            "inline-flex items-center gap-1 transition-colors hover:text-neutral-700",
                            isActive && "text-neutral-700",
                          )}
                        >
                          {column.header}
                          {isActive &&
                            (sortDir === "asc" ? (
                              <ChevronUpIcon className="size-3.5" />
                            ) : (
                              <ChevronDownIcon className="size-3.5" />
                            ))}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((row) => (
                <tr key={keyExtractor(row)} className="transition-colors hover:bg-bg-muted">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-5 py-3.5 text-neutral-700",
                        column.align === "right" && "text-right",
                        column.className,
                      )}
                    >
                      {column.render
                        ? column.render(row)
                        : String((row as Record<string, unknown>)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {footer}
    </div>
  );
}
