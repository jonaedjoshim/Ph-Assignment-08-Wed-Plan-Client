import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[#eaded8]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="font-semibold text-wedplan-ink">
          Wed<span className="text-wedplan-rose">Plan</span>
        </Link>

        <p>Wedding planning, made personal.</p>

        <Link href="/services" className="transition hover:text-wedplan-rose">
          Explore services
        </Link>
      </div>
    </footer>
  );
}
