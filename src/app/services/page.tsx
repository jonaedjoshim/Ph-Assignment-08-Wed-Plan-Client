"use client";

import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import {
  Camera,
  Flower2,
  MapPin,
  Search,
  Shirt,
  Sparkles,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { DEMO_SERVICES } from "@/lib/demo-services";
import {
  SERVICE_CATEGORIES,
  type ServiceCategory,
} from "@/lib/service-categories";
import { SiteHeader } from "@/components/side-header";
import { SiteFooter } from "@/components/footer";

type CategoryFilter = "All categories" | ServiceCategory;
type SortOrder = "recommended" | "price-ascending" | "price-descending";

function isServiceCategory(value: string | null): value is ServiceCategory {
  return value !== null && (SERVICE_CATEGORIES as readonly string[]).includes(value);
}

const categoryFilters: CategoryFilter[] = [
  "All categories",
  ...SERVICE_CATEGORIES,
];

const categoryIcons: Record<ServiceCategory, LucideIcon> = {
  "Photography & Videography": Camera,
  "Wedding Venues": MapPin,
  "Decoration & Florist": Flower2,
  "Catering Services": Utensils,
  "Makeup & Styling": Sparkles,
  "Wedding Fashion": Shirt,
};

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-wedplan-cream text-wedplan-ink">
      <SiteHeader />

      <main>
        <Suspense fallback={<ServicesLoading />}>
          <ServicesPageContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}

function ServicesPageContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const initialCategory: CategoryFilter = isServiceCategory(category)
    ? category
    : "All categories";

  return (
    <ServicesBrowser
      key={initialCategory}
      initialCategory={initialCategory}
    />
  );
}

function ServicesLoading() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <p role="status" className="text-sm text-stone-500">
        Loading services…
      </p>
    </section>
  );
}

function ServicesBrowser({
  initialCategory,
}: {
  initialCategory: CategoryFilter;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>(initialCategory);
  const [sortOrder, setSortOrder] = useState<SortOrder>("recommended");

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();

    const results = DEMO_SERVICES.filter((service) => {
      const matchesCategory =
        activeCategory === "All categories" ||
        service.category === activeCategory;

      const searchableText = [
        service.name,
        service.vendorName,
        service.category,
        service.location,
        service.description,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(query);
    });

    if (sortOrder === "price-ascending") {
      results.sort(
        (first, second) => first.startingPrice - second.startingPrice,
      );
    }

    if (sortOrder === "price-descending") {
      results.sort(
        (first, second) => second.startingPrice - first.startingPrice,
      );
    }

    return results;
  }, [activeCategory, search, sortOrder]);

  function clearFilters() {
    setSearch("");
    setActiveCategory("All categories");
    setSortOrder("recommended");
  }

  return (
    <>
      <section className="border-b border-[#eaded8] bg-white/65">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="text-sm text-stone-500">
            <Link href="/" className="transition hover:text-wedplan-rose">
              Home
            </Link>
            <span aria-hidden="true" className="px-2">
              /
            </span>
            <span className="font-medium text-wedplan-ink">
              Find services
            </span>
          </div>

          <div className="mt-6 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
              Your celebration, your way
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Find wedding services that feel right.
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-stone-600">
              Search by service, vendor, or location, then narrow down your
              options by category and price.
            </p>
          </div>

          <div className="mt-8 max-w-2xl">
            <label htmlFor="service-search" className="sr-only">
              Search services, vendors, or locations
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-[#e7d9d2] bg-white px-4 shadow-sm transition focus-within:border-wedplan-rose focus-within:ring-4 focus-within:ring-[#96575b]/10">
              <Search
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-stone-400"
              />
              <input
                id="service-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try photography, venues, or Dhaka"
                className="min-h-14 w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-semibold">Browse by category</h2>
            <p className="mt-1 text-sm text-stone-500">
              Choose a category to narrow down the listings.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {categoryFilters.map((category) => {
              const isActive = activeCategory === category;

              return (
                <Button
                  key={category}
                  type="button"
                  size="sm"
                  radius="full"
                  variant={isActive ? "solid" : "bordered"}
                  aria-pressed={isActive}
                  onPress={() => setActiveCategory(category)}
                  className={
                    isActive
                      ? "shrink-0 border border-wedplan-rose bg-wedplan-rose font-medium text-white"
                      : "shrink-0 border-[#e3d4cd] bg-white font-medium text-stone-700"
                  }
                >
                  {category}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-[#eaded8] bg-white/80 p-4 sm:flex sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm leading-6 text-stone-600">
            <span className="mr-2 inline-flex rounded-full bg-[#f7eae5] px-2.5 py-1 text-xs font-semibold text-wedplan-rose">
              Preview listings
            </span>
            Sample data for now; approved services will load from the WedPlan
            API.
          </p>

          <div className="mt-4 flex items-center gap-3 sm:mt-0">
            <label
              htmlFor="sort-services"
              className="shrink-0 text-sm text-stone-500"
            >
              Sort by
            </label>
            <select
              id="sort-services"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as SortOrder)
              }
              className="min-h-10 rounded-xl border border-[#e7d9d2] bg-white px-3 text-sm text-wedplan-ink outline-none focus:border-wedplan-rose"
            >
              <option value="recommended">Recommended</option>
              <option value="price-ascending">Price: low to high</option>
              <option value="price-descending">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-stone-600">
            Showing{" "}
            <span className="font-semibold text-wedplan-ink">
              {filteredServices.length}
            </span>{" "}
            {filteredServices.length === 1 ? "service" : "services"}
          </p>

          {(search || activeCategory !== "All categories") && (
            <Button
              type="button"
              size="sm"
              radius="full"
              variant="light"
              onPress={clearFilters}
              className="font-medium text-wedplan-rose"
            >
              Clear filters
            </Button>
          )}
        </div>

        {filteredServices.length > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const Icon = categoryIcons[service.category];

              return (
                <motion.article
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  aria-labelledby={`service-${service.id}`}
                  className="overflow-hidden rounded-2xl border border-[#eee3de] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#704c3f]/5"
                >
                  <div
                    className={`relative flex h-44 items-end overflow-hidden p-5 ${service.artworkClass}`}
                  >
                    <div
                      aria-hidden="true"
                      className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/35 blur-2xl"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute -bottom-12 left-12 h-36 w-36 rounded-full bg-white/35 blur-2xl"
                    />

                    <span className="relative inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#4f3d38] backdrop-blur">
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      {service.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-wedplan-rose">
                      {service.vendorName}
                    </p>

                    <h2
                      id={`service-${service.id}`}
                      className="mt-2 text-lg font-semibold leading-snug"
                    >
                      {service.name}
                    </h2>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-stone-600">
                      {service.description}
                    </p>

                    <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
                      <MapPin aria-hidden="true" className="h-4 w-4" />
                      {service.location}
                    </div>

                    <div className="mt-5 flex items-end justify-between border-t border-[#f0e8e4] pt-4">
                      <span className="text-xs text-stone-500">
                        Starting from
                      </span>
                      <span className="text-lg font-semibold text-wedplan-ink">
                        {priceFormatter.format(service.startingPrice)}
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-[#d9c8c1] bg-white/70 px-6 py-14 text-center">
            <Search
              aria-hidden="true"
              className="mx-auto h-8 w-8 text-wedplan-rose"
            />
            <h2 className="mt-4 text-lg font-semibold">
              No services match your search.
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Try another search term or clear your filters.
            </p>
            <Button
              type="button"
              radius="full"
              onPress={clearFilters}
              className="mt-5 bg-wedplan-rose font-semibold text-white"
            >
              Clear filters
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
