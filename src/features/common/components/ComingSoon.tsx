import { ClockIcon } from "@/shared/components/ui/icons";

export function ComingSoon({ feature }: { feature: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <ClockIcon className="size-10 text-neutral-300" />
      <div>
        <h2 className="type-section-title">{feature}</h2>
        <p className="type-body-secondary mt-1">This feature is coming soon.</p>
      </div>
    </div>
  );
}
