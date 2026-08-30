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
        inverted ? "text-white" : "text-[#0d3320]",
        className,
      )}
    >
      <span className={cn("flex h-9 w-9 flex-none items-center justify-center rounded-xl text-sm font-bold tracking-tight shadow-sm", inverted ? "bg-[#4ade80] text-[#0d3320]" : "bg-[#125d31] text-white")}>
        DP
      </span>
      {!hideText && (
        <span className={cn("whitespace-nowrap text-lg font-medium tracking-tight", inverted ? "text-white" : "text-[#0d3320]", textClassName)}>
          Digital Pathshala
        </span>
      )}
    </div>
  );
}
