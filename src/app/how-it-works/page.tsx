import {
  ArrowRight,
  CalendarCheck,
  Crown,
  Search,
  Store,
  UserPlus,
  MessageSquareText,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/footer";
import { Reveal } from "@/components/reveal";
import { SiteHeader } from "@/components/site-header";

type HowItWorksStep = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const customerSteps: HowItWorksStep[] = [
  {
    title: "Browse services",
    description:
      "Search wedding services by name, filter by category and location, and sort by price.",
    icon: Search,
  },
  {
    title: "Send a booking request",
    description:
      "Pick your event date, enter the event location and add a message for the vendor.",
    icon: CalendarCheck,
  },
  {
    title: "Track your bookings",
    description:
      "Follow each request from pending to accepted or rejected in your customer dashboard.",
    icon: MessageSquareText,
  },
];

const vendorSteps: HowItWorksStep[] = [
  {
    title: "Create a vendor account",
    description:
      "Sign up as a vendor and add your business name to start listing services.",
    icon: UserPlus,
  },
  {
    title: "Publish your services",
    description:
      "Add service details and images. Each service is reviewed by our admin team before it appears publicly.",
    icon: Store,
  },
  {
    title: "Manage booking requests",
    description:
      "Accept or reject pending requests from customers and keep your availability up to date.",
    icon: CalendarCheck,
  },
  {
    title: "Choose a paid plan",
    description:
      "Pick Starter for up to ten active services or Premium for unlimited listings and a vendor badge, with secure Stripe checkout.",
    icon: Crown,
  },
];

function SiteHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[73px] border-b border-[#eaded8]/70 bg-[#fffaf7]/90"
    />
  );
}

function StepList({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: HowItWorksStep[];
}) {
  return (
    <section className="mt-12">
      <Reveal>
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <ol className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <li
                key={step.title}
                className="rounded-3xl border border-[#eaded8] bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f5eae5] text-wedplan-rose">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </span>
                  <span className="text-sm font-semibold text-stone-400">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold text-wedplan-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </Reveal>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="mx-auto max-w-7xl flex-1 px-5 py-12 sm:px-8 lg:py-16">
        <Reveal>
          <section className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
              How WedPlan works
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Plan your wedding with trusted vendors
            </h1>
            <p className="mt-4 text-base leading-7 text-stone-600">
              WedPlan connects couples with wedding service vendors. Here is how
              it works for customers and vendors.
            </p>
          </section>
        </Reveal>

        <StepList
          title="For customers"
          description="Find a service, send a booking request and track its status."
          steps={customerSteps}
        />

        <StepList
          title="For vendors"
          description="List your services, manage requests and grow your business."
          steps={vendorSteps}
        />

        <Reveal delay={0.1}>
          <section className="mt-12 flex flex-col items-start justify-between gap-5 rounded-3xl bg-wedplan-rose px-8 py-8 text-white sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">Ready to start?</h2>
              <p className="mt-2 text-sm leading-6 text-white/85">
                Browse approved wedding services or create a free account.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-wedplan-rose transition hover:bg-[#f8f2ef]"
              >
                Browse services
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex min-h-11 items-center rounded-full border border-white/60 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Create account
              </Link>
            </div>
          </section>
        </Reveal>
      </main>

      <SiteFooter />
    </div>
  );
}
