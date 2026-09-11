import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/shared/components/ui/wordmark";
import {
  ArrowUpRightIcon,
  BellIcon,
  BookOpenIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  FileTextIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LockIcon,
  ShieldIcon,
  TrendingUpIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/shared/components/ui/icons";

export const metadata: Metadata = {
  title: "Digital Pathshala — One calm workspace for your whole school",
  description:
    "Bring students, staff, attendance, fees, exams, notices, assignments, and reports together with Digital Pathshala.",
};

const features = [
  {
    icon: UserPlusIcon,
    eyebrow: "Admissions",
    title: "Every student starts with a complete story.",
    description:
      "Keep profiles, guardians, documents, class history, and credentials together from the first day.",
    className: "lg:col-span-2",
  },
  {
    icon: ClipboardCheckIcon,
    eyebrow: "Attendance",
    title: "A faster morning register.",
    description: "Mark student and staff attendance with section-aware views and useful history.",
    className: "lg:col-span-1",
  },
  {
    icon: CreditCardIcon,
    eyebrow: "Finance",
    title: "Fees that stay understandable.",
    description:
      "Structure charges, record payments, follow balances, and produce receipts without spreadsheet drift.",
    className: "lg:col-span-1",
  },
  {
    icon: GraduationCapIcon,
    eyebrow: "Academics",
    title: "From marks to meaningful progress.",
    description:
      "Plan exams, enter results, publish report cards, and carry academic context across years.",
    className: "lg:col-span-2",
  },
];

const roles = [
  {
    icon: Building2Icon,
    label: "School leaders",
    title: "See the school clearly.",
    description:
      "A focused overview of enrollment, attendance, collections, staff, and school activity.",
    items: ["Operational dashboard", "Audit-ready activity", "Role and permission control"],
  },
  {
    icon: BriefcaseIcon,
    label: "Teachers & staff",
    title: "Spend less time on admin.",
    description:
      "The right classes, students, notices, assignments, and registers—without the noise.",
    items: ["Scoped class access", "Attendance workflows", "Assignments and notices"],
  },
  {
    icon: GraduationCapIcon,
    label: "Students & families",
    title: "Know what happens next.",
    description: "One dependable place for learning updates, fees, results, notices, and records.",
    items: ["Personal dashboard", "Results and reports", "Fee and notice history"],
  },
];

function ProductPreview() {
  const bars = [42, 58, 46, 72, 64, 82, 68];

  return (
    <div className="landing-product-shadow relative mx-auto w-full max-w-[720px] rounded-[28px] border border-white/70 bg-white/90 p-2 shadow-2xl backdrop-blur-sm">
      <div className="overflow-hidden rounded-[22px] border border-stone-200 bg-[#fbfaf7]">
        <div className="flex h-11 items-center justify-between border-b border-stone-200 bg-white px-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-red-300" />
            <span className="size-2 rounded-full bg-amber-300" />
            <span className="size-2 rounded-full bg-emerald-300" />
          </div>
          <div className="flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-500">
            <LockIcon className="size-3" /> digitalpathshala.school
          </div>
          <span className="w-9" />
        </div>

        <div className="grid min-h-[360px] grid-cols-[68px_1fr] sm:grid-cols-[150px_1fr]">
          <aside className="border-r border-stone-200 bg-[#f7f5ef] p-3 sm:p-4">
            <div className="mb-7 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-default text-[10px] font-bold text-white">
                DP
              </span>
              <span className="hidden text-xs font-semibold text-brand-default sm:block">
                Pathshala
              </span>
            </div>
            <div className="space-y-1.5">
              {[
                [LayoutDashboardIcon, "Overview"],
                [UsersIcon, "Students"],
                [ClipboardCheckIcon, "Attendance"],
                [CreditCardIcon, "Finance"],
                [BookOpenIcon, "Academics"],
              ].map(([Icon, label], index) => (
                <div
                  key={label as string}
                  className={`flex h-8 items-center gap-2 rounded-lg px-2.5 text-[11px] font-medium ${
                    index === 0 ? "bg-brand-default text-white" : "text-stone-500"
                  }`}
                >
                  <Icon className="size-3.5 flex-none" />
                  <span className="hidden sm:block">{label as string}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 p-4 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">
                  Thursday · School overview
                </p>
                <h2 className="mt-1 text-base font-semibold tracking-tight text-brand-default sm:text-lg">
                  Good morning, Principal
                </h2>
              </div>
              <span className="relative flex size-8 items-center justify-center rounded-full border border-stone-200 bg-white text-brand-default">
                <BellIcon className="size-3.5" />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-emerald-400 ring-2 ring-white" />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {[
                ["Students", "1,248", "+18 this term"],
                ["Present today", "94.2%", "On track"],
                ["Staff", "86", "82 present"],
                ["Fee collection", "87%", "This month"],
              ].map(([label, value, note]) => (
                <div key={label} className="rounded-xl border border-stone-200 bg-white p-3">
                  <p className="text-[10px] font-medium text-stone-400">{label}</p>
                  <p className="mt-1 text-base font-semibold tracking-tight text-stone-900">
                    {value}
                  </p>
                  <p className="mt-0.5 text-[9px] font-medium text-emerald-600">{note}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[1.45fr_1fr]">
              <div className="rounded-xl border border-stone-200 bg-white p-3.5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-stone-800">Weekly attendance</p>
                    <p className="text-[9px] text-stone-400">Across all active sections</p>
                  </div>
                  <TrendingUpIcon className="size-4 text-emerald-600" />
                </div>
                <div className="flex h-24 items-end gap-2">
                  {bars.map((height, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 items-end rounded-t-sm bg-stone-100"
                    >
                      <span
                        className={`w-full rounded-t-sm ${index === 5 ? "bg-brand-default" : "bg-emerald-200"}`}
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-3.5">
                <p className="text-[11px] font-semibold text-stone-800">Today</p>
                <div className="mt-3 space-y-2.5">
                  {[
                    ["09:00", "Grade 8 attendance"],
                    ["11:30", "Parent meeting"],
                    ["14:00", "Exam review"],
                  ].map(([time, event], index) => (
                    <div key={event} className="flex items-center gap-2.5">
                      <span
                        className={`size-1.5 flex-none rounded-full ${index === 0 ? "bg-brand-default" : "bg-stone-300"}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-medium text-stone-700">{event}</p>
                        <p className="text-[9px] text-stone-400">{time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="landing-float-card absolute -bottom-8 -left-3 hidden w-48 rounded-2xl border border-emerald-100 bg-white p-3.5 shadow-xl sm:block lg:-left-10">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2Icon className="size-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-stone-900">Attendance complete</p>
            <p className="text-[10px] text-stone-400">18 of 18 sections</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="landing-page overflow-hidden bg-[#fbfaf7] text-stone-800">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-brand-default px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fbfaf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Digital Pathshala home">
            <Wordmark textClassName="text-[15px]" />
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
            <a href="#platform" className="landing-nav-link">
              Platform
            </a>
            <a href="#features" className="landing-nav-link">
              Features
            </a>
            <a href="#roles" className="landing-nav-link">
              For your team
            </a>
            <a href="#security" className="landing-nav-link">
              Security
            </a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="landing-action hidden rounded-lg px-3 py-2 font-semibold text-brand-default transition hover:bg-brand-subtle sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="landing-action inline-flex items-center gap-1.5 rounded-lg bg-brand-default px-4 py-2.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-hover hover:shadow-md"
            >
              Create your school <ArrowUpRightIcon className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <section id="main-content" className="relative px-5 pb-24 pt-18 sm:px-8 sm:pb-32 sm:pt-24">
        <div className="landing-hero-glow absolute inset-x-0 top-0 -z-0 mx-auto h-[700px] max-w-6xl" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="landing-caption landing-rise inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 font-semibold text-brand-default shadow-sm backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Built for the rhythm of modern schools
            </div>
            <h1 className="landing-display landing-rise landing-delay-1 mt-7 text-balance text-[3.25rem] font-semibold leading-[0.98] tracking-[-0.055em] text-brand-default sm:text-[4.75rem] lg:text-[6rem]">
              Your whole school,
              <span className="landing-editorial mt-2 block font-normal text-emerald-700">
                moving as one.
              </span>
            </h1>
            <p className="landing-body-lg landing-rise landing-delay-2 mx-auto mt-7 max-w-2xl text-pretty text-stone-600">
              Digital Pathshala brings people, learning, operations, and communication into one calm
              workspace—so your team can focus on helping every student move forward.
            </p>
            <div className="landing-rise landing-delay-3 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="landing-action inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-default px-6 font-semibold text-white shadow-[0_12px_30px_rgba(6,78,59,.2)] transition hover:-translate-y-0.5 hover:bg-brand-hover sm:w-auto"
              >
                Start with your school <ArrowUpRightIcon className="size-4" />
              </Link>
              <a
                href="#platform"
                className="landing-action inline-flex h-12 w-full items-center justify-center rounded-xl border border-stone-300 bg-white/70 px-6 font-semibold text-stone-700 transition hover:border-brand-default hover:text-brand-default sm:w-auto"
              >
                Explore the platform
              </a>
            </div>
            <p className="landing-caption landing-rise landing-delay-3 mt-4 flex items-center justify-center gap-2 text-stone-500">
              <ShieldIcon className="size-3.5 text-emerald-700" /> Role-aware by design · Set up
              without a credit card
            </p>
          </div>

          <div className="landing-rise landing-delay-4 relative mt-18 px-1 sm:mt-24 sm:px-8">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white/65 px-5 py-8 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3 sm:divide-x sm:divide-stone-200">
          {[
            ["One source of truth", "No more chasing records across scattered tools."],
            [
              "Every role, considered",
              "Focused access for leaders, staff, students, and families.",
            ],
            ["Built for continuity", "Keep the school story connected across academic years."],
          ].map(([title, description]) => (
            <div key={title} className="px-4 text-center sm:px-8">
              <p className="landing-body-sm font-semibold text-brand-default">{title}</p>
              <p className="landing-caption mt-1 text-stone-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="platform" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_.8fr]">
            <div>
              <p className="landing-eyebrow">One connected platform</p>
              <h2 className="landing-section-heading mt-4 max-w-3xl">
                The work of a school is connected. Its software should be too.
              </h2>
            </div>
            <p className="landing-body max-w-xl text-stone-600 lg:justify-self-end">
              A change in one place should make the next task easier—not create another spreadsheet.
              Digital Pathshala keeps context flowing across your school day.
            </p>
          </div>

          <div className="mt-14 grid overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm lg:grid-cols-4">
            {[
              [UserPlusIcon, "Admit", "Create a complete student record"],
              [CalendarDaysIcon, "Organize", "Connect years, classes, and sections"],
              [ClipboardCheckIcon, "Operate", "Run attendance, fees, and learning"],
              [FileTextIcon, "Understand", "Turn daily work into useful reports"],
            ].map(([Icon, title, description], index) => (
              <div
                key={title as string}
                className="group relative border-b border-stone-200 p-6 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
              >
                <span className="mb-10 flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-brand-default transition group-hover:bg-brand-default group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <span className="absolute right-5 top-5 text-xs font-semibold text-stone-300">
                  0{index + 1}
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-stone-900">
                  {title as string}
                </h3>
                <p className="landing-body-sm mt-2 text-stone-500">{description as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#f2f0e9] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="landing-eyebrow">Made for the everyday</p>
            <h2 className="landing-section-heading mt-4">Depth where your school needs it.</h2>
            <p className="landing-body mt-5 text-stone-600">
              Thoughtful workflows for the moments that shape a school—from a first admission to a
              final report card.
            </p>
          </div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className={`${feature.className} group min-h-[300px] overflow-hidden rounded-[26px] border border-stone-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-9`}
                >
                  <div className="flex h-full flex-col">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-brand-default text-white shadow-sm">
                      <Icon className="size-5" />
                    </span>
                    <div className="mt-auto pt-16">
                      <p className="landing-eyebrow">{feature.eyebrow}</p>
                      <h3 className="mt-3 max-w-lg text-2xl font-semibold tracking-[-0.025em] text-stone-900 sm:text-3xl">
                        {feature.title}
                      </h3>
                      <p className="landing-body-sm mt-3 max-w-xl text-stone-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="roles" className="px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="landing-eyebrow">Clarity for every role</p>
            <h2 className="landing-section-heading mt-4">
              One school community. Three focused experiences.
            </h2>
          </div>
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {roles.map((role, index) => {
              const Icon = role.icon;
              return (
                <article
                  key={role.label}
                  className={`rounded-[26px] border p-7 sm:p-8 ${
                    index === 0
                      ? "border-brand-default bg-brand-default text-white shadow-[0_24px_60px_rgba(6,78,59,.16)]"
                      : "border-stone-200 bg-white text-stone-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex size-10 items-center justify-center rounded-xl ${index === 0 ? "bg-white/12 text-emerald-200" : "bg-emerald-50 text-brand-default"}`}
                    >
                      <Icon className="size-5" />
                    </span>
                    <p
                      className={`landing-caption font-semibold tracking-[0.12em] uppercase ${index === 0 ? "text-emerald-200" : "text-emerald-700"}`}
                    >
                      {role.label}
                    </p>
                  </div>
                  <h3 className="mt-9 text-2xl font-semibold tracking-tight">{role.title}</h3>
                  <p
                    className={`landing-body-sm mt-3 ${index === 0 ? "text-emerald-50/80" : "text-stone-500"}`}
                  >
                    {role.description}
                  </p>
                  <ul className="mt-8 space-y-3">
                    {role.items.map((item) => (
                      <li
                        key={item}
                        className="landing-body-sm flex items-center gap-2.5 font-medium"
                      >
                        <CheckIcon
                          className={`size-4 ${index === 0 ? "text-emerald-300" : "text-emerald-700"}`}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="security" className="px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[32px] bg-stone-950 lg:grid-cols-[1fr_.82fr]">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="landing-eyebrow text-emerald-300">Trust is infrastructure</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl sm:leading-[1.08]">
              The right information, in the right hands.
            </h2>
            <p className="landing-body mt-6 max-w-xl text-stone-400">
              Multi-school isolation, permission-aware workflows, secure sessions, and accountable
              activity are built into the foundation—not added as an afterthought.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                [ShieldIcon, "Tenant-scoped records"],
                [LockIcon, "Role-based permissions"],
                [FileTextIcon, "Audit activity"],
                [HeartHandshakeIcon, "Privacy-minded workflows"],
              ].map(([Icon, label]) => (
                <div
                  key={label as string}
                  className="landing-body-sm flex items-center gap-3 text-stone-200"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white/8 text-emerald-300">
                    <Icon className="size-4" />
                  </span>
                  {label as string}
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[360px] border-t border-white/10 bg-brand-default p-8 lg:border-l lg:border-t-0 lg:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(74,222,128,.2),transparent_35%)]" />
            <div className="relative flex h-full flex-col justify-between">
              <ShieldIcon className="size-16 text-emerald-300" />
              <div>
                <p className="landing-editorial text-3xl leading-tight text-white sm:text-4xl">
                  “Good systems create room for better human decisions.”
                </p>
                <p className="landing-caption mt-6 font-semibold tracking-[0.14em] text-emerald-200 uppercase">
                  The Digital Pathshala principle
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-emerald-200 bg-emerald-50 px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,.9),transparent_35%)]" />
          <div className="relative mx-auto max-w-3xl">
            <p className="landing-eyebrow">A calmer school day starts here</p>
            <h2 className="landing-section-heading mt-4">Bring your school into one clear view.</h2>
            <p className="landing-body mx-auto mt-5 max-w-xl text-stone-600">
              Create your school workspace, invite your team, and build a more connected path from
              administration to learning.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="landing-action inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-default px-6 font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-brand-hover"
              >
                Create your school <ArrowUpRightIcon className="size-4" />
              </Link>
              <Link
                href="/login"
                className="landing-action inline-flex h-12 items-center justify-center rounded-xl border border-emerald-200 bg-white px-6 font-semibold text-brand-default transition hover:border-brand-default"
              >
                Log in to your workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Wordmark />
            <p className="landing-footer-copy mt-3 max-w-sm text-stone-500">
              A connected school management system for the people who keep learning moving.
            </p>
          </div>
          <div className="landing-footer-copy flex flex-wrap gap-x-6 gap-y-3 font-medium text-stone-500">
            <Link href="/login" className="hover:text-brand-default">
              Log in
            </Link>
            <Link href="/register" className="hover:text-brand-default">
              Register
            </Link>
            <Link href="#features" className="hover:text-brand-default">
              Features
            </Link>
            <Link href="#security" className="hover:text-brand-default">
              Security
            </Link>
          </div>
        </div>
        <div className="landing-caption mx-auto mt-10 max-w-7xl border-t border-stone-100 pt-6 text-stone-400">
          © {new Date().getFullYear()} Digital Pathshala. Built for better school days.
        </div>
      </footer>
    </main>
  );
}
