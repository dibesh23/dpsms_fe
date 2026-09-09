"use client";

import { cn } from "@/shared/lib/cn";
import { CheckIcon, ChevronDownIcon, FilterIcon } from "./icons";
import { Dropdown } from "./dropdown";

export function FilterDropdown({
  label = "Filter",
  options,
  value,
  onChange,
  className,
}: {
  label?: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <Dropdown
      width="w-44"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "type-button flex h-9 items-center gap-2 rounded-lg border px-3 transition-colors",
            open
              ? "border-neutral-400 bg-bg-default text-neutral-900 ring-2 ring-neutral-100"
              : "border-neutral-200 bg-bg-default text-neutral-700 hover:bg-bg-muted",
            className,
          )}
        >
          <FilterIcon className="size-4 text-neutral-500" />
          <span className="whitespace-nowrap">{selected ? selected.label : label}</span>
          <ChevronDownIcon
            className={cn("size-3.5 text-neutral-400 transition-transform", open && "rotate-180")}
          />
        </button>
      )}
    >
      {({ close }) => (
        <div className="p-1">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              close();
            }}
            className={cn(
              "type-button flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-bg-subtle",
              value === null ? "font-medium text-neutral-900" : "text-neutral-600",
            )}
          >
            All
            {value === null && <CheckIcon className="size-3.5 text-neutral-900" />}
          </button>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
                className={cn(
                  "type-button flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left transition-colors hover:bg-bg-subtle",
                  active ? "font-medium text-neutral-900" : "text-neutral-600",
                )}
              >
                {option.label}
                {active && <CheckIcon className="size-3.5 text-neutral-900" />}
              </button>
            );
          })}
        </div>
      )}
    </Dropdown>
  );
}
