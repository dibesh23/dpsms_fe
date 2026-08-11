import { cn } from "@/shared/lib/cn";

export function Wordmark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 text-neutral-900",
        className,
      )}
    >
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-black text-xs font-bold tracking-tight text-white">
        DP
      </span>
      <span className="whitespace-nowrap text-base font-semibold tracking-tight">
        Digital Pathshala
      </span>
    </div>
  );
}