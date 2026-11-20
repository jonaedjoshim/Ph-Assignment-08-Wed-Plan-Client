"use client";

import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  Flower2,
  Heart,
  ListChecks,
  MapPin,
  ShieldCheck,
  Shirt,
  Sparkles,
  Utensils,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import {
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from "@/lib/service-categories";

type FeaturedVendor = {
  name: string;
  businessName: string;
};

type FeaturedService = {
  _id: string;
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  location: string;
  images: string[];
  vendor: FeaturedVendor | null;
};

type FeaturedState =
  | { status: "loading" }
  | { status: "ready"; services: FeaturedService[] }
  | { status: "error"; message: string };

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const FEATURED_LIMIT = 6;

const categoryIcons: Record<ServiceCategory, LucideIcon> = {
  "Photography & Videography": Camera,
  "Wedding Venues": MapPin,
  "Decoration & Florist": Flower2,
  "Catering Services": Utensils,
  "Makeup & Styling": Sparkles,
  "Wedding Fashion": Shirt,
};

const categoryArtwork: Record<ServiceCategory, string> = {
  "Photography & Videography":
    "bg-gradient-to-br from-rose-200 via-amber-100 to-orange-200",
  "Wedding Venues":
    "bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-200",
  "Decoration & Florist":
    "bg-gradient-to-br from-pink-200 via-rose-100 to-lime-100",
  "Catering Services":
    "bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-200",
  "Makeup & Styling":
    "bg-gradient-to-br from-fuchsia-200 via-pink-100 to-orange-100",
  "Wedding Fashion":
    "bg-gradient-to-br from-violet-200 via-rose-100 to-amber-100",
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const categories: { title: ServiceCategory; description: string }[] = [
  {
    title: "Photography & Videography",
    description: "Find a team to capture the moments you will remember.",
  },
  {
    title: "Wedding Venues",
    description: "Explore spaces that feel right for your celebration.",
  },
  {
    title: "Decoration & Florist",
    description: "Bring your colours, flowers, and ideas together.",
  },
  {
    title: "Catering Services",
    description: "Discover catering options for your wedding guests.",
  },
  {
    title: "Makeup & Styling",
    description: "Find beauty professionals for your wedding day.",
  },
  {
    title: "Wedding Fashion",
    description: "Explore outfits and styling for your celebration.",
  },
];

const whyChoosePoints: {
  title: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "Moderated listings",
    description:
      "Every service is reviewed by the WedPlan team before customers can see it.",
    Icon: ShieldCheck,
  },
  {
    title: "Clear booking status",
    description:
      "Follow each request from pending to accepted or rejected in one dashboard.",
    Icon: ListChecks,
  },
  {
    title: "Transparent pricing",
    description:
      "Prices, locations, and vendor details are shown upfront so you can compare options.",
    Icon: Wallet,
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

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isServiceCategory(value: unknown): value is ServiceCategory {
  return (
    typeof value === "string" &&
    (SERVICE_CATEGORIES as readonly string[]).includes(value)
  );
}

function getApiErrorMessage(value: unknown): string | null {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return null;
}

function parseVendor(value: unknown): FeaturedVendor | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    name: typeof value.name === "string" ? value.name : "",
    businessName:
      typeof value.businessName === "string" ? value.businessName : "",
  };
}

function getVendorLabel(vendor: FeaturedVendor | null): string | null {
  const label = vendor?.businessName.trim() || vendor?.name.trim();

  return label ? label : null;
}

function parseFeaturedService(value: unknown): FeaturedService | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value._id;
  const serviceName = value.serviceName;
  const category = value.category;
  const description = value.description;
  const price = value.price;
  const location = value.location;
  const images = Array.isArray(value.images)
    ? value.images.filter((image): image is string => typeof image === "string")
    : [];

  if (
    typeof id !== "string" ||
    typeof serviceName !== "string" ||
    !isServiceCategory(category) ||
    typeof description !== "string" ||
    typeof price !== "number" ||
    typeof location !== "string"
  ) {
    return null;
  }

  return {
    _id: id,
    serviceName,
    category,
    description,
    price,
    location,
    images,
    vendor: parseVendor(value.vendor),
  };
}

function parseFeaturedServices(value: unknown): FeaturedService[] | null {
  if (
    !isRecord(value) ||
    value.success !== true ||
    !Array.isArray(value.services)
  ) {
    return null;
  }

  const services: FeaturedService[] = [];

  for (const item of value.services) {
    const service = parseFeaturedService(item);

    if (!service) {
      return null;
    }

    services.push(service);
  }

  return services;
}

function FeaturedServiceSkeletons() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Loading featured services
      </p>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <article
            key={item}
            aria-hidden="true"
            className="overflow-hidden rounded-2xl border border-[#eee3de] bg-white"
          >
            <div className="h-48 animate-pulse bg-[#eaded8]" />

            <div className="space-y-4 p-5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-[#eaded8]" />
              <div className="h-4 w-full animate-pulse rounded bg-[#f0e8e4]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[#f0e8e4]" />
              <div className="mt-6 h-8 w-full animate-pulse rounded bg-[#eaded8]" />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function FeaturedServiceCard({ service }: { service: FeaturedService }) {
  const Icon = categoryIcons[service.category];
  const imageUrl = service.images[0];
  const vendorLabel = getVendorLabel(service.vendor);

  return (
    <motion.article
      variants={fadeUp}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#eee3de] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#704c3f]/5"
    >
      <div
        className={`relative flex h-48 items-end overflow-hidden p-5 ${categoryArtwork[service.category]}`}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={service.serviceName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="object-cover"
          />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10"
        />

        <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#4f3d38] backdrop-blur">
          <Icon aria-hidden="true" className="h-4 w-4" />
          {service.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold leading-snug">
          {service.serviceName}
        </h3>

        {vendorLabel && (
          <p className="mt-1 text-sm text-stone-500">by {vendorLabel}</p>
        )}

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600">
          {service.description}
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
          <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
          {service.location}
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-3 border-t border-[#f0e8e4] pt-4">
            <span className="text-lg font-semibold text-wedplan-ink">
              {priceFormatter.format(service.price)}
            </span>

            <Link
              href={`/services/${service._id}`}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-wedplan-rose px-4 text-sm font-semibold text-white transition hover:bg-[#81484d]"
            >
              View Details
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function HomePage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [featured, setFeatured] = useState<FeaturedState>({
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeaturedServices() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/services?limit=${FEATURED_LIMIT}&sort=newest`,
          {
            signal: controller.signal,
          },
        );

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load services (HTTP ${response.status}).`,
          );
        }

        const services = parseFeaturedServices(payload);

        if (!services) {
          throw new Error("The services API returned an unexpected response.");
        }

        if (controller.signal.aborted) {
          return;
        }

        setFeatured({ status: "ready", services });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setFeatured({
          status: "error",
          message:
            error instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : error instanceof Error
                ? error.message
                : "Could not load featured services.",
        });
      }
    }

    void loadFeaturedServices();

    return () => controller.abort();
  }, [reloadKey]);

  function retryFeaturedServices() {
    setFeatured({ status: "loading" });
    setReloadKey((current) => current + 1);
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-wedplan-cream text-wedplan-ink">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 md:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
              planning moving, all in one thoughtful place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full bg-wedplan-rose px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#81484d]"
              >
                Explore Wedding Services
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mx-auto w-full max-w-[34rem]"
          >
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
          </motion.div>
        </section>

        <section
          id="featured-services"
          className="scroll-mt-24 border-t border-[#efe5e0] bg-white/70"
        >
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
                  Featured services
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Wedding services ready for your plans.
                </h2>
                <p className="mt-4 leading-7 text-stone-600">
                  Explore approved services from WedPlan vendors and open any
                  listing to see full details.
                </p>
              </div>

              <Link
                href="/services"
                className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-wedplan-rose transition hover:text-[#81484d]"
              >
                View all services
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10">
              {featured.status === "loading" && <FeaturedServiceSkeletons />}

              {featured.status === "error" && (
                <div
                  role="alert"
                  className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
                >
                  <h3 className="text-lg font-semibold text-red-800">
                    Featured services could not be loaded.
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-red-700">
                    {featured.message}
                  </p>
                  <button
                    type="button"
                    onClick={retryFeaturedServices}
                    className="mt-5 inline-flex min-h-10 items-center rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white transition hover:brightness-95"
                  >
                    Try again
                  </button>
                </div>
              )}

              {featured.status === "ready" &&
                featured.services.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#d9c8c1] bg-white/70 px-6 py-14 text-center">
                    <h3 className="text-lg font-semibold">
                      No approved services are available yet.
                    </h3>
                    <p className="mt-2 text-sm text-stone-600">
                      Approved vendor listings will appear here.
                    </p>
                  </div>
                )}

              {featured.status === "ready" && featured.services.length > 0 && (
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.15 }}
                  className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {featured.services.map((service) => (
                    <FeaturedServiceCard key={service._id} service={service} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </section>

        <section className="scroll-mt-24">
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
              {categories.map(({ title, description }) => {
                const Icon = categoryIcons[title];

                return (
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
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-[#efe5e0] bg-white/70">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.4 }}
              className="max-w-2xl"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
                The WedPlan difference
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Why Choose WedPlan?
              </h2>
              <p className="mt-4 leading-7 text-stone-600">
                Wedding planning involves many decisions. WedPlan keeps service
                discovery, booking requests, and status updates organised in one
                place.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="mt-9 grid gap-4 md:grid-cols-3"
            >
              {whyChoosePoints.map(({ title, description, Icon }) => (
                <motion.article
                  key={title}
                  variants={fadeUp}
                  className="rounded-2xl border border-[#eee3de] bg-white p-6"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f8eeea] text-wedplan-rose">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {description}
                  </p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 bg-[#f4ebe6] px-5 py-20 sm:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
                How WedPlan works
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
              Explore Wedding Services
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
