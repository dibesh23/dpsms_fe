import React from "react";
import { BrandMark } from "./BrandMark";

const FEATURES = [
  "Student & teacher management",
  "Attendance & exam tracking",
  "Fee management & reporting",
  "Multi-tenant school support",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="relative hidden overflow-hidden bg-[#0d3320] lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#156d39]/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <BrandMark variant="dark" />
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Run your whole school from one place.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-emerald-100/80">
            Attendance, exams, fees and notices — built for Nepali schools by
            Digital Pathshala.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/20">
                <svg
                  className="h-3 w-3 text-emerald-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-sm text-emerald-50/90">{feature}</span>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-xs text-emerald-100/60">
          © {new Date().getFullYear()} Digital Pathshala Nepal. All rights
          reserved.
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandMark variant="light" />
          </div>

          <div className="animate-rise rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 lg:hidden">
            © {new Date().getFullYear()} Digital Pathshala Nepal. All rights
            reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
