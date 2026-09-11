import { cn } from "@/shared/lib/cn";

type RouteLoadingVariant = "page" | "dashboard" | "auth";

function Skeleton({ className }: { className: string }) {
  return <div aria-hidden="true" className={cn("route-skeleton rounded-xl", className)} />;
}

export function RouteLoading({
  variant = "page",
  label = "Loading page…",
}: {
  variant?: RouteLoadingVariant;
  label?: string;
}) {
  if (variant === "auth") {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-8" role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        <div className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full max-w-xs" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full bg-emerald-100" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        <div className="flex items-center justify-between rounded-[18px] border border-neutral-200 bg-white p-5">
          <div className="space-y-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-72 max-w-[65vw]" />
          </div>
          <Skeleton className="hidden h-10 w-32 sm:block" />
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="space-y-5 rounded-[18px] border border-neutral-200 bg-white p-5"
            >
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[18px] border border-neutral-200 bg-white p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-8 h-64 w-full" />
          </div>
          <div className="rounded-[18px] border border-neutral-200 bg-white p-5">
            <Skeleton className="h-5 w-32" />
            <div className="mt-8 space-y-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      className="mx-auto min-h-[70dvh] max-w-7xl px-5 py-12 sm:px-8"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      <div className="mx-auto max-w-3xl space-y-5 text-center">
        <Skeleton className="mx-auto h-5 w-36 rounded-full" />
        <Skeleton className="mx-auto h-14 w-4/5" />
        <Skeleton className="mx-auto h-5 w-2/3" />
      </div>
      <Skeleton className="mx-auto mt-12 h-80 max-w-6xl rounded-[28px]" />
    </main>
  );
}
