import { cn } from "../lib/cn";
import { Grid } from "./ui/grid";
import { Wordmark } from "./ui/wordmark";
import Link from "next/link";

export function AuthShell({
  children,
  showTerms = true,
}: {
  children: React.ReactNode;
  showTerms?: boolean;
}) {
  return (
    <div className="relative min-h-[100dvh]">
      <div className="absolute inset-0 isolate overflow-hidden bg-white">
        {}
        <div
          className={cn(
            "absolute inset-y-0 left-1/2 w-[1200px] -translate-x-1/2",
            "[mask-composite:intersect] [mask-image:linear-gradient(black,transparent_320px),linear-gradient(90deg,transparent,black_5%,black_95%,transparent)]",
          )}
        >
          <Grid cellSize={60} patternOffset={[0.75, 0]} className="text-neutral-200" />
        </div>

        {}
        {[...Array(2)].map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "absolute left-1/2 top-6 size-[80px] -translate-x-1/2 -translate-y-1/2 scale-x-[1.6]",
              idx === 0 ? "mix-blend-overlay" : "opacity-10",
            )}
          >
            {[...Array(idx === 0 ? 2 : 1)].map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "absolute -inset-16 mix-blend-overlay blur-[50px] saturate-[2]",
                  "bg-[conic-gradient(from_90deg,#F00_5deg,#EAB308_63deg,#5CFF80_115deg,#1E00FF_170deg,#855AFC_220deg,#3A8BFD_286deg,#F00_360deg)]",
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="relative flex min-h-[100dvh] w-full justify-center">
        <Link
          href="/"
          className="absolute left-1/2 top-4 z-10 -translate-x-1/2"
          aria-label="Digital Pathshala home"
        >
          <Wordmark className="h-8" />
        </Link>

        <div className="flex min-h-[100dvh] w-full flex-col items-center justify-between">
          {}
          <div className="grow basis-0">
            <div className="h-24" />
          </div>

          <div className="relative flex w-full flex-col items-center justify-center px-4">
            {children}
          </div>

          <div className="flex grow basis-0 flex-col justify-end">
            {showTerms && (
              <p className="type-caption px-20 py-8 text-center font-medium md:px-0">
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-neutral-600 hover:text-neutral-800"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-neutral-600 hover:text-neutral-800"
                >
                  Privacy Policy
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
