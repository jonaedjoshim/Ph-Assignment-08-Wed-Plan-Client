"use client";

import { addToast } from "@heroui/react";
import { ArrowLeft, Check, Crown, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { SiteFooter } from "@/components/footer";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

type AccountRole = "customer" | "vendor" | "admin";
type PlanName = "free" | "starter" | "premium";
type PaidPlan = Exclude<PlanName, "free">;

type SubscriptionInfo = {
  plan: PlanName;
  expiresAt: string | null;
};

type SubscriptionRequestState = {
  key: string;
  subscription: SubscriptionInfo | null;
  error: string | null;
};

type PlanFeature = {
  label: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const freeFeatures: PlanFeature[] = [
  { label: "Up to 3 active services" },
  { label: "Basic vendor dashboard" },
  { label: "Booking request management" },
];

const starterFeatures: PlanFeature[] = [
  { label: "Up to 10 active services" },
  { label: "Basic vendor dashboard" },
  { label: "Booking request management" },
];

const premiumFeatures: PlanFeature[] = [
  { label: "Unlimited active services" },
  { label: "Premium vendor badge" },
  { label: "All Starter plan features" },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isPlanName(value: unknown): value is PlanName {
  return value === "free" || value === "starter" || value === "premium";
}

function getAccountRole(value: unknown): AccountRole | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.role === "customer" ||
    value.role === "vendor" ||
    value.role === "admin"
  ) {
    return value.role;
  }

  return null;
}

function getApiErrorMessage(value: unknown): string | null {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return null;
}

function getSubscriptionFromDashboard(value: unknown): SubscriptionInfo | null {
  if (
    !isRecord(value) ||
    value.success !== true ||
    !isRecord(value.dashboard) ||
    !isRecord(value.dashboard.subscription)
  ) {
    return null;
  }

  const subscription = value.dashboard.subscription;

  if (
    !isPlanName(subscription.plan) ||
    !isNullableString(subscription.expiresAt)
  ) {
    return null;
  }

  return {
    plan: subscription.plan,
    expiresAt: subscription.expiresAt,
  };
}

function isCheckoutResponse(
  value: unknown,
): value is { success: true; url: string } {
  return (
    isRecord(value) &&
    value.success === true &&
    typeof value.url === "string" &&
    value.url.length > 0
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function SubscriptionSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading subscription details
      </p>

      <div className="h-9 w-72 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-96 animate-pulse rounded-2xl border border-[#eaded8] bg-white"
          />
        ))}
      </div>
    </section>
  );
}

function PlanCard({
  title,
  price,
  description,
  features,
  highlighted,
  badge,
  children,
}: {
  title: string;
  price: string;
  description: string;
  features: PlanFeature[];
  highlighted: boolean;
  badge: string | null;
  children: ReactNode;
}) {
  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm sm:p-8 ${
        highlighted ? "border-wedplan-rose" : "border-[#eaded8]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        </div>

        {badge && (
          <span className="shrink-0 rounded-full bg-[#f5eae5] px-3 py-1 text-xs font-semibold text-wedplan-rose">
            {badge}
          </span>
        )}
      </div>

      <p className="mt-6 text-3xl font-semibold tracking-tight">{price}</p>

      <ul className="mt-6 space-y-3">
        {features.map((feature) => (
          <li
            key={feature.label}
            className="flex items-start gap-3 text-sm leading-6 text-stone-700"
          >
            <Check
              aria-hidden="true"
              className="mt-1 h-4 w-4 shrink-0 text-wedplan-rose"
            />
            {feature.label}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">{children}</div>
    </article>
  );
}

function SubscriptionContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const userId = session?.user?.id;
  const accountRole = getAccountRole(session?.user);

  const [retryKey, setRetryKey] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [requestState, setRequestState] = useState<SubscriptionRequestState>({
    key: "",
    subscription: null,
    error: null,
  });

  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${retryKey}`;
  const requestUrl = `${API_BASE_URL}/api/vendor/dashboard`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(
        `/sign-in?callbackURL=${encodeURIComponent("/vendor/subscription")}`,
      );
      return;
    }

    if (accountRole !== "vendor") {
      return;
    }

    const controller = new AbortController();

    async function loadSubscription() {
      try {
        const response = await apiFetch(requestUrl, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace(
            `/sign-in?callbackURL=${encodeURIComponent("/vendor/subscription")}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load subscription (HTTP ${response.status}).`,
          );
        }

        const subscription = getSubscriptionFromDashboard(payload);

        if (!subscription) {
          throw new Error(
            "The vendor dashboard API returned an unexpected response.",
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          subscription,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          subscription: null,
          error:
            requestError instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : requestError instanceof Error
                ? requestError.message
                : "Could not load your subscription.",
        });
      }
    }

    void loadSubscription();

    return () => controller.abort();
  }, [accountRole, isSessionPending, requestKey, requestUrl, router, userId]);

  async function handleUpgrade(plan: PaidPlan) {
    if (isCheckingOut) {
      return;
    }

    setIsCheckingOut(true);

    try {
      const response = await apiFetch(`${API_BASE_URL}/api/stripe/checkout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.replace(
          `/sign-in?callbackURL=${encodeURIComponent("/vendor/subscription")}`,
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(payload) ??
            `Could not start checkout (HTTP ${response.status}).`,
        );
      }

      if (!isCheckoutResponse(payload)) {
        throw new Error("The checkout API returned an unexpected response.");
      }

      window.location.assign(payload.url);
      return;
    } catch (requestError) {
      const errorMessage =
        requestError instanceof TypeError
          ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
          : requestError instanceof Error
            ? requestError.message
            : "Could not start checkout.";

      addToast({
        title: "Checkout not started",
        description: errorMessage,
        color: "danger",
      });
      setIsCheckingOut(false);
    }
  }

  const hasCurrentResult = requestState.key === requestKey;
  const isLoading =
    isSessionPending ||
    !userId ||
    (accountRole === "vendor" && !hasCurrentResult);
  const subscription = hasCurrentResult ? requestState.subscription : null;
  const error = hasCurrentResult ? requestState.error : null;

  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  if (!userId || accountRole !== "vendor") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <ShieldCheck
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">Vendor access required</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Subscription management is available to vendor accounts.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-10 items-center rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
        >
          Back to home
        </Link>
      </section>
    );
  }

  if (error || !subscription) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <Crown
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">
          Subscription unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {error ?? "Could not load your subscription."}
        </p>
        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
      </section>
    );
  }

  const currentPlan = subscription.plan;
  const isPaidPlan = currentPlan !== "free";

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/vendor"
        className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-wedplan-rose"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
          Vendor subscription
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Choose your plan
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          Free vendors can keep up to three active services. Starter raises that
          to ten, and Premium removes the limit entirely.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <PlanCard
          title="Free Plan"
          price="$0"
          description="Start listing your wedding services at no cost."
          features={freeFeatures}
          highlighted={false}
          badge={currentPlan === "free" ? "Current plan" : null}
        >
          <p className="text-sm leading-6 text-stone-600">
            {isPaidPlan
              ? "Your paid plan includes everything in the Free plan."
              : "This is your current plan."}
          </p>
        </PlanCard>

        <PlanCard
          title="Starter Plan"
          price="$10/month"
          description="List more services as your business grows."
          features={starterFeatures}
          highlighted={currentPlan === "starter"}
          badge={
            currentPlan === "starter"
              ? "Current plan"
              : currentPlan === "free"
                ? "Most popular"
                : null
          }
        >
          {currentPlan === "starter" ? (
            <div className="rounded-xl bg-[#f8f2ef] p-4 text-sm leading-6 text-stone-700">
              <p className="font-semibold text-wedplan-ink">Starter is active</p>
              <p className="mt-1">
                Access is active through {formatDate(subscription.expiresAt)}.
              </p>
            </div>
          ) : currentPlan === "premium" ? (
            <p className="text-sm leading-6 text-stone-600">
              Your Premium plan already includes everything in Starter.
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleUpgrade("starter")}
                disabled={isCheckingOut}
                aria-busy={isCheckingOut}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-wedplan-rose px-6 text-sm font-semibold text-wedplan-rose transition hover:bg-[#f8f2ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wedplan-rose focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Crown aria-hidden="true" className="h-4 w-4" />
                {isCheckingOut
                  ? "Opening Stripe Checkout..."
                  : "Upgrade to Starter"}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-stone-500">
                Activates after Stripe confirms your payment.
              </p>
            </>
          )}
        </PlanCard>

        <PlanCard
          title="Premium Plan"
          price="$20/month"
          description="Grow without limits and stand out with a Premium badge."
          features={premiumFeatures}
          highlighted={currentPlan === "premium"}
          badge={currentPlan === "premium" ? "Current plan" : null}
        >
          {currentPlan === "premium" ? (
            <div className="rounded-xl bg-[#f8f2ef] p-4 text-sm leading-6 text-stone-700">
              <p className="font-semibold text-wedplan-ink">
                Premium is active
              </p>
              <p className="mt-1">
                Access is active through {formatDate(subscription.expiresAt)}.
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void handleUpgrade("premium")}
                disabled={isCheckingOut}
                aria-busy={isCheckingOut}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-wedplan-rose px-6 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wedplan-rose focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Crown aria-hidden="true" className="h-4 w-4" />
                {isCheckingOut
                  ? "Opening Stripe Checkout..."
                  : "Upgrade to Premium"}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-stone-500">
                You will be redirected to Stripe. Premium activates only after
                Stripe confirms your payment.
              </p>
            </>
          )}
        </PlanCard>
      </div>
    </section>
  );
}

export default function VendorSubscriptionPage() {
  return (
    <div className="bg-wedplan-cream text-wedplan-ink">
      <main className="min-h-[70vh]">
        <Suspense fallback={<SubscriptionSkeleton />}>
          <SubscriptionContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
