import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

function SiteHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-20 animate-pulse border-b border-[#eaded8] bg-white"
    />
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="mx-auto flex flex-1 max-w-3xl items-center px-5 py-16 sm:px-8">
        <section className="w-full rounded-3xl border border-[#eaded8] bg-white p-7 text-center shadow-sm sm:p-10">
          <CheckCircle2
            aria-hidden="true"
            className="mx-auto h-12 w-12 text-emerald-700"
          />

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
            Checkout complete
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Thank you for upgrading
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-600">
            Stripe is confirming your subscription. Your paid plan is enabled
            only after WedPlan verifies the payment notification. If your
            service page still shows the Free plan, wait briefly and reload it.
          </p>

          <Link
            href="/vendor/services"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-wedplan-rose px-6 text-sm font-semibold text-white transition hover:brightness-95"
          >
            Return to vendor services
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
