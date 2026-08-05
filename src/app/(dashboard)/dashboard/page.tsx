import { cn } from "@/shared/lib/cn";
import Link from "next/link";
import { DotsPattern } from "@/shared/components/ui/dots-pattern";

const PLACEHOLDER_SECTIONS = [
  {
    title: "Students",
    description: "Manage student records, profiles and admissions.",
    href: "/students",
  },
  {
    title: "Teachers",
    description: "Manage teacher accounts and assignments.",
    href: "/teachers",
  },
  {
    title: "Attendance",
    description: "Track daily attendance across classes.",
    href: "/attendance",
  },
  {
    title: "Exams & Grades",
    description: "Schedule exams and record results.",
    href: "/exams",
  },
  {
    title: "Fees",
    description: "Track fee payments and invoices.",
    href: "/fees",
  },
  {
    title: "Notices",
    description: "Broadcast SMS and email notices.",
    href: "/notices",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to Digital Pathshala
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your school management dashboard. Choose a module to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDER_SECTIONS.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="group relative block overflow-hidden rounded-lg border border-neutral-200 bg-bg-default p-5 transition-all hover:border-neutral-300 hover:shadow-sm"
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-y-0 left-1/2 w-[400px] -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100",
              )}
              role="presentation"
            >
              <DotsPattern patternOffset={[1, 4]} className="text-neutral-100" />
            </div>
            <div className="relative">
              <h2 className="text-sm font-semibold text-neutral-900">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {section.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}