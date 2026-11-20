"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { SiteFooter } from "@/components/footer";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

type AccountRole = "customer" | "vendor" | "admin";

type BookingStats = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
};

type CustomerDashboard = {
  bookings: BookingStats;
};

type DashboardResponse = {
  success: true;
  dashboard: CustomerDashboard;
};

type DashboardRequestState = {
  key: string;
  dashboard: CustomerDashboard | null;
  error: string | null;
};

type MetricCardProps = {
  label: string;
  value: number;
  icon: ReactNode;
  href: string;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
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

function isBookingStats(value: unknown): value is BookingStats {
  return (
    isRecord(value) &&
    isCount(value.total) &&
    isCount(value.pending) &&
    isCount(value.accepted) &&
    isCount(value.rejected) &&
    isCount(value.cancelled)
  );
}

function isCustomerDashboard(value: unknown): value is CustomerDashboard {
  return isRecord(value) && isBookingStats(value.bookings);
}

function isDashboardResponse(value: unknown): value is DashboardResponse {
  return (
    isRecord(value) &&
    value.success === true &&
    isCustomerDashboard(value.dashboard)
  );
}

function getApiErrorMessage(value: unknown): string | null {
  if (isRecord(value) && typeof value.message === "string") {
    return value.message;
  }

  return null;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function CustomerDashboardSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading customer dashboard
      </p>

      <div className="h-9 w-72 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-2xl border border-[#eaded8] bg-white"
          />
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl border border-[#eaded8] bg-white"
          />
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon, href }: MetricCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm transition hover:border-[#d9c4bb] hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-stone-600">{label}</span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f5eae5] text-wedplan-rose">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-wedplan-ink">
        {formatCount(value)}
      </p>
    </Link>
  );
}

function CustomerDashboardContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const userId = session?.user?.id;
  const accountRole = getAccountRole(session?.user);

  const [retryKey, setRetryKey] = useState(0);
  const [requestState, setRequestState] = useState<DashboardRequestState>({
    key: "",
    dashboard: null,
    error: null,
  });

  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${retryKey}`;
  const requestUrl = `${API_BASE_URL}/api/customer/dashboard`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(`/sign-in?callbackURL=${encodeURIComponent("/customer")}`);
      return;
    }

    if (accountRole !== "customer") {
      return;
    }

    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const response = await apiFetch(requestUrl, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (controller.signal.aborted) {
          return;
        }

        if (response.status === 401) {
          setRequestState({
            key: requestKey,
            dashboard: null,
            error:
              "Your session could not be verified. Please try again. If this continues, sign out and sign in again.",
          });
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load dashboard (HTTP ${response.status}).`,
          );
        }

        if (!isDashboardResponse(payload)) {
          throw new Error(
            "The customer dashboard API returned an unexpected response.",
          );
        }

        setRequestState({
          key: requestKey,
          dashboard: payload.dashboard,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          dashboard: null,
          error:
            requestError instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : requestError instanceof Error
                ? requestError.message
                : "Could not load your dashboard.",
        });
      }
    }

    void loadDashboard();

    return () => controller.abort();
  }, [accountRole, isSessionPending, requestKey, requestUrl, router, userId]);

  const hasCurrentResult = requestState.key === requestKey;
  const isLoading =
    isSessionPending ||
    !userId ||
    (accountRole === "customer" && !hasCurrentResult);
  const dashboard = hasCurrentResult ? requestState.dashboard : null;
  const error = hasCurrentResult ? requestState.error : null;

  if (isLoading) {
    return <CustomerDashboardSkeleton />;
  }

  if (!userId || accountRole !== "customer") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <ShieldCheck
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">
          Customer access required
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          The customer dashboard is available to customer accounts.
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

  if (error || !dashboard) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <CalendarDays
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">Dashboard unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {error ?? "Could not load your dashboard."}
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

  const bookings = dashboard.bookings;

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
            Customer workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
            Keep track of your wedding service requests and discover vendors for
            your celebration.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRetryKey((current) => current + 1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e3d4cd] bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5]"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-wedplan-ink">
            Booking overview
          </h2>
          <Link
            href="/bookings"
            className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-wedplan-rose hover:underline"
          >
            View booking history
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="All bookings"
            value={bookings.total}
            icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
            href="/bookings"
          />
          <MetricCard
            label="Pending"
            value={bookings.pending}
            icon={<Clock aria-hidden="true" className="h-5 w-5" />}
            href="/bookings"
          />
          <MetricCard
            label="Accepted"
            value={bookings.accepted}
            icon={<Check aria-hidden="true" className="h-5 w-5" />}
            href="/bookings"
          />
          <MetricCard
            label="Rejected or cancelled"
            value={bookings.rejected + bookings.cancelled}
            icon={<X aria-hidden="true" className="h-5 w-5" />}
            href="/bookings"
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-wedplan-ink">Quick links</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            href="/services"
            className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-[#eaded8] bg-white p-5 transition hover:border-[#d9c4bb]"
          >
            <span className="flex items-center gap-3">
              <Search
                aria-hidden="true"
                className="h-5 w-5 text-wedplan-rose"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Browse services
                </span>
                <span className="mt-1 block text-sm text-stone-600">
                  Find vendors for your wedding.
                </span>
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-stone-500"
            />
          </Link>

          <Link
            href="/settings/profile"
            className="flex min-h-24 items-center justify-between gap-4 rounded-2xl border border-[#eaded8] bg-white p-5 transition hover:border-[#d9c4bb]"
          >
            <span className="flex items-center gap-3">
              <UserRound
                aria-hidden="true"
                className="h-5 w-5 text-wedplan-rose"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Profile settings
                </span>
                <span className="mt-1 block text-sm text-stone-600">
                  Update your account information.
                </span>
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-stone-500"
            />
          </Link>
        </div>
      </section>
    </section>
  );
}

export default function CustomerDashboardPage() {
  return (
    <div className="bg-wedplan-cream text-wedplan-ink">
      <main className="min-h-[70vh]">
        <Suspense fallback={<CustomerDashboardSkeleton />}>
          <CustomerDashboardContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
