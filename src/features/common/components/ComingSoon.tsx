import { ClockIcon } from "@/shared/components/ui/icons";

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <ClockIcon className="size-10 text-neutral-300" />
      <div>
        <h2 className="text-lg font-semibold text-neutral-800">{feature}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          This feature is coming soon.
        </p>
      </div>
    </div>
  );
}
