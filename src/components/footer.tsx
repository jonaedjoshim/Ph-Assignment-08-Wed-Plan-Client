import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

const footerLinkGroups = [
  {
    title: "Explore",
    links: [
      { label: "Find services", href: "/services" },
      { label: "Categories", href: "/categories" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    title: "For vendors",
    links: [
      { label: "Vendor dashboard", href: "/vendor" },
      { label: "Manage services", href: "/vendor/services" },
      { label: "Plans & pricing", href: "/vendor/subscription" },
    ],
  },
  {
    title: "Your account",
    links: [
      { label: "Sign in", href: "/sign-in" },
      { label: "Create account", href: "/sign-up" },
      { label: "My bookings", href: "/bookings" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#eaded8] bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)] lg:gap-8">
          <div className="max-w-xs">
            <BrandLogo
              iconClassName="h-9 w-9"
              wordmarkClassName="text-lg"
            />
            <p className="mt-4 text-sm leading-6 text-stone-500">
              Wedding planning, made personal. Discover trusted local vendors
              and bring your celebration to life.
            </p>
          </div>

          {footerLinkGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-ink">
                {group.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-500 transition hover:text-wedplan-rose"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#eaded8]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© WedPlan. All rights reserved.</p>
          <p>Made for memorable celebrations.</p>
        </div>
      </div>
    </footer>
  );
}
