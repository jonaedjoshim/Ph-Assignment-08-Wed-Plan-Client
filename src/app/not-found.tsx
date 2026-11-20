import { ArrowLeft, Home, SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

function SiteHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[73px] border-b border-[#eaded8]/70 bg-[#fffaf7]/90"
    />
  );
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 py-16 sm:px-8">
        <section className="flex max-w-lg flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-[#f5eae5] text-wedplan-rose">
            <SearchX aria-hidden="true" className="h-8 w-8" />
          </span>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
            Error 404
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-4 text-base leading-7 text-stone-600">
            The page you are looking for does not exist or may have been moved.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-wedplan-rose px-6 text-sm font-semibold text-white transition hover:bg-[#81484d]"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Go to home
            </Link>
            <Link
              href="/services"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e3d4cd] px-6 text-sm font-semibold text-wedplan-ink transition hover:bg-[#f5eae5]"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Browse services
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
