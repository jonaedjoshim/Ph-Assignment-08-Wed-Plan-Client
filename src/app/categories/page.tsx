import {
  ArrowRight,
  Building2,
  Camera,
  Flower2,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

type WeddingCategory = {
  name: string;
  description: string;
  icon: LucideIcon;
};

const weddingCategories: WeddingCategory[] = [
  {
    name: "Photography & Videography",
    description:
      "Candid moments, portraits and cinematic films to keep your wedding memories alive.",
    icon: Camera,
  },
  {
    name: "Wedding Venues",
    description:
      "Banquet halls, gardens and resorts for your ceremony and reception.",
    icon: Building2,
  },
  {
    name: "Decoration & Florist",
    description:
      "Stage design, floral arrangements and themed decor that match your style.",
    icon: Flower2,
  },
  {
    name: "Catering Services",
    description:
      "Menus, buffet setups and serving teams for guests of every size.",
    icon: UtensilsCrossed,
  },
  {
    name: "Makeup & Styling",
    description: "Bridal makeup, hair styling and grooming for the big day.",
    icon: Sparkles,
  },
  {
    name: "Wedding Fashion",
    description:
      "Bridal wear, groom outfits and custom tailoring for every ceremony.",
    icon: Shirt,
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

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
        <section className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
            Explore by category
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Wedding service categories
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-600">
            Pick a category to see approved wedding services from our vendors.
          </p>
        </section>

        <section
          aria-label="Wedding service categories"
          className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {weddingCategories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.name}
                href={`/services?category=${encodeURIComponent(category.name)}`}
                className="group flex flex-col rounded-3xl border border-[#eaded8] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#d9c4bb] hover:shadow-md"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f5eae5] text-wedplan-rose">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>

                <h2 className="mt-5 text-lg font-semibold text-wedplan-ink">
                  {category.name}
                </h2>

                <p className="mt-2 flex-1 text-sm leading-6 text-stone-600">
                  {category.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-wedplan-rose">
                  Browse services
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            );
          })}
        </section>

        <section className="mt-12 flex flex-col items-start justify-between gap-5 rounded-3xl bg-wedplan-rose px-8 py-8 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">Not sure what you need?</h2>
            <p className="mt-2 text-sm leading-6 text-white/85">
              Browse all approved services and filter by price or location.
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-wedplan-rose transition hover:bg-[#f8f2ef]"
          >
            Browse all services
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
