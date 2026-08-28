"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

interface UseTableOptions<T> {
  data: T[];
  pageSize?: number;
  getSearchText: (row: T) => string;
  filterMatch?: (row: T, value: string | null) => boolean;
  sortValue?: (row: T, key: string) => string | number;
  defaultSortKey?: string | null;
  defaultSortDir?: SortDir;
}

export interface FilterOption {
  value: string;
  label: string;
}

export function useTable<T>({
  data,
  pageSize = 8,
  getSearchText,
  filterMatch,
  sortValue,
  defaultSortKey = null,
  defaultSortDir,
}: UseTableOptions<T>) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir ?? "asc");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    let out = data;
    const q = query.trim().toLowerCase();
    if (q) {
      out = out.filter((row) => getSearchText(row).toLowerCase().includes(q));
    }
    if (filterMatch && filter) {
      out = out.filter((row) => filterMatch(row, filter));
    }
    if (sortKey && sortValue) {
      const dir = sortDir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => {
        const va = sortValue(a, sortKey);
        const vb = sortValue(b, sortKey);
        if (typeof va === "number" && typeof vb === "number") {
          return (va - vb) * dir;
        }
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
    return out;
  }, [data, query, filter, sortKey, sortDir, getSearchText, filterMatch, sortValue]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const handleSort = useCallback(
    (key: string) => {
      if (key === sortKey) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey],
  );

  const pageRows = useMemo(
    () => rows.slice((page - 1) * pageSize, page * pageSize),
    [rows, page, pageSize],
  );

  return {
    query,
    setQuery,
    filter,
    setFilter,
    sortKey,
    sortDir,
    handleSort,
    page,
    setPage,
    pageSize,
    rows,
    pageRows,
    pageCount,
    total: rows.length,
  };
}
