import Link from "next/link";
import { HomeIcon } from "@/shared/components/ui/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#fbfaf7] px-5 py-12">
      <div className="max-w-xl text-center">
        <span className="landing-eyebrow">404 · Page not found</span>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-brand-default sm:text-5xl">
          This page is not on the timetable.
        </h1>
        <p className="landing-body mx-auto mt-5 max-w-md text-stone-600">
          The address may have changed, or you may not have access to this part of Digital
          Pathshala.
        </p>
        <Link
          href="/"
          className="landing-action mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-default px-6 font-semibold text-white transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-default"
        >
          <HomeIcon className="size-4" /> Return home
        </Link>
      </div>
    </main>
  );
}
