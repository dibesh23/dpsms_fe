"use client";

import { cn } from "@/shared/lib/cn";
import React, { useCallback, useState } from "react";
import { AlertCircle, Eye, EyeSlash } from "./icons";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const toggleIsPasswordVisible = useCallback(() => setIsPasswordVisible((prev) => !prev), []);

    return (
      <div>
        <div className="relative flex">
          <input
            type={isPasswordVisible ? "text" : type}
            className={cn(
              "type-input min-h-11 w-full max-w-md rounded-md border border-neutral-300 px-3 py-2 placeholder:text-content-muted read-only:bg-neutral-100 read-only:text-content-subtle focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-100 sm:min-h-10",
              type === "password" && "pr-11",
              props.error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className,
            )}
            ref={ref}
            {...props}
          />

          <div className="group">
            {props.error && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex flex-none items-center px-2.5">
                <AlertCircle
                  fill="#ef4444"
                  className={cn(
                    "size-5 text-white",
                    type === "password" && "transition-opacity group-hover:opacity-0",
                  )}
                />
              </div>
            )}
            {type === "password" && (
              <button
                className={cn(
                  "absolute inset-y-0 right-0 flex min-w-11 items-center justify-center px-3",
                  props.error && "opacity-0 transition-opacity group-hover:opacity-100",
                )}
                type="button"
                onClick={() => toggleIsPasswordVisible()}
                aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              >
                {isPasswordVisible ? (
                  <Eye
                    className="size-4 flex-none text-neutral-500 transition hover:text-neutral-700"
                    aria-hidden
                  />
                ) : (
                  <EyeSlash
                    className="size-4 flex-none text-neutral-500 transition hover:text-neutral-700"
                    aria-hidden
                  />
                )}
              </button>
            )}
          </div>
        </div>

        {props.error && (
          <span className="type-error mt-2 block" role="alert" aria-live="assertive">
            {props.error}
          </span>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
