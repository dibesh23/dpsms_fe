import { cn } from "@/shared/lib/cn";

export function Wordmark({
  className,
  hideText = false,
  textClassName,
}: {
  className?: string;
  hideText?: boolean;
  textClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-black",
        className,
      )}
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-black text-sm font-bold tracking-tight text-white shadow-sm">
        DP
      </span>
      {!hideText && (
        <span className={cn("whitespace-nowrap text-lg font-medium tracking-tight text-black", textClassName)}>
          Digital Pathshala
        </span>
      )}
    </div>
  );
}
