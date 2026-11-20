"use client";

import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  LayoutGrid,
  RefreshCw,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SiteFooter } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";

type AccountRole = "customer" | "vendor" | "admin";

type UserStats = {
  total: number;
  customers: number;
  vendors: number;
  admins: number;
};

type ServiceStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  active: number;
};

type TransactionStats = {
  total: number;
  paid: number;
  failed: number;
};

type BookingStats = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
};

type AdminStats = {
  users: UserStats;
  services: ServiceStats;
  transactions: TransactionStats;
  bookings: BookingStats;
};

type OverviewResponse = {
  success: true;
  stats: AdminStats;
};

type OverviewRequestState = {
  key: string;
  stats: AdminStats | null;
  error: string | null;
};

type MetricCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
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

function isUserStats(value: unknown): value is UserStats {
  return (
    isRecord(value) &&
    isCount(value.total) &&
    isCount(value.customers) &&
    isCount(value.vendors) &&
    isCount(value.admins)
  );
}

function isServiceStats(value: unknown): value is ServiceStats {
  return (
    isRecord(value) &&
    isCount(value.total) &&
    isCount(value.pending) &&
    isCount(value.approved) &&
    isCount(value.rejected) &&
    isCount(value.active)
  );
}

function isTransactionStats(value: unknown): value is TransactionStats {
  return (
    isRecord(value) &&
    isCount(value.total) &&
    isCount(value.paid) &&
    isCount(value.failed)
  );
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

function isAdminStats(value: unknown): value is AdminStats {
  return (
    isRecord(value) &&
    isUserStats(value.users) &&
    isServiceStats(value.services) &&
    isTransactionStats(value.transactions) &&
    isBookingStats(value.bookings)
  );
}

function isOverviewResponse(value: unknown): value is OverviewResponse {
  return isRecord(value) && value.success === true && isAdminStats(value.stats);
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

function AdminOverviewSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="sr-only">
        Loading admin statistics
      </p>

      <div className="h-9 w-72 animate-pulse rounded bg-[#eaded8]" />
      <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-[#f0e8e4]" />

      {[0, 1, 2, 3].map((section) => (
        <div key={section} className="mt-8">
          <div className="h-6 w-40 animate-pulse rounded bg-[#eaded8]" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl border border-[#eaded8] bg-white"
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function SiteHeaderSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-20 animate-pulse border-b border-[#eaded8] bg-white"
    />
  );
}

function MetricCard({ label, value, icon, href }: MetricCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-stone-600">{label}</span>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f5eae5] text-wedplan-rose">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-wedplan-ink">
        {formatCount(value)}
      </p>
    </>
  );

  const className =
    "rounded-2xl border border-[#eaded8] bg-white p-5 shadow-sm transition hover:border-[#d9c4bb]";

  if (href) {
    return (
      <Link href={href} className={`block ${className}`}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function MetricSection({
  title,
  metrics,
}: {
  title: string;
  metrics: MetricCardProps[];
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-wedplan-ink">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
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
    stats: null,
    error: null,
  });

  const requestKey = `${userId ?? "anonymous"}:${accountRole ?? "unknown"}:${refreshKey}`;
  const requestUrl = `${API_BASE_URL}/api/admin/overview`;

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!userId) {
      router.replace(
        `/sign-in?callbackURL=${encodeURIComponent("/admin/overview")}`,
      );
      return;
    }

    if (accountRole !== "admin") {
      return;
    }

    const controller = new AbortController();

    async function loadOverview() {
      try {
        const response = await apiFetch(requestUrl, {
          credentials: "include",
          signal: controller.signal,
        });

        const payload: unknown = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace(
            `/sign-in?callbackURL=${encodeURIComponent("/admin/overview")}`,
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(payload) ??
              `Could not load overview (HTTP ${response.status}).`,
          );
        }

        if (!isOverviewResponse(payload)) {
          throw new Error("The overview API returned an unexpected response.");
        }

        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          stats: payload.stats,
          error: null,
        });
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setRequestState({
          key: requestKey,
          stats: null,
          error:
            requestError instanceof TypeError
              ? "Could not reach WedPlan API. Check that the server is running and NEXT_PUBLIC_API_URL is correct."
              : requestError instanceof Error
                ? requestError.message
                : "Could not load admin statistics.",
        });
      }
    }

    void loadOverview();

    return () => controller.abort();
  }, [accountRole, isSessionPending, requestKey, requestUrl, router, userId]);

  const hasCurrentResult = requestState.key === requestKey;
  const isLoading =
    isSessionPending ||
    !userId ||
    (accountRole === "admin" && !hasCurrentResult);
  const stats = hasCurrentResult ? requestState.stats : null;
  const error = hasCurrentResult ? requestState.error : null;

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
          Only admin accounts can view platform statistics.
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

  if (error || !stats) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8">
        <Activity
          aria-hidden="true"
          className="mx-auto h-9 w-9 text-wedplan-rose"
        />
        <h1 className="mt-4 text-2xl font-semibold">Overview unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {error ?? "Could not load admin statistics."}
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-wedplan-rose"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to admin dashboard
        </Link>

        <button
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e3d4cd] bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-[#f5eae5]"
        >
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-wedplan-rose">
          Admin workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Platform overview
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          Review current user, service, payment, and booking totals.
        </p>
      </div>

      <MetricSection
        title="Users"
        metrics={[
          {
            label: "All users",
            value: stats.users.total,
            icon: <Users aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/users",
          },
          {
            label: "Customers",
            value: stats.users.customers,
            icon: <Users aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/users",
          },
          {
            label: "Vendors",
            value: stats.users.vendors,
            icon: <Store aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/users",
          },
          {
            label: "Administrators",
            value: stats.users.admins,
            icon: <ShieldCheck aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/users",
          },
        ]}
      />

      <MetricSection
        title="Services"
        metrics={[
          {
            label: "All services",
            value: stats.services.total,
            icon: <LayoutGrid aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/services",
          },
          {
            label: "Pending review",
            value: stats.services.pending,
            icon: <Clock aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/services",
          },
          {
            label: "Approved",
            value: stats.services.approved,
            icon: <Check aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/services",
          },
          {
            label: "Active",
            value: stats.services.active,
            icon: <Activity aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/services",
          },
        ]}
      />

      <MetricSection
        title="Transactions"
        metrics={[
          {
            label: "All transactions",
            value: stats.transactions.total,
            icon: <CreditCard aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/transactions",
          },
          {
            label: "Paid",
            value: stats.transactions.paid,
            icon: <Check aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/transactions",
          },
          {
            label: "Failed",
            value: stats.transactions.failed,
            icon: <X aria-hidden="true" className="h-5 w-5" />,
            href: "/admin/transactions",
          },
        ]}
      />

      <MetricSection
        title="Bookings"
        metrics={[
          {
            label: "All bookings",
            value: stats.bookings.total,
            icon: <CalendarDays aria-hidden="true" className="h-5 w-5" />,
          },
          {
            label: "Pending",
            value: stats.bookings.pending,
            icon: <Clock aria-hidden="true" className="h-5 w-5" />,
          },
          {
            label: "Accepted",
            value: stats.bookings.accepted,
            icon: <Check aria-hidden="true" className="h-5 w-5" />,
          },
          {
            label: "Rejected or cancelled",
            value: stats.bookings.rejected + stats.bookings.cancelled,
            icon: <X aria-hidden="true" className="h-5 w-5" />,
          },
        ]}
      />
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
