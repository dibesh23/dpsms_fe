"use client";

import { cn } from "@/shared/lib/cn";
import React, { forwardRef } from "react";
import { LoadingSpinner } from "./icons";

const buttonVariants = {
  primary:
    "border-brand-default bg-brand-default text-content-inverted hover:border-brand-hover hover:bg-brand-hover hover:ring-4 hover:ring-brand-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-subtle",
  secondary:
    "border-border-subtle bg-bg-default text-content-emphasis hover:bg-bg-muted focus-visible:border-border-emphasis outline-none data-[state=open]:border-border-emphasis data-[state=open]:ring-4 data-[state=open]:ring-border-subtle",
  outline: "border-transparent text-content-default hover:bg-neutral-900/5",
  success:
    "border-blue-500 bg-blue-500 text-white hover:bg-blue-600 hover:ring-4 hover:ring-blue-100",
  danger: "border-red-500 bg-red-500 text-white hover:bg-red-600 hover:ring-4 hover:ring-red-100",
  "danger-outline": "border-transparent bg-white text-red-500 hover:bg-red-600 hover:text-white",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: React.ReactNode | string;
  textWrapperClassName?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  variant?: ButtonVariant;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      text,
      variant = "primary",
      className,
      textWrapperClassName,
      loading,
      icon,
      right,
      ...props
    }: ButtonProps,
    forwardedRef,
  ) => {
    return (
      <button
        ref={forwardedRef}

        type={props.onClick ? "button" : "submit"}
        className={cn(
          "type-button group flex min-h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 transition-all sm:min-h-10 sm:py-0",
          props.disabled || loading
            ? "cursor-not-allowed border-border-subtle bg-bg-subtle text-content-subtle outline-none"
            : buttonVariants[variant],
          className,
        )}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? <LoadingSpinner /> : icon ? icon : null}
        {text && <div className={cn("min-w-0 truncate", textWrapperClassName)}>{text}</div>}
        {right}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
