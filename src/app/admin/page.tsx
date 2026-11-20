"use client";

import {
  ArrowRight,
  Briefcase,
  Clock3,
  CreditCard,
  Layers,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { authClient } from "@/lib/auth-client";

type AccountRole = "customer" | "vendor" | "admin";

type AdminOverview = {
  totalUsers: number;
  totalCustomers: number;
  totalVendors: number;
  totalServices: number;
  pendingServices: number;
  totalTransactions: number;
};

type AdminOverviewResponse = {
  success: true;
  overview: AdminOverview;
};

type OverviewRequestState = {
  key: string;
  overview: AdminOverview | null;
  error: string | null;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const overviewCards: {
  key: keyof AdminOverview;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    key: "totalUsers",
    label: "Total users",
    description: "All registered accounts",
    icon: Users,
  },
  {
    key: "totalCustomers",
    label: "Customers",
    description: "Customer accounts",
    icon: UserRound,
  },
  {
    key: "totalVendors",
    label: "Vendors",
    description: "Vendor accounts",
    icon: Briefcase,
  },
  {
    key: "totalServices",
    label: "Services",
    description: "All submitted services",
    icon: Layers,
  },
  {
    key: "pendingServices",
    label: "Pending services",
    description: "Waiting for moderation",
    icon: Clock3,
  },
  {
    key: "totalTransactions",
    label: "Transactions",
    description: "Recorded payment transactions",
    icon: CreditCard,
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isAdminOverviewResponse(
  value: unknown,
): value is AdminOverviewResponse {
  if (!isRecord(value) || value.success !== true || !isRecord(value.overview)) {
    return false;
  }

  return (
    isNonNegativeInteger(value.overview.totalUsers) &&
    isNonNegativeInteger(value.overview.totalCustomers) &&
    isNonNegativeInteger(value.overview.totalVendors) &&
    isNonNegativeInteger(value.overview.totalServices) &&
    isNonNegativeInteger(value.overview.pendingServices) &&
    isNonNegativeInteger(value.overview.totalTransactions)
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

function SiteHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-20 animate-pulse border-b border-[#eaded8] bg-white"
    />
  );
}

function AdminOverviewSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading admin overview
      </p>

      <div className="h-5 w-36 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-4 h-10 w-72 max-w-full animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-[30rem] max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[#eaded8] bg-white p-5"
          >
            <div className="h-10 w-10 animate-pulse rounded-xl bg-[#eaded8]" />
            <div className="mt-5 h-4 w-28 animate-pulse rounded bg-[#eaded8]" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-[#f0e8e4]" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-[#f0e8e4]" />
          </div>
        ))}
      </div>

      <div className="mt-10 h-6 w-48 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {[0, 1].map((item) => (
          <div
            key={item}
            className="h-36 animate-pulse rounded-2xl bg-[#eaded8]"
          />
        ))}
      </div>
    </section>
  );
}

function AdminOverviewContent() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  const userId = session?.user?.id;
  const accountRole = getAccountRole(session?.user);

  const [refreshKey, setRefreshKey] = useState(0);
  const [requestState, setRequestState] = useState<OverviewRequestState>({
    key: "",
    overview: null,
    error: null,
  });

  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${refreshKey}`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(`/sign-in?callbackURL=${encodeURIComponent("/admin")}`);
      return;
    }

    if (accountRole !== "admin") {
      return;
    }

    const controller = new AbortController();

    async function loadOverview() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/overview`, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace(
            `/sign-in?callbackURL=${encodeURIComponent("/admin")}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load the admin overview (HTTP ${response.status}).`,
          );
        }

        if (!isAdminOverviewResponse(payload)) {
          throw new Error(
            "The admin overview API returned an unexpected response.",
          );
        }

        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          overview: payload.overview,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          overview: null,
          error:
            requestError instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : requestError instanceof Error
                ? requestError.message
                : "Could not load the admin overview.",
        });
      }
    }

    void loadOverview();

    return () => controller.abort();
  }, [accountRole, isSessionPending, requestKey, router, userId]);

  const hasCurrentResult = requestState.key === requestKey;
  const overview = hasCurrentResult ? requestState.overview : null;
  const error = hasCurrentResult ? requestState.error : null;
  const isLoading =
    isSessionPending ||
    !userId ||
    (accountRole === "admin" && !hasCurrentResult);

  if (isLoading) {
    return <AdminOverviewSkeleton />;
  }

  if (!userId || accountRole !== "admin") {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <ShieldCheck
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">Admin access required</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Only admin accounts can view the admin dashboard.
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

  if (error || !overview) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-semibold">Overview unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {error ?? "The admin overview could not be loaded."}
        </p>
        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-full bg-wedplan-rose px-5 text-sm font-semibold text-white"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="rounded-3xl border border-[#eaded8] bg-white p-6 shadow-sm sm:p-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Admin dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Review WedPlan accounts, service listings, and platform activity.
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#e3d4cd] px-5 text-sm font-semibold text-wedplan-ink transition hover:bg-[#f5eae5]"
          >
            View marketplace
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overviewCards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.key}
              className="rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f5eae5] text-wedplan-rose">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-medium text-stone-600">
                {card.label}
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {formatCount(overview[card.key])}
              </p>
              <p className="mt-2 text-sm text-stone-500">{card.description}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Admin actions</h2>
        <p className="mt-2 text-sm text-stone-600">
          Go to a management page to review and update platform records.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/users"
            className="group rounded-2xl border border-[#eaded8] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f5eae5] text-wedplan-rose">
                  <Users aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Manage users</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Search accounts, filter by role, and block or unblock users.
                </p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="mt-2 h-5 w-5 shrink-0 text-wedplan-rose transition group-hover:translate-x-1"
              />
            </div>
          </Link>

          <Link
            href="/admin/services"
            className="group rounded-2xl border border-[#eaded8] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f5eae5] text-wedplan-rose">
                  <Layers aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Review services</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Check submitted listings and moderate pending services.
                </p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="mt-2 h-5 w-5 shrink-0 text-wedplan-rose transition group-hover:translate-x-1"
              />
            </div>
          </Link>

          <Link
            href="/admin/transactions"
            className="group rounded-2xl border border-[#eaded8] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f5eae5] text-wedplan-rose">
                  <CreditCard aria-hidden="true" className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">
                  View transactions
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Review Stripe payment records and subscription invoices.
                </p>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="mt-2 h-5 w-5 shrink-0 text-wedplan-rose transition group-hover:translate-x-1"
              />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function AdminOverviewPage() {
  return (
    <div className="min-h-screen bg-wedplan-cream text-wedplan-ink">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeader />
      </Suspense>

      <main className="min-h-[70vh]">
        <Suspense fallback={<AdminOverviewSkeleton />}>
          <AdminOverviewContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}
