import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Flower2,
  Heart,
  MapPin,
  Shirt,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ServiceCategory } from "@/lib/service-categories";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/footer";

const categories: {
  title: ServiceCategory;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "Photography & Videography",
    description: "Find a team to capture the moments you will remember.",
    Icon: Camera,
  },
  {
    title: "Wedding Venues",
    description: "Explore spaces that feel right for your celebration.",
    Icon: MapPin,
  },
  {
    title: "Decoration & Florist",
    description: "Bring your colours, flowers, and ideas together.",
    Icon: Flower2,
  },
  {
    title: "Catering Services",
    description: "Discover catering options for your wedding guests.",
    Icon: Utensils,
  },
  {
    title: "Makeup & Styling",
    description: "Find beauty professionals for your wedding day.",
    Icon: Sparkles,
  },
  {
    title: "Wedding Fashion",
    description: "Explore outfits and styling for your celebration.",
    Icon: Shirt,
  },
];

const planningSteps = [
  {
    number: "01",
    title: "Explore services",
    description:
      "Browse wedding service categories and find options that suit you.",
  },
  {
    number: "02",
    title: "Send a booking request",
    description:
      "Share your event details with the vendor you are interested in.",
  },
  {
    number: "03",
    title: "Track your plans",
    description:
      "Keep your booking requests and their status together in one place.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-wedplan-cream text-wedplan-ink">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#eaded8] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-wedplan-rose">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Wedding planning, made personal
            </p>

            <h1 className="mt-7 max-w-2xl text-5xl font-semibold leading-[1.06] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
              Find the people who make your{" "}
              <span className="font-serif italic text-wedplan-rose">day</span>{" "}
              unforgettable.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg">
              Discover wedding services, explore your options, and keep your
              planning moving—all in one thoughtful place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full bg-wedplan-rose px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#81484d]"
              >
                Find your vendors
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>

              <Link
                href="#how-it-works"
                className="inline-flex items-center rounded-full border border-[#d9c8c1] px-6 py-3.5 text-sm font-semibold text-wedplan-ink transition hover:bg-white"
              >
                How WedPlan works
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-600">
              <span className="inline-flex items-center gap-2">
                <Check
                  aria-hidden="true"
                  className="h-4 w-4 text-wedplan-rose"
                />
                Browse service categories
              </span>
              <span className="inline-flex items-center gap-2">
                <Check
                  aria-hidden="true"
                  className="h-4 w-4 text-wedplan-rose"
                />
                Track booking requests
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem]">
            <div className="absolute -right-2 top-7 z-10 hidden items-center gap-3 rounded-2xl border border-white bg-white/95 px-4 py-3 shadow-xl sm:flex">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f7eae5] text-wedplan-rose">
                <Heart aria-hidden="true" className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">
                  Made for your story
                </span>
                <span className="block text-xs text-stone-500">
                  Plan at your own pace
                </span>
              </span>
            </div>

            <div className="rounded-[2rem] bg-[#f1e2dc] p-3 sm:p-5">
              <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#edd8ce] via-[#f4e7de] to-[#c88e80] p-6 sm:p-8">
                <div className="absolute -right-10 top-14 h-56 w-56 rounded-full bg-white/35 blur-3xl" />
                <div className="absolute -bottom-10 left-4 h-56 w-56 rounded-full bg-[#8b5752]/20 blur-3xl" />

                <div className="relative flex items-center justify-between">
                  <span className="rounded-full border border-white/60 bg-white/45 px-3 py-1.5 text-[0.65rem] font-semibold tracking-[0.2em] text-[#5f403b]">
                    WEDPLAN INSPIRATION
                  </span>
                  <Heart
                    aria-hidden="true"
                    className="h-5 w-5 text-[#6b4541]"
                  />
                </div>

                <div className="relative max-w-sm">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#694944]">
                    YOUR DAY. YOUR WAY.
                  </p>
                  <h2 className="mt-3 font-serif text-4xl leading-tight text-[#352726] sm:text-5xl">
                    A celebration as <span className="italic">unique</span> as
                    your story.
                  </h2>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-[#614944]">
                    Discover the people and services that can bring your plans
                    together.
                  </p>
                </div>

                <div className="relative flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-3 py-2 text-xs font-medium text-[#543b37]">
                    <CalendarDays aria-hidden="true" className="h-4 w-4" />
                    Plan at your pace
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-3 py-2 text-xs font-medium text-[#543b37]">
                    <Sparkles aria-hidden="true" className="h-4 w-4" />
                    Make it personal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="categories"
          className="scroll-mt-24 border-t border-[#efe5e0] bg-white/70"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
                Explore the essentials
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Start with what matters to you.
              </h2>
              <p className="mt-4 leading-7 text-stone-600">
                Explore wedding service categories and find the right next step
                for your celebration.
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(({ title, description, Icon }) => (
                <Link
                  key={title}
                  href={`/services?category=${encodeURIComponent(title)}`}
                  className="group rounded-2xl border border-[#eee3de] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#704c3f]/5"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f8eeea] text-wedplan-rose">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-wedplan-rose">
                    Explore category
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 bg-[#f4ebe6] px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
                Simple by design
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                A clear next step, whenever you need one.
              </h2>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              {planningSteps.map((step) => (
                <article
                  key={step.number}
                  className="rounded-2xl border border-white/80 bg-white/75 p-6"
                >
                  <span className="text-sm font-semibold tracking-[0.15em] text-wedplan-rose">
                    {step.number}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col items-start justify-between gap-7 rounded-[2rem] bg-[#382d2b] px-7 py-10 text-white sm:px-10 md:flex-row md:items-center md:py-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#e8c7bf]">
                Your plans start here
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Find the services that fit your day.
              </h2>
              <p className="mt-3 max-w-xl leading-7 text-white/75">
                Explore wedding service categories and take planning one step at
                a time.
              </p>
            </div>

            <Link
              href="/services"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-wedplan-rose px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#81484d]"
            >
              Explore services
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
