"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { MoreIcon } from "./icons";
import { Dropdown } from "./dropdown";
import type { ReactNode } from "react";

export interface RowAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}

export function RowActions({ actions }: { actions: RowAction[] }) {
  return (
    <Dropdown
      width="w-44"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="Row actions"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-bg-subtle hover:text-neutral-700"
        >
          <MoreIcon className="size-4" />
        </button>
      )}
    >
      {({ close }) => (
        <div className="p-1">
          {actions.map((action) => {
            const itemClass = cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-bg-subtle",
              action.danger ? "text-red-600" : "text-neutral-700",
            );
            const content = (
              <>
                {action.icon && <span className="flex-none">{action.icon}</span>}
                {action.label}
              </>
            );
            if (action.href) {
              return (
                <Link key={action.label} href={action.href} onClick={close} className={itemClass}>
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  action.onClick?.();
                  close();
                }}
                className={itemClass}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </Dropdown>
  );
}
