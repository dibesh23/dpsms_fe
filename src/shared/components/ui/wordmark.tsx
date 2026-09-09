import { cn } from "@/shared/lib/cn";

export function Wordmark({
  className,
  hideText = false,
  textClassName,
  inverted = false,
}: {
  className?: string;
  hideText?: boolean;
  textClassName?: string;
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        inverted ? "text-white" : "text-[#064E3B]",
        className,
      )}
    >
      <span
        className={cn(
          "font-sans flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-bold tracking-tight shadow-sm",
          inverted ? "bg-[#4ade80] text-[#064E3B]" : "bg-[#064E3B] text-white",
        )}
      >
        DP
      </span>
      {!hideText && (
        <span
          className={cn("type-brand whitespace-nowrap", inverted && "text-white", textClassName)}
        >
          Digital Pathshala
        </span>
      )}
    </div>
  );
}
