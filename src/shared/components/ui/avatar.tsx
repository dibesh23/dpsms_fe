import { cn } from "@/shared/lib/cn";
import { formatInitials } from "@/shared/lib/format";

const AVATAR_SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-xs",
  lg: "h-10 w-10 text-sm",
} as const;

const AVATAR_COLORS = [
  "bg-neutral-900 text-white",
  "bg-neutral-700 text-white",
  "bg-neutral-500 text-white",
  "bg-neutral-300 text-neutral-800",
  "bg-neutral-200 text-neutral-700",
] as const;

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  const color = AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
  return (
    <span
      className={cn(
        "flex flex-none select-none items-center justify-center rounded-full font-semibold",
        AVATAR_SIZES[size],
        color,
        className,
      )}
      aria-hidden="true"
    >
      {formatInitials(name)}
    </span>
  );
}
